const express = require('express');
const store = require('../dataStore');
const { syncEntityToMongo } = require('../config/db');

const router = express.Router();

// Direct File Download Endpoint
router.get('/download/:id', (req, res) => {
  const artifact = store.artifacts.find(a => a.id === req.params.id);
  if (!artifact) return res.status(404).json({ error: 'Artifact file not found' });

  const fileName = artifact.fileName || `${artifact.artifactType}_${artifact.title.replace(/\s+/g, '_')}_v${artifact.currentVersion}.pdf`;
  const fileContent = artifact.fileData || artifact.content || `# ${artifact.title}\n\nDocument Specification v${artifact.currentVersion}`;

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  return res.send(Buffer.from(fileContent, 'utf-8'));
});

// Download Version Specific File
router.get('/download/version/:versionId', (req, res) => {
  const ver = store.versions.find(v => v.id === req.params.versionId);
  if (!ver) return res.status(404).json({ error: 'Version file snapshot not found' });

  const fileName = ver.fileName || `Version_${ver.versionNumber}.pdf`;
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  return res.send(Buffer.from(ver.content || 'Version Document Snapshot', 'utf-8'));
});

// List Artifacts with File Metadata
router.get('/', (req, res) => {
  const { projectId, phaseId, status, ownerId, search } = req.query;
  let list = store.artifacts;

  if (projectId) list = list.filter(a => a.projectId === projectId);
  if (phaseId) list = list.filter(a => a.phaseId === phaseId);
  if (status) list = list.filter(a => a.status === status);
  if (ownerId) list = list.filter(a => a.ownerId === ownerId);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(a => a.title.toLowerCase().includes(q) || a.artifactType.toLowerCase().includes(q) || (a.fileName && a.fileName.toLowerCase().includes(q)));
  }

  const result = list.map(a => ({
    ...a,
    project: store.projects.find(p => p.id === a.projectId),
    phase: store.phases.find(ph => ph.id === a.phaseId),
    owner: store.users.find(u => u.id === a.ownerId),
    reviewers: store.reviewers.filter(r => r.artifactId === a.id).map(r => ({ ...r, user: store.users.find(u => u.id === r.userId) })),
    approvers: store.approvers.filter(app => app.artifactId === a.id).map(app => ({ ...app, user: store.users.find(u => u.id === app.userId) })),
    versions: store.versions.filter(v => v.artifactId === a.id)
  }));

  return res.json(result);
});

// Get Single Artifact
router.get('/:id', (req, res) => {
  const artifact = store.artifacts.find(a => a.id === req.params.id);
  if (!artifact) return res.status(404).json({ error: 'Artifact not found' });

  const project = store.projects.find(p => p.id === artifact.projectId);
  const phase = store.phases.find(ph => ph.id === artifact.phaseId);
  const owner = store.users.find(u => u.id === artifact.ownerId);
  const reviewers = store.reviewers.filter(r => r.artifactId === artifact.id).map(r => ({ ...r, user: store.users.find(u => u.id === r.userId) }));
  const approvers = store.approvers.filter(app => app.artifactId === artifact.id).map(app => ({ ...app, user: store.users.find(u => u.id === app.userId) }));
  const versions = store.versions.filter(v => v.artifactId === artifact.id).map(v => ({ ...v, author: store.users.find(u => u.id === v.authorId) }));

  return res.json({ ...artifact, project, phase, owner, reviewers, approvers, versions });
});

