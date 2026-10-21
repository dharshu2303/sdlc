const mongoose = require('mongoose');

const PhaseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  projectId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  sequence: { type: Number, required: true },
  status: { type: String, enum: ['Locked', 'InProgress', 'InReview', 'Approved', 'Completed'], default: 'Locked' },
  progress: { type: Number, default: 0 },
  isBlocked: { type: Boolean, default: false },
  plannedDays: { type: Number, default: 14 },
  actualDays: { type: Number, default: 0 },
  assignedRole: { type: String, default: 'Phase Lead' },
  assignedUserId: { type: String, default: null },
  startedAt: { type: String, default: null },
  completedAt: { type: String, default: null }
}, {
  timestamps: true
});

module.exports = mongoose.models.Phase || mongoose.model('Phase', PhaseSchema);
