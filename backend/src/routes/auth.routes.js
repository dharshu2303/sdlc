const express = require('express');
const jwt = require('jsonwebtoken');
const store = require('../dataStore');
const User = require('../models/User');
const { syncEntityToMongo } = require('../config/db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sdlc_doc_governance_secret_key_2026_super_secure';

// Login API - Validates Email & Password directly from MongoDB
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter both email and password' });
  }

  let user = null;
  try {
    user = await User.findOne({ email: new RegExp(`^${email.trim()}$`, 'i') }).lean();
  } catch (e) {
    console.error('Mongo login lookup error:', e.message);
  }

  if (!user) {
    user = store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  if (!user) {
    return res.status(401).json({ error: 'Invalid email address or password' });
  }

  // Validate Password (matches user password or fallback default '123' or 'admin123' / 'admin')
  if (user.password !== password && password !== '123' && password !== 'admin123' && password !== 'admin') {
    return res.status(401).json({ error: 'Incorrect password. Admin: admin, Employee initial default: 123' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role, systemRole: user.systemRole },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({ token, user });
});

// Get Current User Profile
router.get('/me', async (req, res) => {
  const userId = req.user?.id || 'usr-admin-01';
  let user = null;
  try {
    user = await User.findOne({ id: userId }).lean();
  } catch (e) {}

  if (!user) {
    user = store.users.find(u => u.id === userId) || store.users[0] || {
      id: 'usr-admin-01',
      name: 'System Administrator',
      email: 'admin@gmail.com',
      role: 'Admin',
      systemRole: 'ADMIN'
    };
  }

  const userProjects = store.projectMembers.filter(pm => pm.userId === user.id);
  return res.json({ ...user, projectMembers: userProjects });
});

// Get List of All Employee Accounts directly from MongoDB
router.get('/users/all', async (req, res) => {
  try {
    const users = await User.find({}).lean();
    return res.json(users);
  } catch (err) {
    console.error('Error fetching users from MongoDB:', err.message);
    return res.json(store.users);
  }
});

// Calculate Employee Deletion Impact (Assigned Projects & Authored Specs)
router.get('/users/:id/impact', async (req, res) => {
  let user = null;
  try {
    user = await User.findOne({ id: req.params.id }).lean();
  } catch (e) {}
  if (!user) user = store.users.find(u => u.id === req.params.id);

  if (!user) return res.status(404).json({ error: 'Employee account not found' });

  // Find assigned projects
  const memberEntries = store.projectMembers.filter(pm => pm.userId === user.id);
  const assignedProjects = memberEntries.map(pm => {
    const proj = store.projects.find(p => p.id === pm.projectId);
    return {
      projectId: pm.projectId,
      projectName: proj ? proj.name : 'Banking Management System',
      projectCode: proj ? proj.code : 'BMS-2026',
      assignedRole: pm.roleName || user.role
    };
  });

  // Find authored artifacts
  const authoredArtifacts = store.artifacts.filter(a => a.ownerId === user.id).map(a => ({
    id: a.id,
    title: a.title,
    artifactType: a.artifactType,
    currentVersion: a.currentVersion,
    status: a.status
  }));

  // Find pending reviews & approvals
  const pendingReviews = store.reviewers.filter(r => r.userId === user.id && r.status === 'Pending').map(r => {
    const art = store.artifacts.find(a => a.id === r.artifactId);
    return { id: r.id, artifactTitle: art ? art.title : 'Document Spec', roleName: r.roleName };
  });

  const pendingApprovals = store.approvers.filter(a => a.userId === user.id && a.status === 'Pending').map(a => {
    const art = store.artifacts.find(art => art.id === a.artifactId);
    return { id: a.id, artifactTitle: art ? art.title : 'Document Spec', roleName: a.roleName };
  });

  return res.json({
    user,
    assignedProjects,
    authoredArtifacts,
    pendingReviews,
    pendingApprovals,
    totalImpactCount: assignedProjects.length + authoredArtifacts.length + pendingReviews.length + pendingApprovals.length
  });
});

// Self-Service Change Password (for logged-in employees)
router.post('/change-password', async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;
  const targetId = userId || req.user?.id || 'usr-admin-01';

  let user = await User.findOne({ id: targetId });
  if (!user) {
    const memUser = store.users.find(u => u.id === targetId);
    if (!memUser) return res.status(404).json({ error: 'User account not found' });
    user = memUser;
  }

  if (user.password !== currentPassword && currentPassword !== '123' && currentPassword !== 'admin123' && currentPassword !== 'admin') {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }

  if (!newPassword || newPassword.length < 3) {
    return res.status(400).json({ error: 'New password must be at least 3 characters long' });
  }

  const updated = await User.findOneAndUpdate(
    { id: targetId },
    { $set: { password: newPassword, isDefaultPassword: false } },
    { returnDocument: 'after' }
  );

  // Add Audit Log
  store.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    userId: targetId,
    action: 'PASSWORD_CHANGED',
    entityType: 'User',
    entityId: targetId,
    newState: `User ${user.name} (${user.role}) updated their password.`,
    createdAt: new Date()
  });

  return res.json({ message: 'Password updated successfully', user: updated || user });
});

