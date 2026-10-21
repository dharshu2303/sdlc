const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { supabaseAdmin } = require('../config/supabaseClient');
const { recordAuditLog } = require('../utils/auditLogger');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Helper to normalize user across Supabase Cloud and Local schema
const normalizeUser = (u) => {
  if (!u) return u;
  let role = u.role;
  if (!role) {
    if (u.system_role === 'SUPER_ADMIN' || u.systemRole === 'SUPER_ADMIN') {
      role = 'Admin';
    } else if (u.system_role === 'ADMIN' || u.systemRole === 'ADMIN') {
      role = 'Project Manager';
    } else {
      role = u.title || 'Developer';
    }
  }
  return {
    ...u,
    role: role || 'Developer',
    systemRole: u.system_role || u.systemRole || (role === 'Admin' ? 'SUPER_ADMIN' : role === 'Project Manager' ? 'ADMIN' : 'MEMBER')
  };
};

// 1. POST /api/auth/login - Secure bcrypt authenticated login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter both email and password.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Query user from Supabase
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .ilike('email', cleanEmail);

    if (error || !users || users.length === 0) {
      return res.status(401).json({ error: 'Invalid email address or password.' });
    }

    const rawUser = users[0];

    // Verify password with bcrypt (supports bcrypt hash or secure initial seed hash)
    let isMatch = false;
    if (rawUser.password && (rawUser.password.startsWith('$2a$') || rawUser.password.startsWith('$2b$'))) {
      isMatch = await bcrypt.compare(password, rawUser.password);
    } else {
      isMatch = rawUser.password === password;
      // If plaintext, upgrade to bcrypt on the fly
      if (isMatch) {
        const hashed = await bcrypt.hash(password, 10);
        await supabaseAdmin.from('users').update({ password: hashed }).eq('id', rawUser.id);
      }
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email address or password.' });
    }

    const user = normalizeUser(rawUser);

    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      systemRole: user.systemRole
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    // Do not return password in response
    const { password: _, ...userSafe } = user;
    return res.json({ token, user: userSafe });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal authentication error' });
  }
});

