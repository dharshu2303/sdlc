const express = require('express');
const store = require('../dataStore');

const router = express.Router();

router.get('/', (req, res) => {
  return res.json(store.methodologies);
});

router.get('/:id', (req, res) => {
  const meth = store.methodologies.find(m => m.id === req.params.id || m.code.toLowerCase() === req.params.id.toLowerCase());
  if (!meth) return res.status(404).json({ error: 'Methodology not found' });
  return res.json(meth);
});

router.post('/', (req, res) => {
  const { name, code, description, phases, requiredArtifacts } = req.body;
  const newMeth = {
    id: `meth-custom-${Date.now()}`,
    name,
    code,
    description,
    isSystem: false,
    phases: (phases || []).map((p, i) => ({ id: `mp-${Date.now()}-${i}`, name: p.name, sequence: i + 1, description: p.description })),
    requiredArtifacts: (requiredArtifacts || []).map((a, i) => ({
      id: `ma-${Date.now()}-${i}`,
      phaseName: a.phaseName,
      artifactType: a.artifactType,
      name: a.name,
      ownerRole: a.ownerRole,
      reviewerRoles: JSON.stringify(a.reviewerRoles || []),
      approverRoles: JSON.stringify(a.approverRoles || []),
      consumerRoles: JSON.stringify(a.consumerRoles || []),
      isRequired: a.isRequired ?? true,
      blocksPhase: a.blocksPhase ?? true,
      template: a.template || ''
    }))
  };
  store.methodologies.push(newMeth);
  return res.json(newMeth);
});

module.exports = router;
