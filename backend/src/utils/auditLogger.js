const { supabaseAdmin } = require('../config/supabaseClient');

async function recordAuditLog({ projectId, entityType, entityId, action, userId, userName, userRole, documentTitle, details, rejectionReason, responseNote, previousState, newState }) {
  try {
    const logEntry = {
      project_id: projectId || null,
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      previous_state: previousState || null,
      new_state: newState || null,
      details: details || `${userName || 'User'} (${userRole || 'Unknown'}) performed ${action} on ${entityType} "${documentTitle || entityId}"`,
      reason: rejectionReason || responseNote || null
    };

    const { error } = await supabaseAdmin.from('audit_logs').insert(logEntry);
    if (error) console.error('Audit log write error:', error.message);
  } catch (err) {
    console.error('Failed to record audit log:', err.message);
  }
}

async function createNotification({ userId, title, message, type, linkUrl }) {
  try {
    const { error } = await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      title,
      message,
      type,
      link_url: linkUrl || null
    });
    if (error) console.error('Notification write error:', error.message);
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
}

module.exports = { recordAuditLog, createNotification };