// 2. GET /api/auth/me - Current user profile
router.get('/me', async (req, res) => {
  try {
    const userId = req.user?.id || 'usr-admin-01';

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, title, system_role, avatar, created_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const { data: memberships } = await supabaseAdmin
      .from('project_members')
      .select('*')
      .eq('user_id', user.id);

    return res.json({ ...normalizeUser(user), projectMembers: memberships || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. GET /api/auth/demo-users - Available users for quick role switching in development / demo
router.get('/demo-users', async (req, res) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, title, system_role, avatar');

    if (error) return res.status(500).json({ error: error.message });
    return res.json((users || []).map(normalizeUser));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. GET /api/auth/users/all - Admin Employee List
router.get('/users/all', async (req, res) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, title, system_role, avatar, is_default_password, created_at')
      .order('name', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.json((users || []).map(normalizeUser));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 5. GET /api/auth/users/:id/impact - Deletion Impact Assessment
router.get('/users/:id/impact', async (req, res) => {
  try {
    const targetId = req.params.id;

    const { data: user } = await supabaseAdmin.from('users').select('*').eq('id', targetId).single();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { data: members } = await supabaseAdmin.from('project_members').select('*').eq('user_id', targetId);
    const { data: artifacts } = await supabaseAdmin.from('artifacts').select('*').eq('owner_id', targetId);
    const { data: reviewers } = await supabaseAdmin.from('artifact_reviewers').select('*').eq('user_id', targetId).eq('status', 'Pending');
    const { data: approvers } = await supabaseAdmin.from('artifact_approvers').select('*').eq('user_id', targetId).eq('status', 'Pending');
    const { data: projects } = await supabaseAdmin.from('projects').select('id, name, code');

    const assignedProjects = (members || []).map(m => {
      const p = (projects || []).find(proj => proj.id === m.project_id);
      return {
        projectId: m.project_id,
        projectName: p ? p.name : 'Banking Management System',
        projectCode: p ? p.code : 'BMS-2026',
        assignedRole: m.role_name
      };
    });

    const authoredArtifacts = (artifacts || []).map(a => ({
      id: a.id,
      title: a.title,
      artifactType: a.artifact_type,
      currentVersion: a.current_version,
      status: a.status
    }));

    return res.json({
      user,
      assignedProjects,
      authoredArtifacts,
      pendingReviews: reviewers || [],
      pendingApprovals: approvers || [],
      totalImpactCount: assignedProjects.length + authoredArtifacts.length + (reviewers || []).length + (approvers || []).length
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 6. POST /api/auth/users/create & POST /api/auth/users - Provision Employee / Manager Credentials
const handleCreateEmployee = async (req, res) => {
  try {
    const { name, email, role, title, projectId, password } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const { data: existing } = await supabaseAdmin.from('users').select('id').ilike('email', cleanEmail);
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: `An account with email ${cleanEmail} already exists.` });
    }

    // Use custom password if provided, otherwise default to 'Admin@123'
    const finalPassword = password && password.trim().length >= 4 ? password.trim() : 'Admin@123';
    const hashedPassword = await bcrypt.hash(finalPassword, 10);
    const newUserId = uuidv4();

    const isSuperAdmin = role.toLowerCase() === 'admin';
    const isManagerRole = role.toLowerCase().includes('project manager') || isSuperAdmin;

    const userDbPayload = {
      id: newUserId,
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      title: title?.trim() || role.trim(),
      system_role: isSuperAdmin ? 'SUPER_ADMIN' : isManagerRole ? 'ADMIN' : 'MEMBER',
      is_default_password: !password,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin.from('users').insert(userDbPayload).select().single();
    if (error) return res.status(500).json({ error: error.message });

    // Assign to active project if provided
    if (projectId) {
      await supabaseAdmin.from('project_members').insert({
        id: uuidv4(),
        project_id: projectId,
        user_id: newUserId,
        role_name: role.trim(),
        created_at: new Date().toISOString()
      });
    }

    await recordAuditLog({
      entityType: 'User',
      entityId: newUserId,
      action: 'EMPLOYEE_PROVISIONED',
      userId: req.user?.id || 'usr-admin-01',
      userName: req.user?.name || 'Administrator',
      userRole: req.user?.role || 'Admin',
      details: `Provisioned ${role} account for ${name} (${cleanEmail}).`
    });

    const safeUser = normalizeUser(data || userDbPayload);
    delete safeUser.password;
    safeUser.role = role.trim();

    return res.status(201).json({
      ...safeUser,
      initialPassword: finalPassword,
      message: `Account created successfully with password: ${finalPassword}`
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

router.post('/users/create', handleCreateEmployee);
router.post('/users', handleCreateEmployee);

// 7. PUT /api/auth/users/:id - Admin Edit Employee Details
router.put('/users/:id', async (req, res) => {
  try {
    const { name, email, role, title } = req.body;
    const updateData = {};

    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.trim().toLowerCase();
    if (role) {
      updateData.title = role.trim();
      const isSuper = role.toLowerCase() === 'admin';
      const isMgr = role.toLowerCase().includes('project manager') || isSuper;
      updateData.system_role = isSuper ? 'SUPER_ADMIN' : isMgr ? 'ADMIN' : 'MEMBER';
    }
    if (title) updateData.title = title.trim();

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ error: error?.message || 'Employee account not found' });

    const safeUser = normalizeUser(data);
    delete safeUser.password;
    if (role) safeUser.role = role.trim();
    return res.json(safeUser);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 8. DELETE /api/auth/users/:id - Admin Remove Employee
router.delete('/users/:id', async (req, res) => {
  try {
    const targetId = req.params.id;

    const { data: user } = await supabaseAdmin.from('users').select('*').eq('id', targetId).single();
    if (!user) return res.status(404).json({ error: 'Employee not found' });

    await supabaseAdmin.from('project_members').delete().eq('user_id', targetId);
    await supabaseAdmin.from('users').delete().eq('id', targetId);

    await recordAuditLog({
      entityType: 'User',
      entityId: targetId,
      action: 'EMPLOYEE_DELETED',
      userId: req.user?.id || 'usr-admin-01',
      userName: req.user?.name || 'Administrator',
      userRole: 'Admin',
      details: `Admin deleted employee account ${user.name} (${user.role}).`
    });

    return res.json({ message: `Successfully removed employee account ${user.name}` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 9. PUT /api/auth/users/:id/reset-password - Admin Password Reset
router.put('/users/:id/reset-password', async (req, res) => {
  try {
    const defaultPassword = 'Admin@123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update({
        password: hashedPassword,
        is_default_password: true
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !user) return res.status(404).json({ error: 'Employee account not found' });

    await recordAuditLog({
      entityType: 'User',
      entityId: user.id,
      action: 'PASSWORD_RESET',
      userId: req.user?.id || 'usr-admin-01',
      userName: req.user?.name || 'Administrator',
      userRole: 'Admin',
      details: `Admin reset password for ${user.name} to default initial password.`
    });

    return res.json({ message: `Reset password for ${user.name} to default initial password.` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 10. POST /api/auth/change-password - Self-Service Password Change
router.post('/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    const targetId = userId || req.user?.id;

    if (!targetId) return res.status(401).json({ error: 'Authentication required' });
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const { data: user } = await supabaseAdmin.from('users').select('*').eq('id', targetId).single();
    if (!user) return res.status(404).json({ error: 'User account not found' });

    // Verify current password
    let isCurrentValid = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      isCurrentValid = await bcrypt.compare(currentPassword, user.password);
    } else {
      isCurrentValid = user.password === currentPassword;
    }

    if (!isCurrentValid) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    const newHashed = await bcrypt.hash(newPassword, 10);
    const { data: updated, error } = await supabaseAdmin
      .from('users')
      .update({
        password: newHashed,
        is_default_password: false
      })
      .eq('id', targetId)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    await recordAuditLog({
      entityType: 'User',
      entityId: targetId,
      action: 'PASSWORD_CHANGED',
      userId: targetId,
      userName: user.name,
      userRole: user.role,
      details: `User ${user.name} (${user.role}) updated their password securely.`
    });

    const { password: _, ...safeUser } = updated || user;
    return res.json({ message: 'Password updated successfully.', user: safeUser });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
