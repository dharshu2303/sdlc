const express = require('express');
const { supabaseAdmin } = require('../config/supabaseClient');

const router = express.Router();

// 1. GET /api/dashboard/overview/:projectId - Dynamic Project Overview & Health
router.get('/overview/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const { data: project } = await supabaseAdmin.from('projects').select('*').eq('id', projectId).single();
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const { data: phases } = await supabaseAdmin.from('phases').select('*').eq('project_id', projectId).order('sequence', { ascending: true });
    const { data: artifacts } = await supabaseAdmin.from('artifacts').select('*').eq('project_id', projectId);
    const { data: meth } = await supabaseAdmin.from('methodologies').select('*').eq('id', project.methodology_id).single();
    const { data: disputes } = await supabaseAdmin.from('disputes').select('*').eq('project_id', projectId);

    const phaseList = phases || [];
    const artifactList = artifacts || [];
    const disputeList = disputes || [];

    const totalPhases = phaseList.length;
    const completedPhases = phaseList.filter(p => p.status === 'Completed').length;
    const overallProgressPct = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;

    const publishedArtifacts = artifactList.filter(a => a.status === 'Published').length;
    const underReviewArtifacts = artifactList.filter(a => a.status === 'Under Review' || a.status === 'Submitted').length;
    const activeDisputes = disputeList.filter(d => d.status !== 'Resolved' && d.status !== 'Closed').length;

    // Find current active phase
    const currentPhase = phaseList.find(p => p.id === project.current_phase_id) || phaseList.find(p => p.status === 'InProgress') || phaseList[0];

    const blockers = phaseList
      .filter(p => p.is_blocked && p.block_reason)
      .map(p => `${p.name}: ${p.block_reason}`);

    return res.json({
      project: {
        ...project,
        methodology: meth || { name: 'Waterfall (7-Phase SDLC)' },
        phases: phaseList,
        artifacts: artifactList
      },
      overallProgressPct,
      totalArtifacts: artifactList.length,
      publishedArtifacts,
      underReviewArtifacts,
      activeDisputes,
      approvalsSummary: `${publishedArtifacts} / ${artifactList.length} deliverables completed`,
      currentPhase: currentPhase || null,
      blockers
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. GET /api/dashboard/analytics/:projectId - Dynamic Schedule & Phase Variance Metrics
router.get('/analytics/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const { data: project } = await supabaseAdmin.from('projects').select('*').eq('id', projectId).single();
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const { data: phases } = await supabaseAdmin.from('phases').select('*').eq('project_id', projectId).order('sequence', { ascending: true });
    const { data: users } = await supabaseAdmin.from('users').select('id, name, role, avatar');

    const phaseMetrics = (phases || []).map(ph => {
      const planned = ph.planned_days || 14;
      const actual = ph.actual_days || (ph.status === 'Completed' ? planned : (ph.status === 'InProgress' ? Math.round(planned * 0.8) : 0));
      const variance = actual - planned;
      const isDelayed = actual > planned;

      // Assign realistic role owner for SDLC phases
      const roleMap = {
        Planning: 'Project Manager',
        Requirements: 'Business Analyst',
        Design: 'Technical Architect',
        Development: 'Team Lead',
        Testing: 'Tester / QA',
        Deployment: 'Technical Architect',
        Maintenance: 'Project Manager'
      };
      const assignedRole = roleMap[ph.name] || 'Team Lead';
      const assignedUser = (users || []).find(u => u.role === assignedRole) || users?.[0] || { name: 'SDLC Lead', role: assignedRole };

      return {
        phaseId: ph.id,
        phaseName: ph.name,
        sequence: ph.sequence,
        status: ph.status,
        plannedDays: planned,
        actualDays: actual,
        varianceDays: variance,
        isDelayed,
        assignedRole,
        assignedUser
      };
    });

    const totalPlannedDays = phaseMetrics.reduce((sum, p) => sum + p.plannedDays, 0);
    const totalActualDays = phaseMetrics.reduce((sum, p) => sum + p.actualDays, 0);
    const delayedStages = phaseMetrics.filter(p => p.isDelayed);

    const employeeDelays = delayedStages.map(d => ({
      employeeName: d.assignedUser.name,
      role: d.assignedRole,
      phaseName: d.phaseName,
      plannedDays: d.plannedDays,
      actualDays: d.actualDays,
      delayDays: d.varianceDays,
      avatar: d.assignedUser.avatar
    }));

    return res.json({
      projectId: project.id,
      projectName: project.name,
      projectCode: project.code,
      totalPlannedDays,
      totalActualDays,
      overallVarianceDays: totalActualDays - totalPlannedDays,
      phaseMetrics,
      delayedStages,
      employeeDelays
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. GET /api/dashboard/user-work/:userId - Contributor Work Items
router.get('/user-work/:userId', async (req, res) => {
  try {
    const userId = req.params.userId || req.user?.id || 'usr-ba-01';

    const { data: user } = await supabaseAdmin.from('users').select('*').eq('id', userId).single();
    const userRole = user?.role || '';

    // Authored artifacts
    const { data: myArtifacts } = await supabaseAdmin
      .from('artifacts')
      .select('*')
      .eq('owner_id', userId);

    // Pending reviews
    const { data: allReviewers } = await supabaseAdmin.from('artifact_reviewers').select('*').eq('status', 'Pending');
    const myReviews = (allReviewers || []).filter(r => r.user_id === userId || (userRole && r.role_name === userRole));

    // Pending approvals
    const { data: allApprovers } = await supabaseAdmin.from('artifact_approvers').select('*').eq('status', 'Pending');
    const myApprovals = (allApprovers || []).filter(a => a.user_id === userId || (userRole && a.role_name === userRole));

    // Active disputes raised or mediated
    const { data: disputes } = await supabaseAdmin
      .from('disputes')
      .select('*')
      .or(`raised_by.eq.${userId},assigned_mediator.eq.${userId}`);

    // Action items
    const { data: actionItems } = await supabaseAdmin
      .from('action_items')
      .select('*')
      .eq('assignee_id', userId)
      .neq('status', 'Completed');

    return res.json({
      user,
      authoredArtifacts: myArtifacts || [],
      pendingReviewsCount: myReviews.length,
      pendingApprovalsCount: myApprovals.length,
      disputesCount: (disputes || []).length,
      actionItems: actionItems || []
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. GET /api/dashboard/deliverables/:projectId - All Deliverables Breakdown
router.get('/deliverables/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const { data: artifacts } = await supabaseAdmin.from('artifacts').select('*').eq('project_id', projectId);
    const { data: phases } = await supabaseAdmin.from('phases').select('*').eq('project_id', projectId).order('sequence', { ascending: true });
    const { data: users } = await supabaseAdmin.from('users').select('id, name, role, avatar');

    const grouped = (phases || []).map(ph => {
      const deliverables = (artifacts || []).filter(a => a.phase_id === ph.id).map(a => {
        const owner = (users || []).find(u => u.id === a.owner_id);
        return {
          id: a.id,
          artifactType: a.artifact_type,
          title: a.title,
          currentVersion: a.current_version,
          status: a.status,
          owner: owner || { name: 'Deliverable Owner', role: 'Author' },
          blocksNextPhase: a.blocks_next_phase
        };
      });

      return {
        phaseId: ph.id,
        phaseName: ph.name,
        sequence: ph.sequence,
        status: ph.status,
        progress: ph.progress,
        deliverables
      };
    });

    return res.json(grouped);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
