const express = require('express');
const store = require('../dataStore');

const router = express.Router();

router.get('/evaluate/:phaseId', (req, res) => {
  const { phaseId } = req.params;

  const phase = store.phases.find(p => p.id === phaseId);
  if (!phase) return res.status(404).json({ error: 'Phase not found' });

  const phaseArtifacts = store.artifacts.filter(a => a.phaseId === phaseId);
  const totalArtifacts = phaseArtifacts.length;
  const publishedArtifacts = phaseArtifacts.filter(a => a.status === 'Published');

  const pendingApprovals = phaseArtifacts.flatMap(a =>
    store.approvers.filter(app => app.artifactId === a.id && app.status === 'Pending')
  );

  const pendingReviews = phaseArtifacts.flatMap(a =>
    store.reviewers.filter(r => r.artifactId === a.id && r.status === 'Pending')
  );

  const blockers = [];

  if (totalArtifacts === 0) {
    blockers.push('No required artifacts created for this phase.');
  }
  if (publishedArtifacts.length < totalArtifacts) {
    blockers.push(`${totalArtifacts - publishedArtifacts.length} required artifact(s) are not fully published/approved.`);
  }
  if (pendingApprovals.length > 0) {
    blockers.push(`${pendingApprovals.length} pending stakeholder signoff approval(s) remaining.`);
  }
  if (pendingReviews.length > 0) {
    blockers.push(`${pendingReviews.length} pending technical review(s) remaining.`);
  }

  const isGatePassed = blockers.length === 0;

  phase.isBlocked = !isGatePassed;
  phase.blockReason = isGatePassed ? null : blockers.join(' | ');

  if (isGatePassed) {
    phase.status = 'Completed';
    phase.progress = 100;
    if (!phase.completedAt) {
      phase.completedAt = new Date().toISOString().split('T')[0];
    }
    if (phase.startedAt) {
      const startMs = new Date(phase.startedAt).getTime();
      const endMs = new Date(phase.completedAt).getTime();
      const diffDays = Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24)));
      phase.actualDays = diffDays;
    }

    const projectPhases = store.phases.filter(p => p.projectId === phase.projectId).sort((a,b) => a.sequence - b.sequence);
    const currentSeq = phase.sequence;
    const nextPhase = projectPhases.find(p => p.sequence === currentSeq + 1);
    if (nextPhase && (nextPhase.status === 'Locked' || nextPhase.status === 'Pending')) {
      nextPhase.status = 'InProgress';
      nextPhase.isBlocked = false;
      nextPhase.startedAt = new Date().toISOString().split('T')[0];
      const proj = store.projects.find(p => p.id === phase.projectId);
      if (proj) proj.currentPhaseId = nextPhase.id;
    }
  } else {
    phase.status = 'InProgress';
  }

  return res.json({
    phaseName: phase.name,
    progress: phase.progress,
    isGatePassed,
    blockers,
    totalArtifacts,
    publishedArtifactsCount: publishedArtifacts.length,
    pendingApprovalsCount: pendingApprovals.length,
    pendingReviewsCount: pendingReviews.length
  });
});

module.exports = router;
