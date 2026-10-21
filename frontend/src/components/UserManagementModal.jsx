import React, { useState } from 'react';
import { UserPlus, Shield, Key, Mail, User, Briefcase, X, Check } from 'lucide-react';
import { fetchApi } from '../services/api';

export const SDLC_ROLES = [
  { role: 'Project Manager', title: 'Senior Project Manager', phase: 'Planning / Overall' },
  { role: 'Business Analyst', title: 'Requirements Lead', phase: 'Phase 2: Requirements' },
  { role: 'Technical Architect', title: 'System Architect', phase: 'Phase 3: Design' },
  { role: 'UI/UX Designer', title: 'Lead Designer', phase: 'Phase 3: Design' },
  { role: 'Team Lead', title: 'Development Team Lead', phase: 'Phase 4: Development' },
  { role: 'Developer', title: 'Fullstack Developer', phase: 'Phase 4: Development' },
  { role: 'Tester / QA', title: 'QA & Test Lead', phase: 'Phase 5: Testing' },
  { role: 'DevOps Lead', title: 'Deployment & Release Lead', phase: 'Phase 6: Deployment' },
  { role: 'Maintenance Lead', title: 'Sustaining Lead', phase: 'Phase 7: Maintenance' },
  { role: 'Client Representative', title: 'Client Product Owner', phase: 'Signoff / Verification' }
];

export default function UserManagementModal({ isOpen, onClose, onUserCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Business Analyst',
    title: 'Requirements Lead'
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleRoleChange = (e) => {
    const selectedRole = e.target.value;
    const matched = SDLC_ROLES.find(r => r.role === selectedRole);
    setFormData({
      ...formData,
      role: selectedRole,
      title: matched ? matched.title : 'Team Specialist'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      alert('Please fill out all required credential fields.');
      return;
    }
    setLoading(true);
    setSuccessMsg('');
    try {
      const res = await fetchApi('/auth/users', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setLoading(false);
      setSuccessMsg(`Employee account created successfully! Credentials: ${formData.email}`);
      if (onUserCreated) onUserCreated(res.user || res);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    } catch (err) {
      setLoading(false);
      alert(`Error creating credential: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 md:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto my-auto space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Create Employee Login Credentials</h2>
            <p className="text-xs text-slate-400">PM Tool to generate role-based credentials for SDLC lifecycle phases</p>
          </div>
        </div>

        {successMsg ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rachel Adams"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-200 focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Login Email *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="rachel.analyst@company.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-200 focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Temporary Password *</label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-200 focus:border-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">SDLC Phase Role *</label>
                <select
                  value={formData.role}
                  onChange={handleRoleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-brand-500"
                >
                  {SDLC_ROLES.map(r => (
                    <option key={r.role} value={r.role}>{r.role}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Designation Title</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-200 focus:border-brand-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white rounded-lg font-bold shadow-lg shadow-brand-500/20"
              >
                {loading ? 'Creating Credentials...' : 'Generate Login Account'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
