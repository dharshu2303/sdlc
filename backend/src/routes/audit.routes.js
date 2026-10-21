const express = require('express');
const { supabaseAdmin } = require('../config/supabaseClient');

const router = express.Router();

router.get('/logs', async (req, res) => {
  try {
    const { projectId } = req.query;
    let query = supabaseAdmin.from('audit_logs').select('*');
    if (projectId && projectId !== 'ALL') {
      query = query.eq('project_id', projectId);
    }

    const { data: logs, error } = await query.order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });

    const { data: users } = await supabaseAdmin.from('users').select('id, name, role, email, avatar');
    const { data: projects } = await supabaseAdmin.from('projects').select('id, name, code');

    const result = (logs || []).map(l => {
      const user = (users || []).find(u => u.id === l.user_id);
      const project = (projects || []).find(p => p.id === l.project_id);
      return {
        id: l.id,
        projectId: l.project_id,
        action: l.action,
        entityType: l.entity_type,
        entityId: l.entity_id,
        details: l.details,
        reason: l.reason,
        createdAt: l.created_at,
        user: user || { name: 'Member', role: 'Contributor' },
        project: project || { name: 'SDLC Platform' }
      };
    });

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/notifications', async (req, res) => {
  try {
    const userId = req.query.userId || req.user?.id || 'usr-pm-01';
    const { data: list, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.json(list || []);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/notifications/:id/read', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
