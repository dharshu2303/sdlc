const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { supabaseAdmin } = require('../config/supabaseClient');
const { recordAuditLog, createNotification } = require('../utils/auditLogger');

const router = express.Router();

// Supported dispute categories
const DISPUTE_TYPES = [
  'REQUIREMENT_CONFLICT',
  'DESIGN_TRADEOFF',
  'APPROVAL_DEADLOCK',
  'SCOPE_CREEP',
  'PRIORITY_CONFLICT',
  'VERSION_CONFLICT',
  'QUALITY_STANDARD'
];

// Helper to sanitize / normalize dispute payload
const normalizeDispute = (d, users = [], artifacts = [], projects = []) => {
  const raiser = users.find(u => u.id === d.raised_by || u.id === d.raisedBy);
  const mediator = users.find(u => u.id === d.assigned_mediator || u.id === d.assignedMediator);
  const escalated = users.find(u => u.id === d.escalated_to || u.id === d.escalatedTo);
  const artifact = artifacts.find(a => a.id === d.artifact_id || a.id === d.artifactId);
  const project = projects.find(p => p.id === d.project_id || p.id === d.projectId);

  return {
    id: d.id,
    projectId: d.project_id || d.projectId,
    projectName: project ? project.name : (d.projectName || 'SDLC Governance Project'),
    artifactId: d.artifact_id || d.artifactId,
    artifactTitle: artifact ? artifact.title : (d.artifactTitle || 'All Deliverables'),
    phaseId: d.phase_id || d.phaseId,
    title: d.title,
    description: d.description,
    disputeType: d.dispute_type || d.disputeType,
    priority: d.priority || 'Medium',
    status: d.status || 'Open',
    raisedBy: raiser ? { id: raiser.id, name: raiser.name, role: raiser.role, avatar: raiser.avatar } : { name: 'SDLC Contributor', role: 'Member' },
    assignedMediator: mediator ? { id: mediator.id, name: mediator.name, role: mediator.role } : null,
    escalatedTo: escalated ? { id: escalated.id, name: escalated.name, role: escalated.role } : null,
    resolution: d.resolution,
    resolvedAt: d.resolved_at || d.resolvedAt,
    createdAt: d.created_at || d.createdAt,
    updatedAt: d.updated_at || d.updatedAt,
    commentsCount: d.comments_count || 0,
    votes: d.votes || { agree: 0, disagree: 0, abstain: 0 }
  };
};

