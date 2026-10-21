import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Shield, UserPlus, KeyRound, CheckCircle2, Mail, AlertCircle, RefreshCw, Edit, Trash2, X, FolderGit2, FileText, AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';

export default function TeamManagementPage() {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Modals State
  const [editingUser, setEditingUser] = useState(null);

  // Deletion Twice Approval Modal State
  const [deleteImpactUser, setDeleteImpactUser] = useState(null);
  const [impactData, setImpactData] = useState(null);
  const [impactLoading, setImpactLoading] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [twiceApprovedCheck, setTwiceApprovedCheck] = useState(false);

  // New Employee Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Business Analyst',
    title: ''
  });

  const loadUsers = () => {
    fetchApi('/auth/users/all')
      .then(data => {
        setUsersList(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => { loadUsers(); }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setSubmitting(true);
    try {
      const created = await fetchApi('/auth/users/create', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setMessage(`Successfully created employee account for ${created.name} (${created.role})! Initial default password set to: 123`);
      setFormData({ name: '', email: '', role: 'Business Analyst', title: '' });
      setSubmitting(false);
      loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to create employee account.');
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await fetchApi(`/auth/users/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(editingUser)
      });
      alert(`Updated employee details for ${editingUser.name}!`);
      setEditingUser(null);
      loadUsers();
    } catch (err) {
      alert(`Update error: ${err.message}`);
    }
  };

  const handleInitiateDelete = (u) => {
    setDeleteImpactUser(u);
    setDeleteStep(1);
    setTwiceApprovedCheck(false);
    setImpactLoading(true);
    fetchApi(`/auth/users/${u.id}/impact`)
      .then(data => {
        setImpactData(data);
        setImpactLoading(false);
      })
      .catch(err => {
        console.error(err);
        setImpactLoading(false);
      });
  };

  const handleExecuteTwiceApprovedDelete = async () => {
    if (!deleteImpactUser || !twiceApprovedCheck) return;
    try {
      await fetchApi(`/auth/users/${deleteImpactUser.id}`, { method: 'DELETE' });
      alert(`Twice Approved Deletion Completed! Employee ${deleteImpactUser.name} has been permanently removed.`);
      setDeleteImpactUser(null);
      setImpactData(null);
      setDeleteStep(1);
      setTwiceApprovedCheck(false);
      loadUsers();
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const handleResetPassword = async (userId, userName) => {
    if (!window.confirm(`Reset password to default (123) for ${userName}?`)) return;
    try {
      await fetchApi(`/auth/users/${userId}/reset-password`, { method: 'PUT' });
      alert(`Password successfully reset to default (123) for ${userName}!`);
      loadUsers();
    } catch (err) {
      alert(`Reset error: ${err.message}`);
    }
  };

  if (loading) return (
    <div className="p-8 text-center text-blue-400 text-xs animate-pulse">
      Loading System Employee Accounts...
    </div>
  );

  const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 text-xs focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition-all";
  const labelCls = "block text-slate-700 font-semibold mb-1 text-xs";
  const roleOptions = [
    'Project Manager', 'Business Analyst', 'Technical Architect', 'Team Lead',
    'Developer', 'UI/UX Designer', 'Tester / QA', 'Database Administrator',
    'Client Representative', 'Auditor'
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Shield className="w-4 h-4 text-blue-600" />
            </div>
            Employees
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Default initial password: <strong className="text-amber-600 font-mono">123</strong>
          </p>
        </div>
        <div className="px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 font-semibold">
          Total Employees: <strong>{usersList.length}</strong>
        </div>
      </div>

      {/* Grid Layout: Create Account Form + Accounts Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Create Employee Account Form */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <UserPlus className="w-4 h-4 text-blue-500" />
            Add New Employee Account
          </h2>

          {message && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-3">
            <div>
              <label className={labelCls}>Employee Full Name *</label>
              <input type="text" required placeholder="e.g. Jessica Taylor" value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Corporate Email Address *</label>
              <input type="email" required placeholder="jessica.ba@bankgov.com" value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })} className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Assigned SDLC Governance Role *</label>
              <select value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value, title: e.target.value })}
                className={inputCls}>
                {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center justify-between">
              <span>Auto Initial Password:</span>
              <strong className="font-mono text-xs bg-amber-100 px-2 py-0.5 rounded border border-amber-300">123</strong>
            </div>

            <button type="submit" disabled={submitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl shadow-md shadow-blue-600/20 text-xs transition-all cursor-pointer mt-2">
              {submitting ? 'Creating Employee...' : 'Add Employee Account'}
            </button>
          </form>
        </div>

        {/* Right Column: Existing Employee Accounts Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">
              Registered Employee Accounts ({usersList.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase">
                <tr>
                  <th className="px-5 py-3">Employee & Title</th>
                  <th className="px-5 py-3">Assigned Role</th>
                  <th className="px-5 py-3">Email Address</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map(u => (
                  <tr key={u.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                          {u.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{u.name}</div>
                          <div className="text-[11px] text-slate-400">{u.title || u.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                        u.role === 'Admin'
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">{u.email}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => setEditingUser({ ...u })}
                          className="p-1.5 bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600 rounded-lg transition-colors" title="Edit Employee">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleResetPassword(u.id, u.name)}
                          className="p-1.5 bg-slate-100 hover:bg-amber-100 text-slate-500 hover:text-amber-600 rounded-lg transition-colors" title="Reset Password to 123">
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        {u.role !== 'Admin' && (
                          <button onClick={() => handleInitiateDelete(u)}
                            className="p-1.5 bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 rounded-lg transition-colors" title="Delete Employee">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* EDIT EMPLOYEE MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Edit className="w-4 h-4 text-blue-500" />
                Edit Employee Details
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-3">
              <div>
                <label className={labelCls}>Full Name</label>
                <input type="text" required value={editingUser.name}
                  onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Corporate Email</label>
                <input type="email" required value={editingUser.email}
                  onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Assigned SDLC Governance Role</label>
                <select value={editingUser.role}
                  onChange={e => setEditingUser({ ...editingUser, role: e.target.value })} className={inputCls}>
                  {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold text-xs transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/20 text-xs transition-colors">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TWICE APPROVAL EMPLOYEE DELETION MODAL */}
      {deleteImpactUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <div>
                  <h3 className="text-sm font-bold text-red-700">Employee Deletion Workflow</h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Step {deleteStep} of 2 &bull; Twice Approval Verification
                  </span>
                </div>
              </div>
              <button onClick={() => { setDeleteImpactUser(null); setImpactData(null); }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            {impactLoading ? (
              <div className="p-6 text-center text-blue-400 text-xs animate-pulse">
                Analyzing Employee Project Assignments...
              </div>
            ) : impactData ? (
              <div className="space-y-4 text-xs">
                {/* Employee Info Header */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{impactData.user.name}</div>
                    <div className="text-[11px] text-slate-500">{impactData.user.email} &bull; {impactData.user.role}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                    impactData.assignedProjects.length > 1
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {impactData.assignedProjects.length > 1
                      ? `Multiple Projects (${impactData.assignedProjects.length})`
                      : impactData.assignedProjects.length === 1
                      ? 'Single Project (1)'
                      : 'No Projects (0)'}
                  </span>
                </div>

                {/* STEP 1 */}
                {deleteStep === 1 && (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold">1st Approval — Project Intimation:</strong>
                        <span>This employee handles <strong>{impactData.assignedProjects.length} project(s)</strong> and <strong>{impactData.authoredArtifacts.length} authored document(s)</strong>. Twice Approval is required to proceed.</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="font-bold text-slate-600 uppercase text-[11px] flex items-center gap-1.5">
                        <FolderGit2 className="w-3.5 h-3.5 text-blue-500" />
                        Handled Projects ({impactData.assignedProjects.length})
                      </div>
                      {impactData.assignedProjects.length === 0 ? (
                        <div className="text-slate-400 text-[11px] p-2 rounded bg-slate-50 border border-slate-200">No active project assignments.</div>
                      ) : (
                        impactData.assignedProjects.map((p, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
                            <div>
                              <div className="font-semibold text-slate-700">{p.projectName} ({p.projectCode})</div>
                              <div className="text-[10px] text-slate-400">Assigned Role: {p.assignedRole}</div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">Active</span>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="font-bold text-slate-600 uppercase text-[11px] flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        Authored Specifications ({impactData.authoredArtifacts.length})
                      </div>
                      {impactData.authoredArtifacts.length === 0 ? (
                        <div className="text-slate-400 text-[11px] p-2 rounded bg-slate-50 border border-slate-200">No authored specifications.</div>
                      ) : (
                        impactData.authoredArtifacts.map(a => (
                          <div key={a.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
                            <div>
                              <div className="font-semibold text-slate-700">{a.title}</div>
                              <div className="text-[10px] text-slate-400">Type: {a.artifactType} &bull; v{a.currentVersion}</div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">{a.status}</span>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                      <button type="button" onClick={() => { setDeleteImpactUser(null); setImpactData(null); }}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold text-xs">Cancel</button>
                      <button type="button" onClick={() => setDeleteStep(2)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/20 text-xs flex items-center gap-1.5">
                        <span>Approve 1st Step → 2nd Approval</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2 */}
                {deleteStep === 2 && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <strong className="block text-sm font-bold">2nd Approval — Final Verification:</strong>
                        <p className="leading-relaxed">
                          You are executing the <strong>Final Approval</strong> to permanently remove <strong>{impactData.user.name}</strong> from the organization.
                          This will unassign them from <strong>{impactData.assignedProjects.length} project(s)</strong>.
                        </p>
                      </div>
                    </div>

                    <label className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 cursor-pointer hover:border-red-300 transition-colors">
                      <input type="checkbox" checked={twiceApprovedCheck}
                        onChange={e => setTwiceApprovedCheck(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded text-red-600 border-slate-300 focus:ring-red-500" />
                      <span className="text-xs text-slate-700 leading-snug">
                        <strong>I hereby grant 2nd Approval</strong> to delete {impactData.user.name} and unassign them from all handled project(s) ({impactData.assignedProjects.map(p => p.projectName).join(', ') || 'None'}).
                      </span>
                    </label>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <button type="button" onClick={() => setDeleteStep(1)}
                        className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium">
                        ← Back to 1st Step
                      </button>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => { setDeleteImpactUser(null); setImpactData(null); setDeleteStep(1); }}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold text-xs">
                          Cancel
                        </button>
                        <button type="button" disabled={!twiceApprovedCheck} onClick={handleExecuteTwiceApprovedDelete}
                          className={`px-5 py-2 rounded-xl font-bold text-white text-xs shadow-md transition-all ${
                            twiceApprovedCheck ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20 cursor-pointer' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          }`}>
                          Confirm & Delete Employee
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
