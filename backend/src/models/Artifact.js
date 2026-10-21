const mongoose = require('mongoose');

const ArtifactSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  projectId: { type: String, required: true, index: true },
  phaseId: { type: String, required: true, index: true },
  artifactType: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  content: { type: String, default: '' },
  ownerId: { type: String, default: '' },
  status: { type: String, enum: ['Draft', 'InReview', 'Approved', 'Rejected', 'Baseline'], default: 'Draft' },
  currentVersion: { type: String, default: '1.0' },
  blocksNextPhase: { type: Boolean, default: true },
  origin: { type: String, default: 'Methodology Framework' },
  confidentiality: { type: String, default: 'Internal' },
  fileName: { type: String, default: '' },
  fileSize: { type: String, default: '' },
  fileType: { type: String, default: 'pdf' },
  fileData: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.models.Artifact || mongoose.model('Artifact', ArtifactSchema);
