const express = require('express');
const { supabaseAdmin } = require('../config/supabaseClient');
const { recordAuditLog, createNotification } = require('../utils/auditLogger');

const router = express.Router();

// 1. GET /api/approvals/pending - Pending reviews and approvals
router.get('/pending', async (req, res) => {
  try {
    const userId = req.query.userId || req.user?.id || 'usr-ta-01';

    // Fetch user details for role matching
    const { data: user } = await supabaseAdmin.from('users').select('*').eq('id', userId).single();
    const userRole = user?.role || '';

    // Fetch all pending reviews and approvals
    const { data: allReviewers } = await supabaseAdmin.from('artifact_reviewers').select('*').eq('status', 'Pending');
    const { data: allApprovers } = await supabaseAdmin.from('artifact_approvers').select('*').eq('status', 'Pending');
    const { data: artifacts } = await supabaseAdmin.from('artifacts').select('*');
    const { data: projects } = await supabaseAdmin.from('projects').select('*');
    const { data: phases } = await supabaseAdmin.from('phases').select('*');
    const { data: users } = await supabaseAdmin.from('users').select('id, name, role, email, avatar');

    // Filter reviews assigned to this user or role
    const pendingReviews = (allReviewers || [])
      .filter(r => r.user_id === userId || (userRole && r.role_name === userRole))
      .map(r => {
        const art = (artifacts || []).find(a => a.id === r.artifact_id);
        const proj = art ? (projects || []).find(p => p.id === art.project_id) : null;
        const ph = art ? (phases || []).find(phase => phase.id === art.phase_id) : null;
        const owner = art ? (users || []).find(u => u.id === art.owner_id) : null;

        return {
          id: r.id,
          artifactId: r.artifact_id,
          userId: r.user_id,
          roleName: r.role_name,
          status: r.status,
          artifact: art ? {
            id: art.id,
            title: art.title,
            artifactType: art.artifact_type,
            currentVersion: art.current_version,
            status: art.status,
            project: proj,
            phase: ph,
            owner: owner
          } : null
        };
      });

    // Filter approvals
    const pendingApprovals = (allApprovers || [])
      .filter(a => a.user_id === userId || (userRole && a.role_name === userRole))
      .map(app => {
        const art = (artifacts || []).find(a => a.id === app.artifact_id);
        const proj = art ? (projects || []).find(p => p.id === art.project_id) : null;
        const ph = art ? (phases || []).find(phase => phase.id === art.phase_id) : null;
        const owner = art ? (users || []).find(u => u.id === art.owner_id) : null;

        // Check if all technical reviews are signed off
        const reviewsForArt = (allReviewers || []).filter(r => r.artifact_id === app.artifact_id);
        const allReviewsCompleted = reviewsForArt.length === 0 || reviewsForArt.every(r => r.status === 'Reviewed' || r.status === 'Approved');

        return {
          id: app.id,
          artifactId: app.artifact_id,
          userId: app.user_id,
          roleName: app.role_name,
          sequence: app.sequence,
          status: app.status,
          allReviewsCompleted,
          artifact: art ? {
            id: art.id,
            title: art.title,
            artifactType: art.artifact_type,
            currentVersion: art.current_version,
            status: art.status,
            project: proj,
            phase: ph,
            owner: owner
          } : null
        };
      });

    return res.json({ pendingReviews, pendingApprovals });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. POST /api/approvals/review - Sign off or request changes on technical review
router.post('/review', async (req, res) => {
  try {
    const { reviewerId, action, comments, userId } = req.body;
    const activeUserId = userId || req.user?.id || 'usr-ta-01';

    const { data: reviewer, error } = await supabaseAdmin
      .from('artifact_reviewers')
      .select('*')
      .eq('id', reviewerId)
      .single();

    if (error || !reviewer) return res.status(404).json({ error: 'Reviewer record not found' });

    const newStatus = action === 'Approved' ? 'Reviewed' : action;

    await supabaseAdmin
      .from('artifact_reviewers')
      .update({
        status: newStatus,
        comments: comments || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewerId);

    const { data: artifact } = await supabaseAdmin.from('artifacts').select('*').eq('id', reviewer.artifact_id).single();

    if (artifact) {
      if (action === 'Changes Requested') {
        await supabaseAdmin
          .from('artifacts')
          .update({
            status: 'Changes Requested',
            rejection_reason: comments || 'Changes requested during technical review signoff.',
            updated_at: new Date().toISOString()
          })
          .eq('id', artifact.id);

        await recordAuditLog({
          projectId: artifact.project_id,
          entityType: 'Artifact',
          entityId: artifact.id,
          action: 'CHANGES_REQUESTED',
          userId: activeUserId,
          userName: req.user?.name || 'Technical Reviewer',
          userRole: req.user?.role || reviewer.role_name,
          documentTitle: artifact.title,
          rejectionReason: comments,
          details: `Requested changes on "${artifact.title}". Reason: "${comments || 'Please revise and resubmit.'}"`
        });
      } else {
        // Check if all reviews are now complete
        const { data: revs } = await supabaseAdmin.from('artifact_reviewers').select('*').eq('artifact_id', artifact.id);
        const allDone = (revs || []).every(r => r.id === reviewerId ? true : (r.status === 'Reviewed' || r.status === 'Approved'));

        if (allDone) {
          await supabaseAdmin.from('artifacts').update({ status: 'Under Review' }).eq('id', artifact.id);
        }

        await recordAuditLog({
          projectId: artifact.project_id,
          entityType: 'Artifact',
          entityId: artifact.id,
          action: 'REVIEW_APPROVED',
          userId: activeUserId,
          userName: req.user?.name || 'Technical Reviewer',
          userRole: req.user?.role || reviewer.role_name,
          documentTitle: artifact.title,
          details: `Signed off technical review for "${artifact.title}". ${comments ? `Note: "${comments}"` : ''}`
        });
      }
    }

    return res.json({ message: 'Review recorded successfully', status: newStatus });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. POST /api/approvals/approve - Executive / Client Signoff
router.post('/approve', async (req, res) => {
  try {
    const { approverId, action, comments, userId } = req.body;
    const activeUserId = userId || req.user?.id || 'usr-pm-01';

    const { data: approver, error } = await supabaseAdmin
      .from('artifact_approvers')
      .select('*')
      .eq('id', approverId)
      .single();

    if (error || !approver) return res.status(404).json({ error: 'Approver record not found' });

    const { data: artifact } = await supabaseAdmin.from('artifacts').select('*').eq('id', approver.artifact_id).single();

    // Enforce sequential review-first rule
    if (action === 'Approved' && artifact) {
      const { data: revs } = await supabaseAdmin.from('artifact_reviewers').select('*').eq('artifact_id', artifact.id);
      const unreviewed = (revs || []).filter(r => r.status !== 'Reviewed' && r.status !== 'Approved');
      if (unreviewed.length > 0) {
        return res.status(400).json({
          error: `Cannot grant final signoff yet. ${unreviewed.length} mandatory technical review(s) must be completed and signed off first.`
        });
      }
    }

    await supabaseAdmin
      .from('artifact_approvers')
      .update({
        status: action,
        comments: comments || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', approverId);

    if (artifact) {
      if (action === 'Rejected') {
        await supabaseAdmin
          .from('artifacts')
          .update({
            status: 'Changes Requested',
            rejection_reason: comments || 'Executive signoff rejected.',
            updated_at: new Date().toISOString()
          })
          .eq('id', artifact.id);

        await recordAuditLog({
          projectId: artifact.project_id,
          entityType: 'Artifact',
          entityId: artifact.id,
          action: 'EXECUTIVE_REJECTED',
          userId: activeUserId,
          userName: req.user?.name || 'Approver',
          userRole: req.user?.role || approver.role_name,
          documentTitle: artifact.title,
          rejectionReason: comments,
          details: `Rejected signoff for "${artifact.title}". Reason: "${comments || 'Executive revision required.'}"`
        });
      } else if (action === 'Approved') {
        const { data: apps } = await supabaseAdmin.from('artifact_approvers').select('*').eq('artifact_id', artifact.id);
        const allApproved = (apps || []).every(a => a.id === approverId ? true : a.status === 'Approved');

        if (allApproved) {
          // AUTO-PROMOTE TO PUBLISHED so phase gates pass seamlessly
          await supabaseAdmin
            .from('artifacts')
            .update({
              status: 'Published',
              rejection_reason: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', artifact.id);

          // Recalculate phase progress
          const { data: phaseArtifacts } = await supabaseAdmin.from('artifacts').select('*').eq('phase_id', artifact.phase_id);
          const publishedCount = (phaseArtifacts || []).filter(a => a.id === artifact.id || a.status === 'Published' || a.status === 'Approved').length;
          const progressPct = Math.round((publishedCount / (phaseArtifacts.length || 1)) * 100);

          await supabaseAdmin
            .from('phases')
            .update({
              progress: progressPct,
              status: progressPct === 100 ? 'Completed' : 'InProgress',
              is_blocked: progressPct === 100 ? false : undefined,
              block_reason: progressPct === 100 ? null : undefined
            })
            .eq('id', artifact.phase_id);

          const { data: projectPhases } = await supabaseAdmin
            .from('phases')
            .select('status')
            .eq('project_id', artifact.project_id);
          if ((projectPhases || []).length > 0 && projectPhases.every(phase => phase.status === 'Completed')) {
            await supabaseAdmin.from('projects').update({
              status: 'Completed',
              end_date: new Date().toISOString().slice(0, 10),
              current_phase_id: null,
              updated_at: new Date().toISOString()
            }).eq('id', artifact.project_id);
          }
        }

        await recordAuditLog({
          projectId: artifact.project_id,
          entityType: 'Artifact',
          entityId: artifact.id,
          action: 'EXECUTIVE_APPROVED',
          userId: activeUserId,
          userName: req.user?.name || 'Executive Approver',
          userRole: req.user?.role || approver.role_name,
          documentTitle: artifact.title,
          details: `Granted formal executive approval for "${artifact.title}". Status promoted to Published.`
        });
      }
    }

    return res.json({ message: 'Approval recorded successfully', status: action });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
