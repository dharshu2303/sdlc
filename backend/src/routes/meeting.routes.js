const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { supabaseAdmin } = require('../config/supabaseClient');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { projectId } = req.query;
    let query = supabaseAdmin.from('meetings').select('*');
    if (projectId) query = query.eq('project_id', projectId);

    const { data: meetings, error } = await query.order('date', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });

    const { data: decisions } = await supabaseAdmin.from('decisions').select('*');
    const { data: actionItems } = await supabaseAdmin.from('action_items').select('*');
    const { data: users } = await supabaseAdmin.from('users').select('id, name, role, avatar');

    const result = (meetings || []).map(m => {
      const decs = (decisions || []).filter(d => d.meeting_id === m.id);
      const actions = (actionItems || []).filter(a => a.meeting_id === m.id).map(a => ({
        ...a,
        assignee: (users || []).find(u => u.id === a.assignee_id)
      }));

      return {
        id: m.id,
        projectId: m.project_id,
        title: m.title,
        meetingType: m.meeting_type,
        date: m.date,
        time: m.time,
        location: m.location,
        organizer: m.organizer,
        agenda: m.agenda,
        minutes: m.minutes,
        status: m.status,
        decisions: decs,
        actionItems: actions
      };
    });

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data: meeting, error } = await supabaseAdmin.from('meetings').select('*').eq('id', req.params.id).single();
    if (error || !meeting) return res.status(404).json({ error: 'Meeting not found' });

    const { data: decisions } = await supabaseAdmin.from('decisions').select('*').eq('meeting_id', meeting.id);
    const { data: actionItems } = await supabaseAdmin.from('action_items').select('*').eq('meeting_id', meeting.id);
    const { data: users } = await supabaseAdmin.from('users').select('id, name, role, avatar');

    const decs = (decisions || []).map(d => ({
      ...d,
      decisionMaker: (users || []).find(u => u.id === d.decision_maker_id)
    }));

    const actions = (actionItems || []).map(a => ({
      ...a,
      assignee: (users || []).find(u => u.id === a.assignee_id)
    }));

    return res.json({
      ...meeting,
      decisions: decs,
      actionItems: actions
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { projectId, title, meetingType, date, time, location, organizer, agenda, minutes } = req.body;
    const newMeeting = {
      id: `mtg-${Date.now()}`,
      project_id: projectId,
      title: title.trim(),
      meeting_type: meetingType || 'Requirement Workshop',
      date: date || new Date().toISOString().split('T')[0],
      time: time || '10:00 AM',
      location: location || 'Conference Room A',
      organizer: organizer || 'Project Lead',
      agenda,
      minutes,
      status: 'Completed',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin.from('meetings').insert(newMeeting).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data || newMeeting);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/:id/decisions', async (req, res) => {
  try {
    const { projectId, title, description, decisionMakerId, reason, impact } = req.body;
    const meetingId = req.params.id;

    const { data: allDecisions } = await supabaseAdmin.from('decisions').select('id').eq('project_id', projectId);
    const count = (allDecisions || []).length;
    const decisionCode = `DEC-${String(count + 1).padStart(3, '0')}`;

    const newDecision = {
      id: `dec-${Date.now()}`,
      project_id: projectId,
      meeting_id: meetingId !== 'standalone' ? meetingId : null,
      decision_code: decisionCode,
      title: title.trim(),
      description: description.trim(),
      decision_maker_id: decisionMakerId || 'usr-ta-01',
      reason,
      impact,
      status: 'Approved',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin.from('decisions').insert(newDecision).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data || newDecision);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/decisions/all', async (req, res) => {
  try {
    const { projectId } = req.query;
    let query = supabaseAdmin.from('decisions').select('*');
    if (projectId) query = query.eq('project_id', projectId);

    const { data: decisions, error } = await query.order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });

    const { data: users } = await supabaseAdmin.from('users').select('id, name, role, avatar');
    const { data: meetings } = await supabaseAdmin.from('meetings').select('id, title');

    const result = (decisions || []).map(d => ({
      ...d,
      meeting: (meetings || []).find(m => m.id === d.meeting_id),
      decisionMaker: (users || []).find(u => u.id === d.decision_maker_id)
    }));

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
