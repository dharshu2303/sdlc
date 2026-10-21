const express = require('express');
const store = require('../dataStore');

const router = express.Router();

router.get('/graph/:projectId', (req, res) => {
  const { projectId } = req.params;

  const artifacts = store.artifacts.filter(a => a.projectId === projectId).map(a => ({
    ...a,
    phase: store.phases.find(ph => ph.id === a.phaseId),
    owner: store.users.find(u => u.id === a.ownerId)
  }));

  const links = store.traceabilityLinks.filter(l => {
    const src = store.artifacts.find(a => a.id === l.sourceArtifactId);
    return src && src.projectId === projectId;
  });

  const meetings = store.meetings.filter(m => m.projectId === projectId);
  const decisions = store.decisions.filter(d => d.projectId === projectId);

  const nodes = [
    ...meetings.map(m => ({ id: `mtg-${m.id}`, label: m.title, type: 'Meeting', status: m.status })),
    ...decisions.map(d => ({ id: `dec-${d.id}`, label: `${d.decisionCode}: ${d.title}`, type: 'Decision', status: d.status })),
    ...artifacts.map(a => ({ id: `art-${a.id}`, label: `${a.artifactType}: ${a.title}`, type: 'Artifact', status: a.status, phase: a.phase?.name, version: a.currentVersion }))
  ];

  const edges = [
    ...links.map(l => ({
      source: `art-${l.sourceArtifactId}`,
      target: `art-${l.targetArtifactId}`,
      relationship: l.relationshipType
    })),
    ...decisions.filter(d => d.meetingId).map(d => ({
      source: `mtg-${d.meetingId}`,
      target: `dec-${d.id}`,
      relationship: 'Produced'
    }))
  ];

  return res.json({ nodes, edges, rawArtifacts: artifacts, rawLinks: links });
});

router.post('/link', (req, res) => {
  const { sourceArtifactId, targetArtifactId, relationshipType, description } = req.body;
  const newLink = {
    id: `tr-${Date.now()}`,
    sourceArtifactId,
    targetArtifactId,
    relationshipType: relationshipType || 'DependsOn',
    description
  };
  store.traceabilityLinks.push(newLink);
  return res.json(newLink);
});

module.exports = router;
