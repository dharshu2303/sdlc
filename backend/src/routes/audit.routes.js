const express = require('express');
const store = require('../dataStore');
const { AuditLog } = require('../models/Governance');

const router = express.Router();

router.get('/logs', async (req, res) => {
  const { projectId } = req.query;
  let logs = [];

  try {
    const query = projectId && projectId !== 'ALL' ? { projectId } : {};
    logs = await AuditLog.find(query).sort({ createdAt: -1 }).lean();
  } catch (e) {
    logs = store.auditLogs || [];
  }

  // If DB returned fewer or empty, merge with in-memory store
  if (!logs || logs.length === 0) {
    logs = store.auditLogs || [];
  }

  if (projectId && projectId !== 'ALL') {
    logs = logs.filter(l => l.projectId === projectId);
  }

  const result = logs.map(l => {
    const user = store.users.find(u => u.id === l.userId || u.email === l.userId);
    const project = store.projects.find(p => p.id === l.projectId);
    return {
      ...l,
      user: user || { name: l.userName || 'Member', role: l.userRole || 'Contributor' },
      project: project || { name: 'Project Space' }
    };
  });

  return res.json(result);
});

router.get('/notifications', (req, res) => {
  const userId = req.query.userId || req.user?.id || 'usr-pm-01';
  const list = (store.notifications || []).filter(n => n.userId === userId);
  return res.json(list);
});

router.put('/notifications/:id/read', (req, res) => {
  const notif = (store.notifications || []).find(n => n.id === req.params.id);
  if (notif) notif.isRead = true;
  return res.json(notif || {});
});

module.exports = router;