// Admin Employee Creation & Provisioning API (Admin creates with default password '123')
router.post('/users/create', async (req, res) => {
  const { name, email, role, title } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Fields (name, email, role) are required' });
  }

  const existing = await User.findOne({ email: new RegExp(`^${email.trim()}$`, 'i') });
  if (existing) {
    return res.status(400).json({ error: `Employee with email ${email} already exists` });
  }

  const newEmployee = {
    id: `usr-${Date.now()}`,
    name,
    email: email.toLowerCase().trim(),
    password: '123', // Mandatory default password 123
    isDefaultPassword: true,
    role,
    title: title || role,
    systemRole: 'MEMBER',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`
  };

  const created = await User.create(newEmployee);

  // Add to Project Members for active project if available
  if (store.projects.length > 0) {
    store.projectMembers.push({
      id: `pm-${Date.now()}`,
      projectId: req.body.projectId || store.projects[0].id,
      userId: newEmployee.id,
      roleName: role
    });
  }

  // Record Audit
  store.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    userId: req.user?.id || 'usr-admin-01',
    action: 'EMPLOYEE_PROVISIONED',
    entityType: 'User',
    entityId: newEmployee.id,
    newState: `Admin created employee ${name} (${role}) with email ${email} and default password 123.`,
    createdAt: new Date()
  });

  return res.json(created);
});

// Admin Edit Employee Details
router.put('/users/:id', async (req, res) => {
  const { name, email, role, title } = req.body;
  const updateData = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email.toLowerCase().trim();
  if (role) updateData.role = role;
  if (title) updateData.title = title;

  const updatedUser = await User.findOneAndUpdate(
    { id: req.params.id },
    { $set: updateData },
    { returnDocument: 'after' }
  );

  if (!updatedUser) return res.status(404).json({ error: 'Employee account not found' });
  return res.json(updatedUser);
});

// Admin Remove/Delete Employee directly from MongoDB
router.delete('/users/:id', async (req, res) => {
  const removed = await User.findOneAndDelete({ id: req.params.id });
  if (!removed) return res.status(404).json({ error: 'Employee not found' });

  // Clean up project memberships
  store.projectMembers = store.projectMembers.filter(pm => pm.userId !== req.params.id);

  // Audit
  store.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    userId: req.user?.id || 'usr-admin-01',
    action: 'EMPLOYEE_DELETED',
    entityType: 'User',
    entityId: removed.id,
    newState: `Admin deleted employee account ${removed.name} (${removed.role}).`,
    createdAt: new Date()
  });

  return res.json({ message: `Removed employee account ${removed.name}` });
});

// Admin Reset Password to Default 123
router.put('/users/:id/reset-password', async (req, res) => {
  const user = await User.findOneAndUpdate(
    { id: req.params.id },
    { $set: { password: '123', isDefaultPassword: true } },
    { returnDocument: 'after' }
  );

  if (!user) return res.status(404).json({ error: 'Employee account not found' });

  // Add Audit Log
  store.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    userId: req.user?.id || 'usr-admin-01',
    action: 'PASSWORD_RESET',
    entityType: 'User',
    entityId: user.id,
    newState: `Admin reset password for ${user.name} (${user.role}) to default 123.`,
    createdAt: new Date()
  });

  return res.json({ message: `Reset password for ${user.name} to default '123'`, user });
});

module.exports = router;
