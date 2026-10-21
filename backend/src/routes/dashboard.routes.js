const express = require('express');
const store = require('../dataStore');

const router = express.Router();

router.get('/overview/:projectId', (req, res) => {
  const { projectId } = req.params;
  let project = store.projects.find(p => p.id === projectId);
  if (!project && store.projects.length > 0) {
    project = store.projects[0];
  }
  if (!project) return res.status(404).json({ error: 'No projects found' });

  const meth = store.methodologies.find(m => m.id === project.methodologyId);
  const phases = store.phases.filter(ph => ph.projectId === project.id).map(ph => ({
    ...ph,
    artifacts: store.artifacts.filter(a => a.phaseId === ph.id).map(a => ({
      ...a,
      approvers: store.approvers.filter(app => app.artifactId === a.id),
      reviewers: store.reviewers.filter(r => r.artifactId === a.id)
    }))
  })).sort((a,b) => a.sequence - b.sequence);

  const members = store.projectMembers.filter(pm => pm.projectId === project.id).map(pm => ({
    ...pm,
    user: store.users.find(u => u.id === pm.userId)
  }));

  const artifacts = store.artifacts.filter(a => a.projectId === project.id).map(a => ({
    ...a,
    reviewers: store.reviewers.filter(r => r.artifactId === a.id),
    approvers: store.approvers.filter(app => app.artifactId === a.id)
  }));

  const totalArtifacts = artifacts.length;
  const publishedArtifacts = artifacts.filter(a => a.status === 'Published').length;
  const overallProgressPct = totalArtifacts > 0 ? Math.round((publishedArtifacts / totalArtifacts) * 100) : 0;

  const allApprovals = artifacts.flatMap(a => a.approvers || []);
  const approvedCount = allApprovals.filter(app => app && app.status === 'Approved').length;

  const currentPhase = phases.find(p => p.id === project.currentPhaseId) || phases[0];
  const blockers = [];
  if (currentPhase) {
    const pendingPhaseArtifacts = (currentPhase.artifacts || []).filter(a => a.status !== 'Published' && a.status !== 'Approved');
    if (pendingPhaseArtifacts.length > 0) {
      blockers.push(`${pendingPhaseArtifacts.length} pending in ${currentPhase.name}`);
    }
    const pendingApprovals = (currentPhase.artifacts || []).flatMap(a => a.approvers || []).filter(app => app && app.status === 'Pending');
    if (pendingApprovals.length > 0) {
      blockers.push(`${pendingApprovals.length} approvals pending`);
    }
  }

  // Active actions needed computed dynamically from real artifacts
  const actionsNeeded = [];
  artifacts.filter(a => a.status === 'Under Review' || a.status === 'Submitted').forEach(a => {
    actionsNeeded.push({
      id: `act-${a.id}`,
      title: a.title,
      artifactType: a.artifactType,
      reason: '',
      actionLabel: 'Review',
      linkUrl: `/documents/${a.id}`
    });
  });

  return res.json({
    project: { ...project, methodology: meth, phases, members, artifacts },
    overallProgressPct,
    totalArtifacts,
    publishedArtifacts,
    approvalsSummary: `${approvedCount} / ${allApprovals.length || 0} completed`,
    currentPhase,
    blockers,
    actionsNeeded
  });
});