// Upload New Artifact Document File (PDF, DOCX, XLSX, etc.)
router.post('/upload', (req, res) => {
  const {
    projectId,
    phaseId,
    artifactType,
    title,
    description,
    ownerId,
    fileName,
    fileSize,
    fileType,
    fileData,
    origin,
    reviewerUserIds,
    approverUserIds
  } = req.body;

  const currentUserId = ownerId || req.user?.id || 'usr-ba-01';
  const artifactId = `art-${Date.now()}`;

  const newArtifact = {
    id: artifactId,
    projectId: projectId,
    phaseId: phaseId,
    artifactType: artifactType || 'SRS',
    title: title || fileName || 'Uploaded Document',
    description: description || `Uploaded file ${fileName}`,
    ownerId: currentUserId,
    status: 'Submitted',
    currentVersion: '1.0',
    fileName: fileName || 'Document.pdf',
    fileSize: fileSize || '2.1 MB',
    fileType: fileType || 'pdf',
    fileData: fileData || 'Document payload content',
    content: `# ${title || fileName}\n\nDocument Specification File Attached: ${fileName}`,
    origin: origin || 'Document Upload',
    blocksNextPhase: true
  };

  store.artifacts.unshift(newArtifact);

  // Version 1.0 Snapshot
  store.versions.unshift({
    id: `ver-${Date.now()}`,
    artifactId,
    versionNumber: '1.0',
    fileName: newArtifact.fileName,
    fileSize: newArtifact.fileSize,
    content: newArtifact.content,
    changeSummary: `Uploaded ${fileName} (${fileSize})`,
    authorId: currentUserId,
    status: 'Submitted',
    createdAt: new Date().toISOString()
  });

  // Assign Reviewers
  if (reviewerUserIds && Array.isArray(reviewerUserIds)) {
    reviewerUserIds.forEach(rUser => {
      store.reviewers.push({
        id: `rev-${Date.now()}-${Math.random()}`,
        artifactId,
        userId: rUser.userId || rUser,
        roleName: rUser.roleName || 'Reviewer',
        status: 'Pending'
      });
    });
  }

  // Assign Approvers
  if (approverUserIds && Array.isArray(approverUserIds)) {
    approverUserIds.forEach((aUser, idx) => {
      store.approvers.push({
        id: `app-${Date.now()}-${Math.random()}`,
        artifactId,
        userId: aUser.userId || aUser,
        roleName: aUser.roleName || 'Approver',
        sequence: idx + 1,
        status: 'Pending'
      });
    });
  }

  const { recordAuditLog } = require('../utils/auditLogger');
  const user = store.users.find(u => u.id === currentUserId || u.email === currentUserId) || { name: 'Author', role: 'Author' };

  recordAuditLog({
    projectId: newArtifact.projectId,
    entityType: 'Artifact',
    entityId: artifactId,
    action: 'DOCUMENT_SUBMITTED',
    userId: currentUserId,
    userName: user.name,
    userRole: user.role,
    documentTitle: newArtifact.title,
    details: `${user.name} (${user.role}) uploaded and submitted "${newArtifact.title}" (v1.0) for technical review.`
  });

  syncEntityToMongo('artifacts', newArtifact);

  return res.json(newArtifact);
});

// Update Document Content or Upload New File Version
router.put('/:id', async (req, res) => {
  const artifact = store.artifacts.find(a => a.id === req.params.id);
  if (!artifact) return res.status(404).json({ error: 'Artifact not found' });

  const { content, fileName, fileSize, fileType, fileData, changeSummary, responseNote, isMajorVersion, submitForReview, userId } = req.body;
  const currentUserId = userId || req.user?.id || artifact.ownerId || 'usr-ba-01';
  const user = store.users.find(u => u.id === currentUserId || u.email === currentUserId) || { name: 'Author', role: 'Author' };

  const prevVersion = artifact.currentVersion || '1.0';
  const [major, minor] = prevVersion.split('.').map(Number);
  const newVersionStr = isMajorVersion ? `${(major || 1) + 1}.0` : `${major || 1}.${(minor || 0) + 1}`;
  const newStatus = (submitForReview || fileName) ? 'Submitted' : (artifact.status === 'Changes Requested' ? 'Revision' : artifact.status);

  if (content) artifact.content = content;
  if (fileName) {
    artifact.fileName = fileName;
    artifact.fileSize = fileSize || '2.4 MB';
    artifact.fileType = fileType || 'pdf';
    artifact.fileData = fileData || artifact.fileData;
  }
  artifact.currentVersion = newVersionStr;
  artifact.status = newStatus;

  const revNote = responseNote || changeSummary || 'Uploaded updated deliverable revision.';
  artifact.lastRevisionNote = revNote;

  // If this was a re-upload after Changes Requested, reset reviewers to Pending
  if (artifact.status === 'Submitted') {
    artifact.rejectionReason = '';
    store.reviewers.filter(r => r.artifactId === artifact.id).forEach(r => {
      r.status = 'Pending';
    });
    store.approvers.filter(a => a.artifactId === artifact.id).forEach(a => {
      a.status = 'Pending';
    });
  }

  store.versions.unshift({
    id: `ver-${Date.now()}`,
    artifactId: artifact.id,
    versionNumber: newVersionStr,
    fileName: artifact.fileName,
    fileSize: artifact.fileSize,
    content: artifact.content,
    changeSummary: revNote,
    authorId: currentUserId,
    status: newStatus,
    createdAt: new Date().toISOString()
  });

  const { recordAuditLog } = require('../utils/auditLogger');
  await recordAuditLog({
    projectId: artifact.projectId,
    entityType: 'Artifact',
    entityId: artifact.id,
    action: 'DOCUMENT_RESUBMITTED',
    userId: currentUserId,
    userName: user.name,
    userRole: user.role,
    documentTitle: artifact.title,
    responseNote: revNote,
    details: `${user.name} (${user.role}) re-uploaded revision (v${newVersionStr}) for "${artifact.title}". Note to reviewer: "${revNote}"`
  });

  syncEntityToMongo('artifacts', artifact);

  return res.json(artifact);
});

module.exports = router;

