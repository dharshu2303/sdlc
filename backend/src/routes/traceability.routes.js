const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { supabaseAdmin } = require('../config/supabaseClient');

const router = express.Router();

router.get('/graph/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const { data: artifacts } = await supabaseAdmin.from('artifacts').select('*').eq('project_id', projectId);
    const { data: phases } = await supabaseAdmin.from('phases').select('*').eq('project_id', projectId);
    const { data: users } = await supabaseAdmin.from('users').select('id, name');
    const { data: allLinks } = await supabaseAdmin.from('traceability_links').select('*');
    const { data: meetings } = await supabaseAdmin.from('meetings').select('*').eq('project_id', projectId);
    const { data: decisions } = await supabaseAdmin.from('decisions').select('*').eq('project_id', projectId);

    const artList = (artifacts || []).map(a => ({
      ...a,
      phase: (phases || []).find(ph => ph.id === a.phase_id),
      owner: (users || []).find(u => u.id === a.owner_id)
    }));

    const links = (allLinks || []).filter(l =>
      (artifacts || []).some(a => a.id === l.source_artifact_id || a.id === l.sourceArtifactId)
    );

    const nodes = [
      ...(meetings || []).map(m => ({ id: `mtg-${m.id}`, label: m.title, type: 'Meeting', status: m.status })),
      ...(decisions || []).map(d => ({ id: `dec-${d.id}`, label: `${d.decision_code || 'DEC'}: ${d.title}`, type: 'Decision', status: d.status })),
      ...artList.map(a => ({ id: `art-${a.id}`, label: `${a.artifact_type}: ${a.title}`, type: 'Artifact', status: a.status, phase: a.phase?.name, version: a.current_version }))
    ];

    const edges = [
      ...links.map(l => ({
        source: `art-${l.source_artifact_id || l.sourceArtifactId}`,
        target: `art-${l.target_artifact_id || l.targetArtifactId}`,
        relationship: l.relationship_type || l.relationshipType || 'DependsOn'
      })),
      ...(decisions || []).filter(d => d.meeting_id).map(d => ({
        source: `mtg-${d.meeting_id}`,
        target: `dec-${d.id}`,
        relationship: 'Produced'
      }))
    ];

    return res.json({ nodes, edges, rawArtifacts: artList, rawLinks: links });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/link', async (req, res) => {
  try {
    const { sourceArtifactId, targetArtifactId, relationshipType, description } = req.body;
    const newLink = {
      id: uuidv4(),
      source_artifact_id: sourceArtifactId,
      target_artifact_id: targetArtifactId,
      relationship_type: relationshipType || 'DependsOn',
      description: description || '',
      created_at: new Date().toISOString()
    };
    const { data, error } = await supabaseAdmin.from('traceability_links').insert(newLink).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data || newLink);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
