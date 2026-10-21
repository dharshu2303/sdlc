const mongoose = require('mongoose');

const PhaseTemplateSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  sequence: { type: Number, required: true },
  description: { type: String, default: '' },
  ownerRole: { type: String, default: '' }
}, { _id: false });

const RequiredArtifactTemplateSchema = new mongoose.Schema({
  id: { type: String, required: true },
  phaseName: { type: String, required: true },
  artifactType: { type: String, required: true },
  name: { type: String, required: true },
  ownerRole: { type: String, required: true },
  reviewerRoles: { type: [String], default: [] },
  approverRoles: { type: [String], default: [] },
  consumerRoles: { type: [String], default: [] },
  isRequired: { type: Boolean, default: true },
  blocksPhase: { type: Boolean, default: true }
}, { _id: false });

const MethodologySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  code: { type: String, required: true },
  description: { type: String, default: '' },
  isSystem: { type: Boolean, default: true },
  phases: [PhaseTemplateSchema],
  requiredArtifacts: [RequiredArtifactTemplateSchema]
}, {
  timestamps: true
});

module.exports = mongoose.models.Methodology || mongoose.model('Methodology', MethodologySchema);
