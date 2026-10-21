const mongoose = require('mongoose');

const ProjectMemberSchema = new mongoose.Schema({
  id: { type: String, required: true },
  userId: { type: String, required: true },
  roleName: { type: String, required: true }
}, { _id: false });

const ProjectSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  clientName: { type: String, default: 'Internal Client' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  type: { type: String, default: 'Web Application' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  orgId: { type: String, default: 'org-01' },
  methodologyId: { type: String, required: true },
  currentPhaseId: { type: String, default: null },
  status: { type: String, enum: ['Active', 'OnHold', 'Completed', 'Archived'], default: 'Active' },
  members: [ProjectMemberSchema]
}, {
  timestamps: true
});

module.exports = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
