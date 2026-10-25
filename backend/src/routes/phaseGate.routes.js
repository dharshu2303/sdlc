const express = require('express');
const { supabaseAdmin } = require('../config/supabaseClient');

const router = express.Router();

router.get('/evaluate/:phaseId', async (req, res) => {
  try {
    const { phaseId } = req.params;

    const { data: phase, error } = await supabaseAdmin.from('phases').select('*').eq('id', phaseId).single();
    if (error || !phase) return res.status(404).json({ error: 'Phase not found' });

    const { data: phaseArtifacts } = await supabaseAdmin.from('artifacts').select('id, status').eq('phase_id', phaseId);
    const artifacts = phaseArtifacts || [];
    const totalArtifacts = artifacts.length;

    // Both Approved and Published satisfy phase gate criteria
    const passedArtifacts = artifacts.filter(a => a.status === 'Published' || a.status === 'Approved');

    const artifactIds = artifacts.map(artifact => artifact.id);
    const [approverResult, reviewerResult] = artifactIds.length ? await Promise.all([
      supabaseAdmin.from('artifact_approvers').select('id, artifact_id').eq('status', 'Pending').in('artifact_id', artifactIds),
      supabaseAdmin.from('artifact_reviewers').select('id, artifact_id').eq('status', 'Pending').in('artifact_id', artifactIds)
    ]) : [{ data: [] }, { data: [] }];
    const { data: allApprovers } = approverResult;
    const { data: allReviewers } = reviewerResult;

    const pendingApprovals = allApprovers || [];
    const pendingReviews = allReviewers || [];

    const blockers = [];

    if (totalArtifacts === 0) {
      blockers.push('No required artifacts registered for this phase.');
    }
    if (passedArtifacts.length < totalArtifacts) {
      blockers.push(`${totalArtifacts - passedArtifacts.length} required deliverable(s) are not yet approved/published.`);
    }
    if (pendingApprovals.length > 0) {
      blockers.push(`${pendingApprovals.length} pending stakeholder signoff approval(s) remaining.`);
    }
    if (pendingReviews.length > 0) {
      blockers.push(`${pendingReviews.length} pending technical review(s) remaining.`);
    }

    const isGatePassed = blockers.length === 0;

    // Update phase in Supabase
    if (isGatePassed) {
      await supabaseAdmin.from('phases').update({
        status: 'Completed',
        progress: 100,
        is_blocked: false,
        block_reason: null,
        updated_at: new Date().toISOString()
      }).eq('id', phaseId);

      // Unlock next phase if exists
      const { data: allPhases } = await supabaseAdmin
        .from('phases')
        .select('*')
        .eq('project_id', phase.project_id)
        .order('sequence', { ascending: true });

      const nextPhase = (allPhases || []).find(p => p.sequence === phase.sequence + 1);
      if (nextPhase && (nextPhase.status === 'Locked' || nextPhase.status === 'Pending')) {
        await supabaseAdmin.from('phases').update({
          status: 'InProgress',
          is_blocked: false,
          block_reason: null,
          updated_at: new Date().toISOString()
        }).eq('id', nextPhase.id);

        await supabaseAdmin.from('projects').update({
          current_phase_id: nextPhase.id,
          updated_at: new Date().toISOString()
        }).eq('id', phase.project_id);
      } else if (!nextPhase) {
        const completedOn = new Date().toISOString().slice(0, 10);
        await supabaseAdmin.from('projects').update({
          status: 'Completed',
          end_date: completedOn,
          current_phase_id: null,
          updated_at: new Date().toISOString()
        }).eq('id', phase.project_id);
      }
    } else {
      await supabaseAdmin.from('phases').update({
        is_blocked: true,
        block_reason: blockers.join(' | '),
        updated_at: new Date().toISOString()
      }).eq('id', phaseId);
    }

    return res.json({
      phaseName: phase.name,
      progress: isGatePassed ? 100 : phase.progress,
      isGatePassed,
      blockers,
      totalArtifacts,
      publishedArtifactsCount: passedArtifacts.length,
      pendingApprovalsCount: pendingApprovals.length,
      pendingReviewsCount: pendingReviews.length
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
