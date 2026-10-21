const express = require('express');
const store = require('../dataStore');
const { syncEntityToMongo } = require('../config/db');

const router = express.Router();

router.get('/', (req, res) => {
  const result = store.projects.map(p => {
    const meth = store.methodologies.find(m => m.id === p.methodologyId);
    const phases = store.phases.filter(ph => ph.projectId === p.id);
    const members = store.projectMembers.filter(pm => pm.projectId === p.id).map(pm => ({
      ...pm,
      user: store.users.find(u => u.id === pm.userId)
    }));
    const artifacts = store.artifacts.filter(a => a.projectId === p.id);
    return { ...p, methodology: meth, phases, members, artifacts };
  });
  return res.json(result);
});

router.get('/:id', (req, res) => {
  const project = store.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const methodology = store.methodologies.find(m => m.id === project.methodologyId);

  // Auto-reconcile and ensure all phase deliverables exist for this project
  if (methodology && methodology.requiredArtifacts) {
    const projectPhases = store.phases.filter(ph => ph.projectId === project.id);
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
        syncEntityToMongo('artifacts', newArt);
      }
    });
  }

  const phases = store.phases.filter(ph => ph.projectId === project.id).map(ph => ({
    ...ph,
    artifacts: store.artifacts.filter(a => a.phaseId === ph.id)
  }));
  const members = store.projectMembers.filter(pm => pm.projectId === project.id).map(pm => ({
    ...pm,
    user: store.users.find(u => u.id === pm.userId)
  }));
  const artifacts = store.artifacts.filter(a => a.projectId === project.id).map(a => ({
    ...a,
    owner: store.users.find(u => u.id === a.ownerId),
    reviewers: store.reviewers.filter(r => r.artifactId === a.id).map(r => ({ ...r, user: store.users.find(u => u.id === r.userId) })),
    approvers: store.approvers.filter(app => app.artifactId === a.id).map(app => ({ ...app, user: store.users.find(u => u.id === app.userId) })),
    versions: store.versions.filter(v => v.artifactId === a.id)
  }));
  const meetings = store.meetings.filter(m => m.projectId === project.id);
  const decisions = store.decisions.filter(d => d.projectId === project.id);

  return res.json({
    ...project,
    methodology,
    phases,
    members,
    artifacts,
    meetings,
    decisions
  });
});

// Guided Project Creation Wizard API
router.post('/wizard', (req, res) => {
  if (req.user && req.user.role !== 'Project Manager') {
    return res.status(403).json({ error: 'Access Denied: Only Project Managers are authorized to create new SDLC projects.' });
  }

  const { name, code, description, clientName, startDate, endDate, type, priority, methodologyId, roleAssignments } = req.body;
  const meth = store.methodologies.find(m => m.id === methodologyId) || store.methodologies[0];

  const projectId = `proj-${Date.now()}`;
  const newProject = {
    id: projectId,
    name,
    code: code || `PRJ-${Math.floor(Math.random()*1000)}`,
    description,
    clientName,
    startDate,
    endDate,
    type: type || 'Web Application',
    priority: priority || 'Medium',
    orgId: 'org-01',
    methodologyId: meth.id,
    currentPhaseId: null,
    status: 'Active',
    createdAt: new Date()
  };

  store.projects.unshift(newProject);

  // Assign Members
  const roleUserMap = {};
  if (roleAssignments && Array.isArray(roleAssignments)) {
    roleAssignments.forEach(ra => {
      roleUserMap[ra.roleName] = ra.userId;
      store.projectMembers.push({
        id: `pm-${Date.now()}-${Math.random()}`,
        projectId,
        userId: ra.userId,
        roleName: ra.roleName
      });
    });
  }

  // Create Phases with Planned Timelines
  const { phaseDurations = {} } = req.body;
  const createdPhases = [];
  meth.phases.forEach((mp, i) => {
    const plannedDays = parseInt(phaseDurations[mp.name] || phaseDurations[i+1] || 14, 10);
    const assignedUserId = roleUserMap[mp.ownerRole] || roleUserMap['Project Manager'] || store.users[i % store.users.length].id;
    const assignedUser = store.users.find(u => u.id === assignedUserId);

    const phase = {
      id: `ph-${projectId}-${i+1}`,
      projectId,
      name: mp.name,
      sequence: mp.sequence,
      status: i === 0 ? 'InProgress' : 'Locked',
      progress: 0,
      isBlocked: i === 0,
      plannedDays: plannedDays,
      actualDays: i === 0 ? 1 : 0,
      assignedRole: mp.ownerRole || assignedUser?.role || 'Phase Lead',
      assignedUserId: assignedUserId,
      startedAt: i === 0 ? new Date().toISOString().split('T')[0] : null,
      completedAt: null
    };
    store.phases.push(phase);
    createdPhases.push(phase);
  });

  newProject.currentPhaseId = createdPhases[0]?.id || null;

  // Instantiate Required Artifact Definitions
  (meth.requiredArtifacts || []).forEach((def, idx) => {
    const targetPhase = createdPhases.find(p => p.name.toLowerCase() === def.phaseName.toLowerCase()) || createdPhases[0];
    const ownerUserId = roleUserMap[def.ownerRole] || store.users[0].id;

    const artifactId = `art-${projectId}-${idx+1}`;
    const artifact = {
      id: artifactId,
      projectId,
      phaseId: targetPhase.id,
      artifactType: def.artifactType,
      title: def.name,
      description: `${targetPhase.name} Phase Deliverable`,
      ownerId: ownerUserId,
      status: 'Draft',
      currentVersion: '1.0',
      origin: 'Methodology Framework',
      blocksNextPhase: def.blocksPhase ?? true,
      content: ''
    };

    store.artifacts.push(artifact);

    // Reviewers
    let revRoles = [];
    try { revRoles = JSON.parse(def.reviewerRoles || '[]'); } catch(e) { revRoles = [def.reviewerRoles]; }
    revRoles.forEach(rRole => {
      const rUser = roleUserMap[rRole] || store.users[2].id;
      store.reviewers.push({
        id: `rev-${Date.now()}-${Math.random()}`,
        artifactId,
        userId: rUser,
        roleName: rRole,
        status: 'Pending'
      });
    });

    // Approvers
    let appRoles = [];
    try { appRoles = JSON.parse(def.approverRoles || '[]'); } catch(e) { appRoles = [def.approverRoles]; }
    appRoles.forEach((aRole, sIdx) => {
      const aUser = roleUserMap[aRole] || store.users[0].id;
      store.approvers.push({
        id: `app-${Date.now()}-${Math.random()}`,
        artifactId,
        userId: aUser,
        roleName: aRole,
        sequence: sIdx + 1,
        status: 'Pending'
      });
    });

    syncEntityToMongo('artifacts', artifact);
  });

  syncEntityToMongo('projects', newProject);
  createdPhases.forEach(p => syncEntityToMongo('phases', p));

  return res.json({ message: 'Project created successfully', projectId });
});

module.exports = router;
