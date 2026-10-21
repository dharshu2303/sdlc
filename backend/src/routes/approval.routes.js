const express = require('express');
const store = require('../dataStore');

const router = express.Router();

router.get('/pending', (req, res) => {
  const userId = req.query.userId || req.user?.id || 'usr-ta-01';
  const user = store.users.find(u => u.id === userId || u.email === userId);
  const userRole = user?.role || '';

  const pendingReviews = store.reviewers
    .filter(r => (r.userId === userId || (userRole && r.roleName === userRole)) && r.status === 'Pending')
    .map(r => {
      const art = store.artifacts.find(a => a.id === r.artifactId);
      return {
        ...r,
        artifact: art ? {
          ...art,
          project: store.projects.find(p => p.id === art.projectId),
          phase: store.phases.find(ph => ph.id === art.phaseId),
          owner: store.users.find(u => u.id === art.ownerId)
        } : null
      };
    });

  const pendingApprovals = store.approvers
    .filter(a => (a.userId === userId || (userRole && a.roleName === userRole)) && a.status === 'Pending')
    .map(app => {
      const art = store.artifacts.find(a => a.id === app.artifactId);
      const allRevs = art ? store.reviewers.filter(r => r.artifactId === art.id) : [];
      const approvedRevs = allRevs.filter(r => r.status === 'Reviewed' || r.status === 'Approved');
      const allReviewsCompleted = allRevs.length === 0 || approvedRevs.length === allRevs.length;

      return {
        ...app,
        allReviewsCompleted,
        reviewsCount: allRevs.length,
        approvedReviewsCount: approvedRevs.length,
        artifact: art ? {
          ...art,
          project: store.projects.find(p => p.id === art.projectId),
          phase: store.phases.find(ph => ph.id === art.phaseId),
          owner: store.users.find(u => u.id === art.ownerId),
          reviewers: allRevs.map(r => ({ ...r, user: store.users.find(u => u.id === r.userId) })),
          approvers: store.approvers.filter(ap => ap.artifactId === art.id).map(ap => ({ ...ap, user: store.users.find(u => u.id === ap.userId) }))
        } : null
      };
    });

  return res.json({ pendingReviews, pendingApprovals });
});

const { recordAuditLog } = require('../utils/auditLogger');
const { syncEntityToMongo } = require('../config/db');

router.post('/review', async (req, res) => {
  const { reviewerId, action, comments, userId } = req.body;
  const reviewer = store.reviewers.find(r => r.id === reviewerId);
  if (!reviewer) return res.status(404).json({ error: 'Reviewer record not found' });

  const activeUserId = userId || req.user?.id || reviewer.userId || 'usr-ta-01';
  const user = store.users.find(u => u.id === activeUserId || u.email === activeUserId) || { name: reviewer.roleName || 'Technical Reviewer', role: reviewer.roleName || 'Reviewer' };

  reviewer.status = action === 'Approved' ? 'Reviewed' : action;
  reviewer.comments = comments || '';

  const artifact = store.artifacts.find(a => a.id === reviewer.artifactId);
  if (artifact) {
    if (action === 'Changes Requested') {
      artifact.status = 'Changes Requested';
      artifact.rejectionReason = comments || 'Changes requested during technical review';
      artifact.rejectedBy = `${user.name} (${user.role})`;
      artifact.rejectedAt = new Date().toISOString();

      await recordAuditLog({
        projectId: artifact.projectId,
        entityType: 'Artifact',
        entityId: artifact.id,
        action: 'CHANGES_REQUESTED',
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        documentTitle: artifact.title,
        rejectionReason: comments,
        details: `${user.name} (${user.role}) requested changes on "${artifact.title}". Reason: "${comments || 'Please revise and resubmit.'}"`
      });
    } else {
      const allRevs = store.reviewers.filter(r => r.artifactId === artifact.id);
      if (allRevs.every(r => r.status === 'Reviewed' || r.status === 'Approved')) {
        artifact.status = 'Under Review';
      }

      await recordAuditLog({
        projectId: artifact.projectId,
        entityType: 'Artifact',
        entityId: artifact.id,
        action: 'REVIEW_APPROVED',
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        documentTitle: artifact.title,
        details: `${user.name} (${user.role}) signed off technical review for "${artifact.title}".${comments ? ` Note: "${comments}"` : ''}`
      });
    }

    syncEntityToMongo('artifacts', artifact);
  }

  return res.json(reviewer);
});

router.post('/approve', async (req, res) => {
  const { approverId, action, comments, userId } = req.body;
  const approver = store.approvers.find(a => a.id === approverId);
  if (!approver) return res.status(404).json({ error: 'Approver record not found' });

  const activeUserId = userId || req.user?.id || approver.userId || 'usr-pm-01';
  const user = store.users.find(u => u.id === activeUserId || u.email === activeUserId) || { name: approver.roleName || 'Approver', role: approver.roleName || 'Approver' };

  const artifact = store.artifacts.find(a => a.id === approver.artifactId);

  // Enforce sequential review-first rule
  if (action === 'Approved' && artifact) {
    const allRevs = store.reviewers.filter(r => r.artifactId === artifact.id);
    const unreviewed = allRevs.filter(r => r.status !== 'Reviewed' && r.status !== 'Approved');
    if (unreviewed.length > 0) {
      return res.status(400).json({
        error: `Cannot grant final signoff yet. ${unreviewed.length} mandatory technical review(s) must be completed and signed off first.`
      });
    }
  }

  approver.status = action;
  approver.comments = comments || '';

  if (artifact) {
    if (action === 'Rejected') {
      artifact.status = 'Changes Requested';
      artifact.rejectionReason = comments || 'Signoff rejected by executive approver';
      artifact.rejectedBy = `${user.name} (${user.role})`;
      artifact.rejectedAt = new Date().toISOString();

      await recordAuditLog({
        projectId: artifact.projectId,
        entityType: 'Artifact',
        entityId: artifact.id,
        action: 'EXECUTIVE_REJECTED',
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        documentTitle: artifact.title,
        rejectionReason: comments,
        details: `${user.name} (${user.role}) rejected signoff for "${artifact.title}". Reason: "${comments || 'Changes required.'}"`
      });
    } else if (action === 'Approved') {
      const allApps = store.approvers.filter(a => a.artifactId === artifact.id);
      if (allApps.every(a => a.status === 'Approved')) {
        artifact.status = 'Approved';
        artifact.rejectionReason = '';

        // Recalculate Phase Progress
        const phaseArtifacts = store.artifacts.filter(a => a.phaseId === artifact.phaseId);
        const approvedCount = phaseArtifacts.filter(a => a.status === 'Approved' || a.status === 'Published').length;
        const phase = store.phases.find(ph => ph.id === artifact.phaseId);
        if (phase) {
          phase.progress = Math.round((approvedCount / (phaseArtifacts.length || 1)) * 100);
        }
      }

      await recordAuditLog({
        projectId: artifact.projectId,
        entityType: 'Artifact',
        entityId: artifact.id,
        action: 'EXECUTIVE_APPROVED',
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        documentTitle: artifact.title,
        details: `${user.name} (${user.role}) granted formal executive approval for "${artifact.title}". Status updated to Approved.`
      });
    }

    syncEntityToMongo('artifacts', artifact);
  }

  return res.json(approver);
});

module.exports = router;
