const mongoose = require('mongoose');

const VersionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  artifactId: { type: String, required: true, index: true },
  versionNumber: { type: String, required: true },
  content: { type: String, default: '' },
  changeSummary: { type: String, default: '' },
  authorId: { type: String, default: '' },
  status: { type: String, default: 'Submitted' },
  fileName: { type: String, default: '' },
  fileSize: { type: String, default: '' },
  fileType: { type: String, default: 'pdf' },
  fileData: { type: String, default: '' }
}, {
  timestamps: true
});

const ApprovalSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  artifactId: { type: String, required: true, index: true },
  versionId: { type: String, default: null },
  userId: { type: String, required: true },
  role: { type: String, required: true },
  stepOrder: { type: Number, default: 1 },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  comments: { type: String, default: '' },
  signedAt: { type: Date, default: null }
}, {
  timestamps: true
});

const AuditLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  entityType: { type: String, required: true },
  entityId: { type: String, required: true },
  action: { type: String, required: true },
  previousState: { type: String, default: '' },
  newState: { type: String, default: '' },
  userId: { type: String, default: '' },
  details: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = {
  Version: mongoose.models.Version || mongoose.model('Version', VersionSchema),
  Approval: mongoose.models.Approval || mongoose.model('Approval', ApprovalSchema),
  AuditLog: mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema)
};
