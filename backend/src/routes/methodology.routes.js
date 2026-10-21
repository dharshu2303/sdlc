const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { supabaseAdmin } = require('../config/supabaseClient');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { data: meths, error } = await supabaseAdmin.from('methodologies').select('*');
    if (error) return res.status(500).json({ error: error.message });
    return res.json(meths || []);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let { data: meth } = await supabaseAdmin.from('methodologies').select('*').eq('id', id).single();
    if (!meth) {
      const { data: byCode } = await supabaseAdmin.from('methodologies').select('*').ilike('code', id);
      if (byCode && byCode.length > 0) meth = byCode[0];
    }
    if (!meth) return res.status(404).json({ error: 'Methodology not found' });
    return res.json(meth);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, code, description, phases, requiredArtifacts } = req.body;
    const newMeth = {
      id: uuidv4(),
      name,
      code: code.toLowerCase(),
      description,
      is_system: false,
      phases: phases || [],
      required_artifacts: requiredArtifacts || [],
      created_at: new Date().toISOString()
    };
    const { data, error } = await supabaseAdmin.from('methodologies').insert(newMeth).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data || newMeth);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