router.get('/user-work', async (req, res) => {
  const userId = req.query.userId || req.user?.id || 'usr-admin-01';
  let user = null;
  try {
    const User = require('../models/User');
    user = await User.findOne({ id: userId }).lean();
    if (!user) {
      user = await User.findOne({ email: new RegExp(`^${userId}$`, 'i') }).lean();
    }
  } catch (e) {}

  if (!user) {
    user = store.users.find(u => u.id === userId || u.email?.toLowerCase() === (userId || '').toLowerCase()) || store.users[0];
  }

  const nextActions = [];

  // 1. Pending Deliverables to Upload for Active Phase (Role-based Pending Work)
  for (const proj of store.projects) {
    const activePhase = store.phases.find(ph => ph.id === proj.currentPhaseId) || store.phases.find(ph => ph.projectId === proj.id && ph.sequence === 1);
    if (!activePhase) continue;

    const phaseArtifacts = store.artifacts.filter(a => a.projectId === proj.id && a.phaseId === activePhase.id);

    phaseArtifacts.forEach(art => {
      // If deliverable is already submitted/approved/published, it is COMPLETED -> do NOT show in pending works
      if (art.status === 'Submitted' || art.status === 'Approved' || art.status === 'Published' || (art.fileName && art.status !== 'Draft' && art.status !== 'Changes Requested')) {
        return;
      }

      const isOwnerUser = art.ownerId === user?.id;
      const isPm = user?.role === 'Project Manager';
      const roleMatches = (art.owner?.role && art.owner.role.toLowerCase() === user?.role.toLowerCase());

      const docTypeLower = (art.artifactType || '').toLowerCase();

      let assignedRole = 'Designated Lead';
      if (docTypeLower.includes('plan') || docTypeLower.includes('charter') || docTypeLower.includes('risk') || docTypeLower.includes('vision') || docTypeLower.includes('roadmap') || docTypeLower.includes('goal') || docTypeLower.includes('review') || docTypeLower.includes('retro')) {
        assignedRole = 'Project Manager';
      } else if (docTypeLower.includes('srs') || docTypeLower.includes('brd') || docTypeLower.includes('rtm') || docTypeLower.includes('usecase') || docTypeLower.includes('story') || docTypeLower.includes('backlog') || docTypeLower.includes('feasibility')) {
        assignedRole = 'Business Analyst';
      } else if (docTypeLower.includes('hld') || docTypeLower.includes('arch') || docTypeLower.includes('deployment')) {
        assignedRole = 'Technical Architect';
      } else if (docTypeLower.includes('lld') || docTypeLower.includes('sprintbacklog') || docTypeLower.includes('incident')) {
        assignedRole = 'Team Lead';
      } else if (docTypeLower.includes('tech') || docTypeLower.includes('api') || docTypeLower.includes('integration')) {
        assignedRole = 'Developer';
      } else if (docTypeLower.includes('test') || docTypeLower.includes('bug')) {
        assignedRole = 'Tester / QA';
      } else if (docTypeLower.includes('ui') || docTypeLower.includes('design') || docTypeLower.includes('wireframe')) {
        assignedRole = 'UI/UX Designer';
      } else if (docTypeLower.includes('database') || docTypeLower.includes('schema')) {
        assignedRole = 'Database Administrator';
      }

      const isRoleResponsible = user?.role === assignedRole || (isPm && assignedRole === 'Project Manager') || isOwnerUser || roleMatches;

      if (isRoleResponsible) {
        nextActions.push({
          id: `pending-upload-${art.id}`,
          title: `Upload Deliverable: ${art.title}`,
          description: '',
          actionLabel: 'Upload Document',
          linkUrl: `/documents/${art.id}`,
          priority: art.blocksNextPhase ? 'High' : 'Medium',
          category: 'Upload Deliverable',
          projectName: proj.name,
          phaseName: activePhase.name,
          artifactType: art.artifactType,
          status: art.status
        });
      }
    });
  }

  // 2. Changes Requested / Revisions Needed
  const ownedArtifacts = store.artifacts.filter(a => a.ownerId === user?.id).map(a => ({
    ...a,
    project: store.projects.find(p => p.id === a.projectId),
    phase: store.phases.find(ph => ph.id === a.phaseId)
  }));

  ownedArtifacts.filter(a => a.status === 'Changes Requested').forEach(a => {
    nextActions.push({
      id: `rev-${a.id}`,
      title: `Revise ${a.title}`,
      description: '',
      actionLabel: 'Revise & Resubmit',
      linkUrl: `/documents/${a.id}`,
      priority: 'High',
      category: 'Revision'
    });
  });

  // 3. Technical Reviews Pending
  const userReviews = store.reviewers.filter(r => r.userId === user?.id || (user?.role && r.roleName === user.role)).map(r => ({
    ...r,
    artifact: store.artifacts.find(a => a.id === r.artifactId)
  }));

  userReviews.filter(r => r.status === 'Pending' && r.artifact && r.artifact.status === 'Submitted').forEach(r => {
    nextActions.push({
      id: `rev-pending-${r.id}`,
      title: `Technical Review: ${r.artifact.title}`,
      description: '',
      actionLabel: 'Review Document',
      linkUrl: `/documents/${r.artifact.id}`,
      priority: 'High',
      category: 'Review'
    });
  });

  // 4. Signoff Approvals Pending
  const userApprovals = store.approvers.filter(a => a.userId === user?.id || (user?.role && a.roleName === user.role)).map(app => ({
    ...app,
    artifact: store.artifacts.find(a => a.id === app.artifactId)
  }));

  userApprovals.filter(a => a.status === 'Pending' && a.artifact && a.artifact.status === 'Submitted').forEach(app => {
    nextActions.push({
      id: `app-pending-${app.id}`,
      title: `Signoff: ${app.artifact.title}`,
      description: '',
      actionLabel: 'Review & Sign Off',
      linkUrl: `/approvals`,
      priority: 'High',
      category: 'Approval'
    });
  });

  return res.json({
    user,
    nextActions,
    ownedArtifacts: ownedArtifacts.filter(a => a.status === 'Draft' || a.status === 'Changes Requested'),
    pendingReviews: userReviews.filter(r => r.status === 'Pending'),
    pendingApprovals: userApprovals.filter(a => a.status === 'Pending')
  });
});