// 1. GET /api/disputes - List disputes with filters
router.get('/', async (req, res) => {
  try {
    const { projectId, status, disputeType, priority, search } = req.query;
    let query = supabaseAdmin.from('disputes').select('*');

    if (projectId) query = query.eq('project_id', projectId);
    if (status && status !== 'All') query = query.eq('status', status);
    if (disputeType && disputeType !== 'All') query = query.eq('dispute_type', disputeType);
    if (priority && priority !== 'All') query = query.eq('priority', priority);

    const { data: disputes, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching disputes:', error.message);
      return res.status(500).json({ error: 'Failed to retrieve disputes' });
    }

    // Fetch related users & artifacts for display enrichment
    const { data: users } = await supabaseAdmin.from('users').select('id, name, role, avatar');
    const { data: artifacts } = await supabaseAdmin.from('artifacts').select('id, title');
    const { data: projects } = await supabaseAdmin.from('projects').select('id, name');

    let list = (disputes || []).map(d => normalizeDispute(d, users || [], artifacts || [], projects || []));

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.disputeType.toLowerCase().includes(q)
      );
    }

    return res.json(list);
  } catch (err) {
    console.error('Disputes GET error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 2. GET /api/disputes/analytics - Aggregated Dispute Intelligence
router.get('/analytics', async (req, res) => {
  try {
    const { data: disputes } = await supabaseAdmin.from('disputes').select('*');
    const list = disputes || [];

    const byStatus = {
      Open: 0,
      'Under Discussion': 0,
      Voting: 0,
      Mediation: 0,
      Resolved: 0,
      Escalated: 0,
      Closed: 0
    };

    const byType = {};
    DISPUTE_TYPES.forEach(t => { byType[t] = 0; });

    const byPriority = { Critical: 0, High: 0, Medium: 0, Low: 0 };

    let totalResolutionDays = 0;
    let resolvedCount = 0;

    list.forEach(d => {
      if (byStatus[d.status] !== undefined) byStatus[d.status]++;
      if (byType[d.dispute_type] !== undefined) byType[d.dispute_type]++;
      if (byPriority[d.priority] !== undefined) byPriority[d.priority]++;

      if (d.status === 'Resolved' && d.resolved_at && d.created_at) {
        const created = new Date(d.created_at);
        const resolved = new Date(d.resolved_at);
        const days = Math.max(1, Math.round((resolved - created) / (1000 * 60 * 60 * 24)));
        totalResolutionDays += days;
        resolvedCount++;
      }
    });

    const avgResolutionDays = resolvedCount > 0 ? (totalResolutionDays / resolvedCount).toFixed(1) : '2.4';

    return res.json({
      totalDisputes: list.length,
      activeDisputes: list.filter(d => d.status !== 'Resolved' && d.status !== 'Closed').length,
      resolvedDisputes: resolvedCount,
      avgResolutionDays,
      byStatus,
      byType,
      byPriority,
      types: DISPUTE_TYPES
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. GET /api/disputes/:id - Single dispute detail with comments and votes
router.get('/:id', async (req, res) => {
  try {
    const { data: dispute, error } = await supabaseAdmin
      .from('disputes')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !dispute) {
      return res.status(404).json({ error: 'Dispute record not found' });
    }

    // Fetch comments
    const { data: comments } = await supabaseAdmin
      .from('dispute_comments')
      .select('*')
      .eq('dispute_id', dispute.id)
      .order('created_at', { ascending: true });

    // Fetch votes
    const { data: votes } = await supabaseAdmin
      .from('dispute_votes')
      .select('*')
      .eq('dispute_id', dispute.id);

    // Fetch users for author names
    const { data: users } = await supabaseAdmin.from('users').select('id, name, role, avatar');
    const { data: artifacts } = await supabaseAdmin.from('artifacts').select('id, title, content, current_version');
    const { data: projects } = await supabaseAdmin.from('projects').select('id, name, code');

    const normalized = normalizeDispute(dispute, users || [], artifacts || [], projects || []);

    const enrichedComments = (comments || []).map(c => {
      const u = (users || []).find(user => user.id === c.user_id);
      return {
        id: c.id,
        content: c.content,
        isResolutionProposal: c.is_resolution_proposal,
        createdAt: c.created_at,
        user: u ? { id: u.id, name: u.name, role: u.role, avatar: u.avatar } : { name: 'Participant', role: 'Member' }
      };
    });

    const enrichedVotes = (votes || []).map(v => {
      const u = (users || []).find(user => user.id === v.user_id);
      return {
        id: v.id,
        vote: v.vote,
        reason: v.reason,
        createdAt: v.created_at,
        user: u ? { id: u.id, name: u.name, role: u.role } : { name: 'Member' }
      };
    });

    const voteSummary = {
      agree: (votes || []).filter(v => v.vote === 'agree').length,
      disagree: (votes || []).filter(v => v.vote === 'disagree').length,
      abstain: (votes || []).filter(v => v.vote === 'abstain').length
    };

    return res.json({
      ...normalized,
      comments: enrichedComments,
      votes: enrichedVotes,
      voteSummary
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. POST /api/disputes - Raise a new dispute
router.post('/', async (req, res) => {
  try {
    const { projectId, artifactId, phaseId, title, description, disputeType, priority } = req.body;

    if (!title || !description || !disputeType) {
      return res.status(400).json({ error: 'Title, description, and dispute type are required.' });
    }

    const userId = req.user?.id || 'usr-ba-01';
    const disputeId = uuidv4();

    const newRecord = {
      id: disputeId,
      project_id: projectId || null,
      artifact_id: artifactId || null,
      phase_id: phaseId || null,
      title: title.trim(),
      description: description.trim(),
      dispute_type: disputeType,
      priority: priority || 'Medium',
      status: 'Open',
      raised_by: userId,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin.from('disputes').insert(newRecord).select().single();

    if (error) {
      console.error('Error inserting dispute:', error.message);
      return res.status(500).json({ error: 'Could not create dispute record' });
    }

    await recordAuditLog({
      projectId,
      entityType: 'Dispute',
      entityId: disputeId,
      action: 'DISPUTE_RAISED',
      userId,
      userName: req.user?.name || 'SDLC Contributor',
      userRole: req.user?.role || 'Member',
      documentTitle: title,
      details: `Raised ${priority} priority dispute: "${title}" (${disputeType})`
    });

    return res.status(201).json(data || newRecord);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 5. POST /api/disputes/:id/comments - Add threaded discussion comment / resolution proposal
router.post('/:id/comments', async (req, res) => {
  try {
    const { content, isResolutionProposal } = req.body;
    if (!content) return res.status(400).json({ error: 'Comment content cannot be empty.' });

    const userId = req.user?.id || 'usr-ta-01';
    const commentId = uuidv4();

    const comment = {
      id: commentId,
      dispute_id: req.params.id,
      user_id: userId,
      content: content.trim(),
      is_resolution_proposal: Boolean(isResolutionProposal),
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin.from('dispute_comments').insert(comment).select().single();
    if (error) return res.status(500).json({ error: error.message });

    // Transition from Open -> Under Discussion if currently Open
    await supabaseAdmin
      .from('disputes')
      .update({ status: 'Under Discussion', updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('status', 'Open');

    return res.status(201).json(data || comment);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 6. POST /api/disputes/:id/vote - Cast vote on dispute resolution
router.post('/:id/vote', async (req, res) => {
  try {
    const { vote, reason } = req.body;
    if (!['agree', 'disagree', 'abstain'].includes(vote)) {
      return res.status(400).json({ error: 'Vote must be agree, disagree, or abstain.' });
    }

    const userId = req.user?.id || 'usr-pm-01';
    const voteRecord = {
      id: uuidv4(),
      dispute_id: req.params.id,
      user_id: userId,
      vote,
      reason: reason || '',
      created_at: new Date().toISOString()
    };

    // Upsert vote
    const { data, error } = await supabaseAdmin
      .from('dispute_votes')
      .upsert(voteRecord, { onConflict: 'dispute_id,user_id' })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    // Transition status to Voting if Under Discussion
    await supabaseAdmin
      .from('disputes')
      .update({ status: 'Voting', updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('status', 'Under Discussion');

    return res.json(data || voteRecord);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 7. POST /api/disputes/:id/resolve - Issue binding resolution
router.post('/:id/resolve', async (req, res) => {
  try {
    const { resolution } = req.body;
    if (!resolution) return res.status(400).json({ error: 'Resolution explanation is required.' });

    const userId = req.user?.id || 'usr-pm-01';
    const resolvedAt = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('disputes')
      .update({
        status: 'Resolved',
        resolution: resolution.trim(),
        resolved_at: resolvedAt,
        updated_at: resolvedAt
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    await recordAuditLog({
      entityType: 'Dispute',
      entityId: req.params.id,
      action: 'DISPUTE_RESOLVED',
      userId,
      userName: req.user?.name || 'Mediator / PM',
      userRole: req.user?.role || 'Project Manager',
      details: `Formally resolved dispute with binding resolution: "${resolution.substring(0, 80)}..."`
    });

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 8. POST /api/disputes/:id/escalate - Escalate to higher authority
router.post('/:id/escalate', async (req, res) => {
  try {
    const { escalatedTo, reason } = req.body;
    const userId = req.user?.id || 'usr-pm-01';

    const { data, error } = await supabaseAdmin
      .from('disputes')
      .update({
        status: 'Escalated',
        escalated_to: escalatedTo || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    await recordAuditLog({
      entityType: 'Dispute',
      entityId: req.params.id,
      action: 'DISPUTE_ESCALATED',
      userId,
      userName: req.user?.name || 'SDLC Contributor',
      userRole: req.user?.role || 'Member',
      details: `Escalated dispute to project steering committee. Reason: "${reason || 'Stalemate reached.'}"`
    });

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
