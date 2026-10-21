const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { supabaseAdmin } = require('../config/supabaseClient');
const { recordAuditLog } = require('../utils/auditLogger');

const router = express.Router();

// 1. GET /api/artifacts/download/:id - Direct File Download
router.get('/download/:id', async (req, res) => {
  try {
    const { data: artifact } = await supabaseAdmin.from('artifacts').select('*').eq('id', req.params.id).single();
    if (!artifact) return res.status(404).json({ error: 'Artifact not found' });

    const fileName = artifact.file_name || `${artifact.artifact_type}_${artifact.title.replace(/\s+/g, '_')}_v${artifact.current_version}.md`;
    const fileContent = artifact.content || `# ${artifact.title}\n\nDeliverable specification v${artifact.current_version}`;

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    return res.send(Buffer.from(fileContent, 'utf-8'));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. GET /api/artifacts/download/version/:versionId - Download Specific Version Snapshot
router.get('/download/version/:versionId', async (req, res) => {
  try {
    const { data: ver } = await supabaseAdmin.from('artifact_versions').select('*').eq('id', req.params.versionId).single();
    if (!ver) return res.status(404).json({ error: 'Version record not found' });

    const fileName = ver.file_name || `Version_${ver.version_number}.md`;
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    return res.send(Buffer.from(ver.content || 'Version Document Snapshot', 'utf-8'));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. GET /api/artifacts - List artifacts with filters & search
router.get('/', async (req, res) => {
  try {
    const { projectId, phaseId, status, ownerId, search } = req.query;
    let query = supabaseAdmin.from('artifacts').select('*');

    if (projectId) query = query.eq('project_id', projectId);
    if (phaseId) query = query.eq('phase_id', phaseId);
    if (status && status !== 'All') query = query.eq('status', status);
    if (ownerId) query = query.eq('owner_id', ownerId);

    const { data: artifacts, error } = await query.order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });

    const { data: projects } = await supabaseAdmin.from('projects').select('id, name, code');
    const { data: phases } = await supabaseAdmin.from('phases').select('id, name, sequence');
    const { data: users } = await supabaseAdmin.from('users').select('id, name, role, avatar');
    const { data: allReviewers } = await supabaseAdmin.from('artifact_reviewers').select('*');
    const { data: allApprovers } = await supabaseAdmin.from('artifact_approvers').select('*');
    const { data: allVersions } = await supabaseAdmin.from('artifact_versions').select('*');

    let list = (artifacts || []).map(a => {
      const proj = (projects || []).find(p => p.id === a.project_id);
      const ph = (phases || []).find(phase => phase.id === a.phase_id);
      const owner = (users || []).find(u => u.id === a.owner_id);
      const revs = (allReviewers || []).filter(r => r.artifact_id === a.id).map(r => ({
        ...r,
        user: (users || []).find(u => u.id === r.user_id)
      }));
      const apps = (allApprovers || []).filter(app => app.artifact_id === a.id).map(app => ({
        ...app,
        user: (users || []).find(u => u.id === app.user_id)
      }));
      const vers = (allVersions || []).filter(v => v.artifact_id === a.id);

      return {
        id: a.id,
        projectId: a.project_id,
        phaseId: a.phase_id,
        artifactType: a.artifact_type,
        title: a.title,
        description: a.description,
        currentVersion: a.current_version,
        status: a.status,
        confidentiality: a.confidentiality || 'Internal',
        dueDate: a.due_date,
        blocksNextPhase: a.blocks_next_phase,
        content: a.content,
        fileName: a.file_name,
        fileSize: a.file_size,
        fileType: a.file_type,
        project: proj,
        phase: ph,
        owner: owner || { name: 'Author', role: 'Member' },
        reviewers: revs,
        approvers: apps,
        versions: vers,
        rejectionReason: a.rejection_reason,
        createdAt: a.created_at,
        updatedAt: a.updated_at
      };
    });

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.artifactType.toLowerCase().includes(q) ||
        (a.fileName && a.fileName.toLowerCase().includes(q))
      );
    }

    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. GET /api/artifacts/:id - Single artifact detail
router.get('/:id', async (req, res) => {
  try {
    const { data: a, error } = await supabaseAdmin.from('artifacts').select('*').eq('id', req.params.id).single();
    if (error || !a) return res.status(404).json({ error: 'Artifact not found' });

    const { data: proj } = await supabaseAdmin.from('projects').select('*').eq('id', a.project_id).single();
    const { data: ph } = await supabaseAdmin.from('phases').select('*').eq('id', a.phase_id).single();
    const { data: users } = await supabaseAdmin.from('users').select('id, name, email, role, avatar');
    const { data: revs } = await supabaseAdmin.from('artifact_reviewers').select('*').eq('artifact_id', a.id);
    const { data: apps } = await supabaseAdmin.from('artifact_approvers').select('*').eq('artifact_id', a.id).order('sequence', { ascending: true });
    const { data: vers } = await supabaseAdmin.from('artifact_versions').select('*').eq('artifact_id', a.id).order('created_at', { ascending: false });

    const owner = (users || []).find(u => u.id === a.owner_id);

    const enrichedRevs = (revs || []).map(r => ({
      ...r,
      user: (users || []).find(u => u.id === r.user_id)
    }));

    const enrichedApps = (apps || []).map(app => ({
      ...app,
      user: (users || []).find(u => u.id === app.user_id)
    }));

    const enrichedVers = (vers || []).map(v => ({
      ...v,
      author: (users || []).find(u => u.id === v.author_id)
    }));

    return res.json({
      id: a.id,
      projectId: a.project_id,
      phaseId: a.phase_id,
      artifactType: a.artifact_type,
      title: a.title,
      description: a.description,
      currentVersion: a.current_version,
      status: a.status,
      confidentiality: a.confidentiality,
      dueDate: a.due_date,
      blocksNextPhase: a.blocks_next_phase,
      content: a.content,
      fileName: a.file_name,
      fileSize: a.file_size,
      fileType: a.file_type,
      rejectionReason: a.rejection_reason,
      project: proj,
      phase: ph,
      owner: owner || { name: 'Author', role: 'Member' },
      reviewers: enrichedRevs,
      approvers: enrichedApps,
      versions: enrichedVers,
      createdAt: a.created_at,
      updatedAt: a.updated_at
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 5. POST /api/artifacts/upload - Create/Upload Deliverable with Signoff Workflow
router.post('/upload', async (req, res) => {
  try {
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
      content,
      reviewerUserIds,
      approverUserIds
    } = req.body;

    const currentUserId = ownerId || req.user?.id || 'usr-ba-01';
    const artifactId = `art-${Date.now()}`;

    const artifactRecord = {
      id: artifactId,
      project_id: projectId,
      phase_id: phaseId,
      artifact_type: artifactType || 'SRS',
      title: title || fileName || 'Deliverable Specification',
      description: description || `Document deliverable for ${title || fileName}`,
      owner_id: currentUserId,
      status: 'Submitted',
      current_version: '1.0',
      file_name: fileName || `${artifactType || 'Doc'}_v1.0.md`,
      file_size: fileSize || '1.2 MB',
      file_type: fileType || 'md',
      content: content || fileData || `# ${title || fileName}\n\nDeliverable Content Specification.`,
      blocks_next_phase: true,
      created_at: new Date().toISOString()
    };

    await supabaseAdmin.from('artifacts').insert(artifactRecord);

    // Initial version record
    await supabaseAdmin.from('artifact_versions').insert({
      id: uuidv4(),
      artifact_id: artifactId,
      version_number: '1.0',
      file_name: artifactRecord.file_name,
      file_size: artifactRecord.file_size,
      content: artifactRecord.content,
      change_summary: `Initial upload: ${artifactRecord.file_name}`,
      author_id: currentUserId,
      status: 'Submitted',
      created_at: new Date().toISOString()
    });

    // Assign Reviewers
    if (reviewerUserIds && Array.isArray(reviewerUserIds)) {
      const revRecords = reviewerUserIds.map(r => ({
        id: uuidv4(),
        artifact_id: artifactId,
        user_id: r.userId || r,
        role_name: r.roleName || 'Technical Reviewer',
        status: 'Pending',
        updated_at: new Date().toISOString()
      }));
      await supabaseAdmin.from('artifact_reviewers').insert(revRecords);
    }

    // Assign Approvers
    if (approverUserIds && Array.isArray(approverUserIds)) {
      const appRecords = approverUserIds.map((a, idx) => ({
        id: uuidv4(),
        artifact_id: artifactId,
        user_id: a.userId || a,
        role_name: a.roleName || 'Executive Approver',
        sequence: idx + 1,
        status: 'Pending',
        updated_at: new Date().toISOString()
      }));
      await supabaseAdmin.from('artifact_approvers').insert(appRecords);
    }

    await recordAuditLog({
      projectId,
      entityType: 'Artifact',
      entityId: artifactId,
      action: 'DOCUMENT_SUBMITTED',
      userId: currentUserId,
      userName: req.user?.name || 'Author',
      userRole: req.user?.role || 'Author',
      documentTitle: artifactRecord.title,
      details: `Uploaded and submitted "${artifactRecord.title}" (v1.0) for technical review.`
    });

    return res.status(201).json(artifactRecord);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 6. PUT /api/artifacts/:id - Update Document Content or Revision
router.put('/:id', async (req, res) => {
  try {
    const { data: artifact, error: fetchErr } = await supabaseAdmin.from('artifacts').select('*').eq('id', req.params.id).single();
    if (fetchErr || !artifact) return res.status(404).json({ error: 'Artifact not found' });

    const { content, fileName, fileSize, changeSummary, responseNote, isMajorVersion, submitForReview } = req.body;
    const currentUserId = req.user?.id || artifact.owner_id;

    const prevVersion = artifact.current_version || '1.0';
    const [maj, min] = prevVersion.split('.').map(Number);
    const nextVersion = isMajorVersion ? `${(maj || 1) + 1}.0` : `${maj || 1}.${(min || 0) + 1}`;

    const newStatus = (submitForReview || fileName)
      ? 'Submitted'
      : (artifact.status === 'Changes Requested' ? 'Draft' : artifact.status);

    const updateFields = {
      current_version: nextVersion,
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (content !== undefined) updateFields.content = content;
    if (fileName) {
      updateFields.file_name = fileName;
      updateFields.file_size = fileSize || '1.5 MB';
    }

    if (newStatus === 'Submitted') {
      updateFields.rejection_reason = null;
      // Reset reviewers to pending
      await supabaseAdmin.from('artifact_reviewers').update({ status: 'Pending', comments: '' }).eq('artifact_id', artifact.id);
      await supabaseAdmin.from('artifact_approvers').update({ status: 'Pending', comments: '' }).eq('artifact_id', artifact.id);
    }

    const { data: updatedArtifact, error: updateErr } = await supabaseAdmin
      .from('artifacts')
      .update(updateFields)
      .eq('id', artifact.id)
      .select()
      .single();

    if (updateErr) return res.status(500).json({ error: updateErr.message });

    const revNote = responseNote || changeSummary || `Updated deliverable to v${nextVersion}`;

    // Add version snapshot
    await supabaseAdmin.from('artifact_versions').insert({
      id: uuidv4(),
      artifact_id: artifact.id,
      version_number: nextVersion,
      file_name: updateFields.file_name || artifact.file_name,
      file_size: updateFields.file_size || artifact.file_size,
      content: content !== undefined ? content : artifact.content,
      change_summary: revNote,
      author_id: currentUserId,
      status: newStatus,
      created_at: new Date().toISOString()
    });

    await recordAuditLog({
      projectId: artifact.project_id,
      entityType: 'Artifact',
      entityId: artifact.id,
      action: submitForReview ? 'DOCUMENT_RESUBMITTED' : 'DOCUMENT_UPDATED',
      userId: currentUserId,
      userName: req.user?.name || 'Author',
      userRole: req.user?.role || 'Author',
      documentTitle: artifact.title,
      details: `Saved revision v${nextVersion} for "${artifact.title}". Note: "${revNote}"`
    });

    return res.json(updatedArtifact);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