// Real-Data Project Analytics API for Graphical Visualizations
router.get('/analytics/:projectId', async (req, res) => {
  const { projectId } = req.params;
  let project = store.projects.find(p => p.id === projectId);
  if (!project && store.projects.length > 0) {
    project = store.projects[0];
  }

  // Fallback check MongoDB if in-memory is empty
  if (!project) {
    try {
      const Project = require('../models/Project');
      const dbProj = await Project.findOne({ id: projectId }).lean() || await Project.findOne({}).lean();
      if (dbProj) {
        project = dbProj;
        if (!store.projects.some(p => p.id === dbProj.id)) store.projects.push(dbProj);
      }
    } catch (e) {}
  }

  if (!project) return res.status(404).json({ error: 'No project found' });

  const methodology = store.methodologies.find(m => m.id === project.methodologyId) || store.methodologies[0];

  // 1. Ensure project phases exist
  let projectPhases = store.phases.filter(ph => ph.projectId === project.id);
  if (projectPhases.length === 0 && methodology && methodology.phases) {
    projectPhases = methodology.phases.map(p => ({
      id: `ph-${project.id}-${p.sequence}`,
      projectId: project.id,
      methodologyPhaseId: p.id,
      name: p.name,
      sequence: p.sequence,
      status: p.sequence === 1 ? 'InProgress' : 'Locked',
      startDate: p.sequence === 1 ? new Date() : null,
      endDate: null
    }));
    store.phases.push(...projectPhases);
  }

  // 2. Auto-reconcile required deliverables from methodology
  if (methodology && methodology.requiredArtifacts) {
    methodology.requiredArtifacts.forEach((def, idx) => {
      const targetPhase = projectPhases.find(p => p.name.toLowerCase() === def.phaseName.toLowerCase()) || projectPhases[0];
      if (!targetPhase) return;

      const existing = store.artifacts.find(
        a => a.projectId === project.id && (a.title.toLowerCase() === def.name.toLowerCase() || a.artifactType.toLowerCase() === def.artifactType.toLowerCase())
      );

      if (!existing) {
        const ownerUser = store.users.find(u => u.role === def.ownerRole) || store.users[0];
        const artifactId = `art-${project.id}-${idx + 1}-${Date.now().toString().slice(-4)}`;
        const newArt = {
          id: artifactId,
          projectId: project.id,
          phaseId: targetPhase.id,
          artifactType: def.artifactType,
          title: def.name,
          description: `${targetPhase.name} Phase Deliverable`,
          ownerId: ownerUser ? ownerUser.id : 'usr-pm-01',
          status: 'Draft',
          currentVersion: '1.0',
          origin: 'Methodology Framework',
          blocksNextPhase: def.blocksPhase ?? true,
          content: ''
        };
        store.artifacts.push(newArt);
      }
    });
  }

  const phases = store.phases
    .filter(ph => ph.projectId === project.id)
    .sort((a, b) => a.sequence - b.sequence);

  const artifacts = store.artifacts.filter(a => a.projectId === project.id);
  const totalArtifacts = artifacts.length;
  const submittedArtifacts = artifacts.filter(a => a.status === 'Submitted').length;
  const approvedArtifacts = artifacts.filter(a => a.status === 'Approved' || a.status === 'Published').length;
  const draftArtifacts = artifacts.filter(a => a.status === 'Draft' || a.status === 'Changes Requested').length;
  const completedArtifacts = submittedArtifacts + approvedArtifacts;

  const overallProgressPct = totalArtifacts > 0 ? Math.round((completedArtifacts / totalArtifacts) * 100) : 0;

  // Phase-wise Graphical Metric Data
  const phaseMetrics = phases.map(ph => {
    const phArts = artifacts.filter(a => a.phaseId === ph.id);
    const total = phArts.length;
    const submitted = phArts.filter(a => a.status === 'Submitted' || a.status === 'Approved' || a.status === 'Published').length;
    const pending = total - submitted;
    const pct = total > 0 ? Math.round((submitted / total) * 100) : 0;

    return {
      phaseId: ph.id,
      sequence: ph.sequence,
      phaseName: ph.name,
      total,
      submitted,
      pending,
      completionRate: pct,
      status: ph.status
    };
  });

  // Status Breakdown for Doughnut/Pie Chart
  const statusDistribution = [
    { name: 'Approved', value: approvedArtifacts, color: '#10B981' },
    { name: 'Submitted / Review', value: submittedArtifacts, color: '#3B82F6' },
    { name: 'Pending Upload', value: draftArtifacts, color: '#F59E0B' }
  ];

  // Role Workload & Contribution Breakdown
  const roleCounts = {};
  artifacts.forEach(a => {
    const docTypeLower = (a.artifactType || '').toLowerCase();
    let roleName = 'Project Manager';
    if (docTypeLower.includes('srs') || docTypeLower.includes('brd') || docTypeLower.includes('rtm') || docTypeLower.includes('feasibility')) roleName = 'Business Analyst';
    else if (docTypeLower.includes('hld') || docTypeLower.includes('arch')) roleName = 'Technical Architect';
    else if (docTypeLower.includes('lld')) roleName = 'Team Lead';
    else if (docTypeLower.includes('tech') || docTypeLower.includes('api')) roleName = 'Developer';
    else if (docTypeLower.includes('test') || docTypeLower.includes('bug')) roleName = 'Tester / QA';
    else if (docTypeLower.includes('ui') || docTypeLower.includes('design')) roleName = 'UI/UX Designer';
    else if (docTypeLower.includes('database')) roleName = 'Database Admin';

    if (!roleCounts[roleName]) {
      roleCounts[roleName] = { role: roleName, total: 0, completed: 0, pending: 0 };
    }
    roleCounts[roleName].total += 1;
    if (a.status === 'Submitted' || a.status === 'Approved' || a.status === 'Published') {
      roleCounts[roleName].completed += 1;
    } else {
      roleCounts[roleName].pending += 1;
    }
  });

  const roleWorkload = Object.values(roleCounts);
  const activePhase = phases.find(p => p.id === project.currentPhaseId) || phases.find(p => p.status === 'InProgress') || phases[0];

  return res.json({
    projectId: project.id,
    projectName: project.name,
    projectCode: project.code,
    overallProgressPct,
    totalArtifacts,
    completedArtifacts,
    pendingArtifacts: draftArtifacts,
    approvedArtifacts,
    totalPhases: phases.length,
    activePhaseName: activePhase?.name || 'Planning',
    phaseMetrics,
    statusDistribution,
    roleWorkload
  });
});

module.exports = router;
