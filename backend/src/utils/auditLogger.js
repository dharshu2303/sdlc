const store = require('../dataStore');
const { syncEntityToMongo } = require('../config/db');

/**
 * Records an immutable audit log entry in memory and MongoDB
 */
const recordAuditLog = async ({
  projectId,
  entityType = 'Artifact',
  entityId,
  action,
  userId,
  userName,
  userRole,
  details,
  documentTitle,
  rejectionReason,
  responseNote
}) => {
  try {
    const user = store.users.find(u => u.id === userId || u.email === userId);
    const logId = `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date();

    const logEntry = {
      id: logId,
      projectId: projectId || 'global',
      entityType,
      entityId: entityId || 'N/A',
      action,
      details: details || '',
      userId: user?.id || userId || 'system',
      userName: userName || user?.name || 'System User',
      userRole: userRole || user?.role || 'Member',
      documentTitle: documentTitle || '',
      rejectionReason: rejectionReason || '',
      responseNote: responseNote || '',
      createdAt: now.toISOString()
    };

    // Prepend to in-memory store for instant UI updates
    if (!store.auditLogs) store.auditLogs = [];
    store.auditLogs.unshift(logEntry);

    // Persist to MongoDB
    await syncEntityToMongo('auditLogs', logEntry);

    return logEntry;
  } catch (err) {
    console.error('Failed to record audit log:', err.message);
  }
};

module.exports = { recordAuditLog };
