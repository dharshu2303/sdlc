const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { supabaseAdmin } = require('../config/supabaseClient');
const { recordAuditLog } = require('../utils/auditLogger');

const router = express.Router();

// 1. GET /api/projects - List all projects
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabaseAdmin.from('projects').select('*');
    if (status && status !== 'All') {
      query = query.eq('status', status);
    }

    const [{ data: projects, error }, { data: methodologies }, { data: allPhases }, { data: allArtifacts }, { data: allMembers }] = await Promise.all([
      query.order('created_at', { ascending: false }),
      supabaseAdmin.from('methodologies').select('id, name, code'),
      supabaseAdmin.from('phases').select('id, project_id, name, sequence, status, progress'),
      supabaseAdmin.from('artifacts').select('id, project_id, phase_id, title, artifact_type, status'),
      supabaseAdmin.from('project_members').select('id, project_id')
    ]);
    if (error) return res.status(500).json({ error: error.message });

    const result = (projects || []).map(p => {
      const meth = (methodologies || []).find(m => m.id === p.methodology_id);
      const phases = (allPhases || []).filter(ph => ph.project_id === p.id);
      const artifacts = (allArtifacts || []).filter(a => a.project_id === p.id);

      const completedPhases = phases.filter(ph => ph.status === 'Completed').length;
      const progress = phases.length > 0 ? Math.round((completedPhases / phases.length) * 100) : 0;

      return {
        id: p.id,
        name: p.name,
        code: p.code,
        description: p.description,
        clientName: p.client_name,
        startDate: p.start_date,
        endDate: p.end_date,
        type: p.type,
        priority: p.priority || 'Medium',
        status: p.status || 'Active',
        currentPhaseId: p.current_phase_id,
        methodology: meth ? { id: meth.id, name: meth.name } : { name: 'Waterfall (7-Phase SDLC)' },
        progress,
        phases: phases.sort((a, b) => a.sequence - b.sequence),
        phasesCount: phases.length,
        artifactsCount: artifacts.length,
        publishedCount: artifacts.filter(a => a.status === 'Published').length,
        artifacts,
        membersCount: (allMembers || []).filter(m => m.project_id === p.id).length,
        createdAt: p.created_at
      };
    });

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. GET /api/projects/:id - Full project details
router.get('/:id', async (req, res) => {
  try {
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Parallel DB queries for maximum performance
    const [
      { data: phases },
      { data: artifacts },
      { data: members },
      { data: users },
      { data: meth }
    ] = await Promise.all([
      supabaseAdmin.from('phases').select('*').eq('project_id', project.id).order('sequence', { ascending: true }),
      supabaseAdmin.from('artifacts').select('*').eq('project_id', project.id),
      supabaseAdmin.from('project_members').select('*').eq('project_id', project.id),
      supabaseAdmin.from('users').select('id, name, email, role, avatar'),
      supabaseAdmin.from('methodologies').select('*').eq('id', project.methodology_id).single()
    ]);

    const enrichedArtifacts = (artifacts || []).map(a => {
      const owner = (users || []).find(u => u.id === a.owner_id);
      return {
        id: a.id,
        projectId: a.project_id,
        phaseId: a.phase_id,
        artifactType: a.artifact_type,
        title: a.title,
        description: a.description,
        currentVersion: a.current_version,
        status: a.status,
        blocksNextPhase: a.blocks_next_phase,
        owner: owner ? { id: owner.id, name: owner.name, role: owner.role, avatar: owner.avatar } : { name: 'Author' },
        createdAt: a.created_at
      };
    });

    const enrichedMembers = (members || []).map(m => {
      const u = (users || []).find(user => user.id === m.user_id);
      return {
        id: m.id,
        projectId: m.project_id,
        userId: m.user_id,
        roleName: m.role_name,
        user: u ? { name: u.name, email: u.email, role: u.role, avatar: u.avatar } : null
      };
    });

    return res.json({
      id: project.id,
      name: project.name,
      code: project.code,
      description: project.description,
      clientName: project.client_name,
      startDate: project.start_date,
      endDate: project.end_date,
      type: project.type,
      priority: project.priority,
      status: project.status,
      currentPhaseId: project.current_phase_id,
      methodology: meth || { id: 'meth-waterfall', name: 'Waterfall (7-Phase SDLC)' },
      phases: phases || [],
      artifacts: enrichedArtifacts,
      members: enrichedMembers
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. POST /api/projects/wizard - Create project via Guided Wizard
router.post('/wizard', async (req, res) => {
  try {
    const { name, code, description, clientName, startDate, endDate, type, priority, methodologyId, members } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Project name and unique code are required.' });
    }

    const projectId = `proj-${Date.now()}`;
    const methId = methodologyId || 'meth-waterfall';

    // 1. Create project record
    const projectRecord = {
      id: projectId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description || '',
      client_name: clientName || '',
      start_date: startDate || new Date().toISOString().split('T')[0],
      end_date: endDate || null,
      type: type || 'Enterprise Web Platform',
      priority: priority || 'Medium',
      methodology_id: methId,
      status: 'Active',
      created_at: new Date().toISOString()
    };

    await supabaseAdmin.from('projects').insert(projectRecord);

    // 2. Generate standard SDLC Phases based on methodology
    const defaultWaterfallPhases = [
      { name: 'Planning', sequence: 1, planned_days: 10 },
      { name: 'Requirements', sequence: 2, planned_days: 14 },
      { name: 'Design', sequence: 3, planned_days: 15 },
      { name: 'Development', sequence: 4, planned_days: 30 },
      { name: 'Testing', sequence: 5, planned_days: 20 },
      { name: 'Deployment', sequence: 6, planned_days: 10 },
      { name: 'Maintenance', sequence: 7, planned_days: 15 }
    ];

    const phaseRecords = defaultWaterfallPhases.map((p, idx) => ({
      id: `ph-${projectId}-${idx + 1}`,
      project_id: projectId,
      name: p.name,
      sequence: p.sequence,
      status: idx === 0 ? 'InProgress' : 'Locked',
      progress: 0,
      is_blocked: idx > 0,
      block_reason: idx > 0 ? `Previous phase "${defaultWaterfallPhases[idx - 1].name}" must pass gate review.` : null,
      planned_days: p.planned_days,
      actual_days: 0,
      created_at: new Date().toISOString()
    }));

    await supabaseAdmin.from('phases').insert(phaseRecords);

    // Set project's currentPhaseId
    await supabaseAdmin.from('projects').update({ current_phase_id: phaseRecords[0].id }).eq('id', projectId);

    // 3. Create starter deliverable templates
    const starterDeliverables = [
      { phaseIdx: 0, type: 'Charter', title: 'Project Charter & Scope Definition' },
      { phaseIdx: 0, type: 'ProjectPlan', title: 'Master Project Management Plan' },
      { phaseIdx: 1, type: 'SRS', title: 'Software Requirements Specification (SRS)' },
      { phaseIdx: 1, type: 'RTM', title: 'Requirement Traceability Matrix (RTM)' },
      { phaseIdx: 2, type: 'HLD', title: 'High-Level Design (HLD) Specification' },
      { phaseIdx: 2, type: 'LLD', title: 'Low-Level Design (LLD) & API Specs' },
      { phaseIdx: 3, type: 'TechnicalDoc', title: 'Technical Architecture Specification' },
      { phaseIdx: 4, type: 'TestPlan', title: 'System Quality Assurance & Test Plan' },
      { phaseIdx: 5, type: 'DeploymentPlan', title: 'Production Deployment Runbook' }
    ];

    const userId = req.user?.id || 'usr-pm-01';

    const artifactRecords = starterDeliverables.map((d, i) => ({
      id: `art-${projectId}-${i + 1}`,
      project_id: projectId,
      phase_id: phaseRecords[d.phaseIdx].id,
      artifact_type: d.type,
      title: d.title,
      description: `Official ${d.type} deliverable for ${name}`,
      owner_id: userId,
      status: 'Not Started',
      current_version: '1.0',
      blocks_next_phase: true,
      content: `# ${d.title}\n\nDocument initialized for project ${name}.`,
      created_at: new Date().toISOString()
    }));

    await supabaseAdmin.from('artifacts').insert(artifactRecords);

    // 4. Assign project members
    if (members && Array.isArray(members) && members.length > 0) {
      const memberRecords = members.map(m => ({
        id: uuidv4(),
        project_id: projectId,
        user_id: m.userId || m.id,
        role_name: m.roleName || m.role || 'Contributor',
        created_at: new Date().toISOString()
      }));
      await supabaseAdmin.from('project_members').insert(memberRecords);
    } else {
      // Default assign creator as PM
      await supabaseAdmin.from('project_members').insert({
        id: uuidv4(),
        project_id: projectId,
        user_id: userId,
        role_name: 'Project Manager',
        created_at: new Date().toISOString()
      });
    }

    await recordAuditLog({
      projectId,
      entityType: 'Project',
      entityId: projectId,
      action: 'PROJECT_CREATED',
      userId,
      userName: req.user?.name || 'Project Manager',
      userRole: 'Project Manager',
      documentTitle: name,
      details: `Initialized new governed SDLC project "${name}" (${code}) with 7 sequential phases.`
    });

    return res.status(201).json({ projectId, message: 'Project initialized successfully.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. PUT /api/projects/:id - Update project metadata
router.put('/:id', async (req, res) => {
  try {
    const { name, code, description, clientName, priority, status } = req.body;
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (code) updateData.code = code.trim().toUpperCase();
    if (description !== undefined) updateData.description = description;
    if (clientName !== undefined) updateData.client_name = clientName;
    if (priority) updateData.priority = priority;
    if (status) updateData.status = status;

    const { data, error } = await supabaseAdmin
      .from('projects')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ error: 'Project not found' });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 5. DELETE /api/projects/:id - Delete project
router.delete('/:id', async (req, res) => {
  try {
    if (!['Project Manager', 'Admin'].includes(req.user?.role)) {
      return res.status(403).json({ error: 'Only a Project Manager or Admin can delete projects.' });
    }
    const { data: project } = await supabaseAdmin.from('projects').select('*').eq('id', req.params.id).single();
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const { data: artifacts } = await supabaseAdmin.from('artifacts').select('id').eq('project_id', req.params.id);
    const artifactIds = (artifacts || []).map(artifact => artifact.id);
    const { data: disputes } = await supabaseAdmin.from('disputes').select('id').eq('project_id', req.params.id);
    for (const dispute of disputes || []) {
      await supabaseAdmin.from('dispute_comments').delete().eq('dispute_id', dispute.id);
      await supabaseAdmin.from('dispute_votes').delete().eq('dispute_id', dispute.id);
    }
    await supabaseAdmin.from('disputes').delete().eq('project_id', req.params.id);
    if (artifactIds.length) {
      await supabaseAdmin.from('artifact_versions').delete().in('artifact_id', artifactIds);
      await supabaseAdmin.from('artifact_reviewers').delete().in('artifact_id', artifactIds);
      await supabaseAdmin.from('artifact_approvers').delete().in('artifact_id', artifactIds);
      await supabaseAdmin.from('traceability_links').delete().in('source_artifact_id', artifactIds);
      await supabaseAdmin.from('traceability_links').delete().in('target_artifact_id', artifactIds);
    }
    await supabaseAdmin.from('meetings').delete().eq('project_id', req.params.id);
    await supabaseAdmin.from('artifacts').delete().eq('project_id', req.params.id);
    await supabaseAdmin.from('phases').delete().eq('project_id', req.params.id);
    await supabaseAdmin.from('project_members').delete().eq('project_id', req.params.id);
    const { error } = await supabaseAdmin.from('projects').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });

    return res.json({ message: `Project ${project.name} successfully deleted.` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 6. PUT /api/projects/phases/:phaseId - Update phase status
router.put('/phases/:phaseId', async (req, res) => {
  try {
    const { status, progress, blockReason, isBlocked } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (progress !== undefined) updateData.progress = progress;
    if (blockReason !== undefined) updateData.block_reason = blockReason;
    if (isBlocked !== undefined) updateData.is_blocked = isBlocked;

    const { data, error } = await supabaseAdmin
      .from('phases')
      .update(updateData)
      .eq('id', req.params.phaseId)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
