const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: {
    type: String,
    required: true
  },
  title: { type: String, default: '' },
  systemRole: { type: String, default: 'MEMBER' },
  avatar: { type: String, default: '' },
  isDefaultPassword: { type: Boolean, default: false }
}, {
  timestamps: true
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
