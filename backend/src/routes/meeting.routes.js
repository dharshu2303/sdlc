const express = require('express');
const store = require('../dataStore');

const router = express.Router();

router.get('/', (req, res) => {
  const { projectId } = req.query;
  let list = store.meetings;
  if (projectId) list = list.filter(m => m.projectId === projectId);

  const result = list.map(m => ({
    ...m,
    project: store.projects.find(p => p.id === m.projectId),
    decisions: store.decisions.filter(d => d.meetingId === m.id),
    actionItems: store.actionItems.filter(a => a.meetingId === m.id).map(a => ({ ...a, assignee: store.users.find(u => u.id === a.assigneeId) }))
  }));

  return res.json(result);
});

router.get('/:id', (req, res) => {
  const meeting = store.meetings.find(m => m.id === req.params.id);
  if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

  const project = store.projects.find(p => p.id === meeting.projectId);
  const decisions = store.decisions.filter(d => d.meetingId === meeting.id).map(d => ({ ...d, decisionMaker: store.users.find(u => u.id === d.decisionMakerId) }));
  const actionItems = store.actionItems.filter(a => a.meetingId === meeting.id).map(a => ({ ...a, assignee: store.users.find(u => u.id === a.assigneeId) }));

  return res.json({ ...meeting, project, decisions, actionItems });
});

router.post('/', (req, res) => {
  const { projectId, title, meetingType, date, time, location, organizer, agenda, minutes } = req.body;
  const newMeeting = {
    id: `mtg-${Date.now()}`,
    projectId,
    title,
    meetingType: meetingType || 'Requirement Workshop',
    date: date || new Date().toISOString().split('T')[0],
    time: time || '10:00 AM',
    location: location || 'Conference Room A',
    organizer: organizer || 'Project Lead',
    agenda,
    minutes,
    status: 'Completed'
  };
  store.meetings.unshift(newMeeting);
  return res.json(newMeeting);
});

router.post('/:id/decisions', (req, res) => {
  const { projectId, title, description, decisionMakerId, reason, impact } = req.body;
  const meetingId = req.params.id;

  const count = store.decisions.filter(d => d.projectId === projectId).length;
  const decisionCode = `DEC-${String(count + 1).padStart(3, '0')}`;

  const newDecision = {
    id: `dec-${Date.now()}`,
    projectId,
    meetingId: meetingId !== 'standalone' ? meetingId : null,
    decisionCode,
    title,
    description,
    decisionMakerId: decisionMakerId || 'usr-ta-01',
    reason,
    impact,
    status: 'Approved'
  };

  store.decisions.unshift(newDecision);
  return res.json(newDecision);
});

router.get('/decisions/all', (req, res) => {
  const { projectId } = req.query;
  let list = store.decisions;
  if (projectId) list = list.filter(d => d.projectId === projectId);

  const result = list.map(d => ({
    ...d,
    project: store.projects.find(p => p.id === d.projectId),
    meeting: store.meetings.find(m => m.id === d.meetingId),
    decisionMaker: store.users.find(u => u.id === d.decisionMakerId)
  }));

  return res.json(result);
});

module.exports = router;
