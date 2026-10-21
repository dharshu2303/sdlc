const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { supabaseAdmin } = require('../config/supabaseClient');
const { recordAuditLog } = require('../utils/auditLogger');

const router = express.Router();

// Active in-memory presence tracking buffer (persisted + live real-time fast lookups)
const activeSessions = new Map();

// Clean up stale sessions older than 3 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, session] of activeSessions.entries()) {
    if (now - session.lastHeartbeat > 3 * 60 * 1000) {
      activeSessions.delete(key);
    }
  }
}, 30000);

// 1. POST /api/collaboration/join/:artifactId - Join collaborative session
router.post('/join/:artifactId', async (req, res) => {
  try {
    const { artifactId } = req.params;
    const user = req.user || { id: 'usr-dev-01', name: 'SDLC Contributor', role: 'Developer' };
    const sessionKey = `${artifactId}:${user.id}`;

    const sessionData = {
      artifactId,
      userId: user.id,
      name: user.name,
      role: user.role,
      avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`,
      cursor: { line: 1, ch: 0 },
      color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
      joinedAt: Date.now(),
      lastHeartbeat: Date.now()
    };

    activeSessions.set(sessionKey, sessionData);

    // Save to DB
    await supabaseAdmin.from('document_collaborators').upsert({
      artifact_id: artifactId,
      user_id: user.id,
      cursor_position: sessionData.cursor,
      is_active: true,
      last_seen_at: new Date().toISOString()
    }, { onConflict: 'artifact_id,user_id' });

    // Return all active peers on this artifact
    const activePeers = Array.from(activeSessions.values()).filter(s => s.artifactId === artifactId);

    return res.json({
      message: 'Joined collaboration session',
      session: sessionData,
      activePeers
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. POST /api/collaboration/heartbeat/:artifactId - Live cursor update & keep-alive
router.post('/heartbeat/:artifactId', async (req, res) => {
  try {
    const { artifactId } = req.params;
    const { cursor } = req.body;
    const userId = req.user?.id || 'usr-dev-01';
    const sessionKey = `${artifactId}:${userId}`;

    let session = activeSessions.get(sessionKey);
    if (!session) {
      const user = req.user || { id: userId, name: 'Contributor', role: 'Developer' };
      session = {
        artifactId,
        userId,
        name: user.name,
        role: user.role,
        avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`,
        cursor: cursor || { line: 1, ch: 0 },
        color: '#3B82F6',
        joinedAt: Date.now(),
        lastHeartbeat: Date.now()
      };
    }

    session.lastHeartbeat = Date.now();
    if (cursor) session.cursor = cursor;
    activeSessions.set(sessionKey, session);

    const activePeers = Array.from(activeSessions.values()).filter(s => s.artifactId === artifactId);
    return res.json({ activePeers });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. POST /api/collaboration/leave/:artifactId - Leave collaborative session
router.post('/leave/:artifactId', async (req, res) => {
  try {
    const { artifactId } = req.params;
    const userId = req.user?.id || 'usr-dev-01';
    const sessionKey = `${artifactId}:${userId}`;

    activeSessions.delete(sessionKey);

    await supabaseAdmin
      .from('document_collaborators')
      .update({ is_active: false, last_seen_at: new Date().toISOString() })
      .eq('artifact_id', artifactId)
      .eq('user_id', userId);

    return res.json({ message: 'Session exited' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. GET /api/collaboration/presence/:artifactId - Get active collaborators
router.get('/presence/:artifactId', async (req, res) => {
  try {
    const { artifactId } = req.params;
    const activePeers = Array.from(activeSessions.values()).filter(s => s.artifactId === artifactId);
    return res.json({ activePeers, count: activePeers.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 5. POST /api/collaboration/save/:artifactId - Conflict-checked collaborative save
router.post('/save/:artifactId', async (req, res) => {
  try {
    const { artifactId } = req.params;
    const { content, baseVersion, changeSummary, isMajorVersion } = req.body;
    const userId = req.user?.id || 'usr-dev-01';

    // Fetch current artifact state
    const { data: currentArtifact, error: fetchErr } = await supabaseAdmin
      .from('artifacts')
      .select('*')
      .eq('id', artifactId)
      .single();

    if (fetchErr || !currentArtifact) {
      return res.status(404).json({ error: 'Artifact not found' });
    }

    // Version conflict detection
    if (baseVersion && currentArtifact.current_version && currentArtifact.current_version !== baseVersion) {
      return res.status(409).json({
        conflict: true,
        message: `Version conflict: The deliverable was updated to v${currentArtifact.current_version} while you were editing.`,
        currentVersion: currentArtifact.current_version,
        serverContent: currentArtifact.content
      });
    }

    // Compute next version
    const [maj, min] = (currentArtifact.current_version || '1.0').split('.').map(Number);
    const nextVersion = isMajorVersion ? `${(maj || 1) + 1}.0` : `${maj || 1}.${(min || 0) + 1}`;

    // Update artifact in DB
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('artifacts')
      .update({
        content,
        current_version: nextVersion,
        updated_at: new Date().toISOString()
      })
      .eq('id', artifactId)
      .select()
      .single();

    if (updateErr) return res.status(500).json({ error: updateErr.message });

    // Store version snapshot
    await supabaseAdmin.from('artifact_versions').insert({
      id: uuidv4(),
      artifact_id: artifactId,
      version_number: nextVersion,
      content,
      change_summary: changeSummary || 'Collaborative live edit save',
      author_id: userId,
      status: currentArtifact.status,
      created_at: new Date().toISOString()
    });

    await recordAuditLog({
      projectId: currentArtifact.project_id,
      entityType: 'Artifact',
      entityId: artifactId,
      action: 'COLLABORATIVE_EDIT_SAVED',
      userId,
      userName: req.user?.name || 'Contributor',
      userRole: req.user?.role || 'Author',
      documentTitle: currentArtifact.title,
      details: `Saved collaborative revision v${nextVersion}: "${changeSummary || 'Live collaborative update'}"`
    });

    return res.json({
      success: true,
      artifact: updated,
      newVersion: nextVersion
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 6. GET /api/collaboration/comments/:artifactId - Inline document comments
router.get('/comments/:artifactId', async (req, res) => {
  try {
    const { data: comments, error } = await supabaseAdmin
      .from('document_comments')
      .select('*')
      .eq('artifact_id', req.params.artifactId)
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    const { data: users } = await supabaseAdmin.from('users').select('id, name, role, avatar');

    const enriched = (comments || []).map(c => {
      const u = (users || []).find(user => user.id === c.user_id);
      return {
        id: c.id,
        artifactId: c.artifact_id,
        content: c.content,
        positionStart: c.position_start,
        positionEnd: c.position_end,
        isResolved: c.is_resolved,
        createdAt: c.created_at,
        user: u ? { id: u.id, name: u.name, role: u.role, avatar: u.avatar } : { name: 'Collaborator', role: 'Member' }
      };
    });

    return res.json(enriched);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 7. POST /api/collaboration/comments - Add inline document comment
router.post('/comments', async (req, res) => {
  try {
    const { artifactId, content, positionStart, positionEnd } = req.body;
    if (!artifactId || !content) {
      return res.status(400).json({ error: 'Artifact ID and content required' });
    }

    const userId = req.user?.id || 'usr-dev-01';
    const commentRecord = {
      id: uuidv4(),
      artifact_id: artifactId,
      user_id: userId,
      content: content.trim(),
      position_start: positionStart || 0,
      position_end: positionEnd || 0,
      is_resolved: false,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin.from('document_comments').insert(commentRecord).select().single();
    if (error) return res.status(500).json({ error: error.message });

    return res.status(201).json(data || commentRecord);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 8. PUT /api/collaboration/comments/:commentId/resolve - Resolve inline comment
router.put('/comments/:commentId/resolve', async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user?.id || 'usr-dev-01';

    const { data, error } = await supabaseAdmin
      .from('document_comments')
      .update({
        is_resolved: true,
        resolved_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 9. GET /api/collaboration/suggestions/:artifactId - Tracked suggestions
router.get('/suggestions/:artifactId', async (req, res) => {
  try {
    const { data: suggestions, error } = await supabaseAdmin
      .from('document_suggestions')
      .select('*')
      .eq('artifact_id', req.params.artifactId)
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    const { data: users } = await supabaseAdmin.from('users').select('id, name, role, avatar');

    const enriched = (suggestions || []).map(s => {
      const u = (users || []).find(user => user.id === s.user_id);
      return {
        id: s.id,
        artifactId: s.artifact_id,
        originalText: s.original_text,
        suggestedText: s.suggested_text,
        positionStart: s.position_start,
        positionEnd: s.position_end,
        status: s.status,
        createdAt: s.created_at,
        user: u ? { id: u.id, name: u.name, role: u.role, avatar: u.avatar } : { name: 'Collaborator' }
      };
    });

    return res.json(enriched);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 10. POST /api/collaboration/suggestions - Create tracked edit suggestion
router.post('/suggestions', async (req, res) => {
  try {
    const { artifactId, originalText, suggestedText, positionStart, positionEnd } = req.body;
    if (!artifactId || !suggestedText) {
      return res.status(400).json({ error: 'Artifact ID and suggested text are required' });
    }

    const userId = req.user?.id || 'usr-dev-01';
    const suggestionRecord = {
      id: uuidv4(),
      artifact_id: artifactId,
      user_id: userId,
      original_text: originalText || '',
      suggested_text: suggestedText,
      position_start: positionStart || 0,
      position_end: positionEnd || 0,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin.from('document_suggestions').insert(suggestionRecord).select().single();
    if (error) return res.status(500).json({ error: error.message });

    return res.status(201).json(data || suggestionRecord);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 11. PUT /api/collaboration/suggestions/:suggestionId - Accept or Reject suggestion
router.put('/suggestions/:suggestionId', async (req, res) => {
  try {
    const { suggestionId } = req.params;
    const { status } = req.body; // 'accepted' | 'rejected'
    const userId = req.user?.id || 'usr-ba-01';

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be accepted or rejected' });
    }

    // Get suggestion
    const { data: sug } = await supabaseAdmin
      .from('document_suggestions')
      .select('*')
      .eq('id', suggestionId)
      .single();

    if (!sug) return res.status(404).json({ error: 'Suggestion not found' });

    // Update suggestion status
    const { data: updatedSug, error: updateErr } = await supabaseAdmin
      .from('document_suggestions')
      .update({
        status,
        reviewed_by: userId
      })
      .eq('id', suggestionId)
      .select()
      .single();

    if (updateErr) return res.status(500).json({ error: updateErr.message });

    // If accepted, patch the artifact content
    if (status === 'accepted') {
      const { data: art } = await supabaseAdmin.from('artifacts').select('*').eq('id', sug.artifact_id).single();
      if (art && art.content) {
        let newContent = art.content;
        if (sug.original_text && newContent.includes(sug.original_text)) {
          newContent = newContent.replace(sug.original_text, sug.suggested_text);
        } else {
          newContent += `\n\n${sug.suggested_text}`;
        }

        await supabaseAdmin
          .from('artifacts')
          .update({ content: newContent, updated_at: new Date().toISOString() })
          .eq('id', sug.artifact_id);
      }
    }

    return res.json(updatedSug);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
