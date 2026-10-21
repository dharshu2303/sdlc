import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Layers,
  ShieldCheck,
  FileCheck2,
  Users,
  User,
  Eye,
  CheckCircle2,
  Shield,
  Info,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SDLC_RACI_MATRIX } from '../config/docRaci';

// Roles that can have MULTIPLE members assigned (checkboxes)
const MULTI_MEMBER_ROLES = ['Developer', 'Tester / QA', 'UI/UX Designer', 'Database Administrator'];
// Roles that are SINGLETON — only one person assigned (dropdown)
const SINGLETON_ROLES = ['Project Manager', 'Business Analyst', 'Technical Architect', 'Team Lead', 'Client Representative'];
const ALL_ROLES = [...SINGLETON_ROLES, ...MULTI_MEMBER_ROLES];

export default function ProjectWizard({ activeUser }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [methodologies, setMethodologies] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  if (activeUser && activeUser.role !== 'Project Manager') {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="p-8 bg-white border border-red-200 rounded-2xl max-w-md text-center space-y-4 shadow-lg">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-600 font-bold text-xl">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Access Restricted</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Only designated <strong>Project Managers</strong> have governance authorization to initialize and configure new SDLC projects.
          </p>
          <button
            onClick={() => navigate('/projects')}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    clientName: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    type: 'Enterprise Web Platform',
    priority: 'High',
    methodologyId: ''
  });

  // Role Assignments:
  // Singleton roles: store single userId string
  // Multi-member roles: store array of userIds
  const [roleAssignments, setRoleAssignments] = useState({
    'Project Manager': '',
    'Business Analyst': '',
    'Technical Architect': '',
    'Team Lead': '',
    'Client Representative': '',
    'Developer': [],
    'Tester / QA': [],
    'UI/UX Designer': [],
    'Database Administrator': []
  });

  useEffect(() => {
    Promise.all([
      fetchApi('/methodologies'),
      fetchApi('/auth/users/all')
    ]).then(([methData, usersData]) => {
      setMethodologies(methData || []);
      if (methData && methData.length > 0) {
        setFormData(prev => ({ ...prev, methodologyId: methData[0].id }));
      }
      const validUsers = (usersData || []).filter(u => u.role !== 'Admin');
      setAllUsers(validUsers);

      // Auto-assign available users based on strict role match
      const initialRoles = {};
      SINGLETON_ROLES.forEach(r => {
        const matching = validUsers.filter(u => u.role === r);
        initialRoles[r] = matching.length > 0 ? matching[0].id : '';
      });
      MULTI_MEMBER_ROLES.forEach(r => {
        const matching = validUsers.filter(u => u.role === r);
        initialRoles[r] = matching.map(u => u.id);
      });
      setRoleAssignments(initialRoles);

      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const selectedMethodology = methodologies.find(m => m.id === formData.methodologyId);

  // Phase Planned Durations State (PM Timeline Allocation)
  const [phaseDurations, setPhaseDurations] = useState({
    'Planning': 10,
    'Requirements': 14,
    'Design': 15,
    'Development': 30,
    'Testing': 20,
    'Deployment': 10,
    'Maintenance': 15
  });

  // Role completeness validation metrics
  const missingRolesInSystem = ALL_ROLES.filter(r => allUsers.filter(u => u.role === r).length === 0);
  const unassignedSingletonRoles = SINGLETON_ROLES.filter(r => {
    const matching = allUsers.filter(u => u.role === r);
    return matching.length === 0 || !roleAssignments[r] || !matching.some(u => u.id === roleAssignments[r]);
  });
  const unassignedMultiRoles = MULTI_MEMBER_ROLES.filter(r => {
    const matching = allUsers.filter(u => u.role === r);
    const assigned = roleAssignments[r] || [];
    return matching.length === 0 || assigned.length === 0;
  });

  const canProceedFromStep4 = missingRolesInSystem.length === 0 && unassignedSingletonRoles.length === 0 && unassignedMultiRoles.length === 0;

  const handleSubmitWizard = async () => {
    setSubmitting(true);
    try {
      // Flatten multi-member roles to individual entries
      const flatRoleAssignments = [];
      Object.entries(roleAssignments).forEach(([roleName, value]) => {
        if (Array.isArray(value)) {
          value.forEach(userId => flatRoleAssignments.push({ roleName, userId }));
        } else if (value) {
          flatRoleAssignments.push({ roleName, userId: value });
        }
      });

      const payload = { ...formData, phaseDurations, roleAssignments: flatRoleAssignments };
      const res = await fetchApi('/projects/wizard', { method: 'POST', body: JSON.stringify(payload) });
      setSubmitting(false);
      navigate(res.projectId ? `/projects/${res.projectId}` : '/projects');
    } catch (err) {
      alert(`Wizard creation error: ${err.message}`);
      setSubmitting(false);
    }
  };

  // Toggle user in multi-member role array
  const toggleMultiMember = (roleName, userId) => {
    const current = roleAssignments[roleName] || [];
    const updated = current.includes(userId)
      ? current.filter(id => id !== userId)
      : [...current, userId];
    setRoleAssignments({ ...roleAssignments, [roleName]: updated });
  };

  const handleNextStep = () => {
    if (step === 1 && !formData.name) {
      return alert('Please enter project name.');
    }
    if (step === 4) {
      if (missingRolesInSystem.length > 0) {
        return alert(
          `Cannot proceed to next step!\n\nThe following required SDLC roles have NO registered users in your system:\n• ${missingRolesInSystem.join('\n• ')}\n\nEvery role must have at least one registered person in the system before a project can be created. Please have the System Administrator provision users for these missing roles in Employee Management.`
        );
      }
      if (unassignedSingletonRoles.length > 0) {
        return alert(`Please assign a person for the following lead role(s): ${unassignedSingletonRoles.join(', ')}.`);
      }
      if (unassignedMultiRoles.length > 0) {
        return alert(`Please select at least one member for the following team role(s): ${unassignedMultiRoles.join(', ')}.`);
      }
    }
    setStep(Math.min(6, step + 1));
  };

  if (loading) return <div className="p-8 text-center text-slate-400 text-xs animate-pulse">Loading Methodology Frameworks & Team Roster...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Step Stepper Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          Guided Project Creation & Documentation Planning Wizard
        </h1>
        <p className="text-xs text-slate-500 mt-1">Configure your SDLC methodology lifecycle, assign RACI roles, and generate mandatory documentation requirements.</p>

        <div className="mt-6 grid grid-cols-6 gap-2">
          {[
            { num: 1, label: 'Info' },
            { num: 2, label: 'Methodology' },
            { num: 3, label: 'Lifecycle' },
            { num: 4, label: 'Roles RACI' },
            { num: 5, label: 'Artifact Plan' },
            { num: 6, label: 'Initialize' }
          ].map(s => (
            <div
              key={s.num}
              onClick={() => {
                if (s.num < step) {
                  setStep(s.num);
                } else if (s.num > step) {
                  if (step === 1 && !formData.name) return alert('Please enter project name.');
                  if (step === 4 && !canProceedFromStep4) {
                    return handleNextStep();
                  }
                  if (s.num === step + 1) setStep(s.num);
                }
              }}
              className={`p-2 rounded-xl text-center border cursor-pointer transition-colors ${
                step === s.num
                  ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-md shadow-blue-600/20'
                  : step > s.num
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold'
                  : 'bg-slate-50 text-slate-400 border-slate-200'
              }`}
            >
              <div className="text-[10px] uppercase font-bold">Step {s.num}</div>
              <div className="text-xs truncate">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">

        {/* Step 1: Project Information */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">Step 1 — Project Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Project Name *</label>
                <input type="text" placeholder="e.g. Healthcare Patient Portal" value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition-all" />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Project Code *</label>
                <input type="text" placeholder="e.g. HPP-2026" value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition-all" />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Client / Organization</label>
                <input type="text" placeholder="e.g. Apex Health Corp" value={formData.clientName}
                  onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition-all" />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Project Priority</label>
                <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition-all">
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">Project Description</label>
                <textarea rows={3} placeholder="Describe the governance scope and SDLC objectives..." value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition-all" />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Select Methodology */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">Step 2 — Select SDLC Methodology</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {methodologies.map(m => (
                <div key={m.id} onClick={() => setFormData({ ...formData, methodologyId: m.id })}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    formData.methodologyId === m.id
                      ? 'bg-blue-50 border-blue-500 shadow-xl shadow-blue-500/10'
                      : 'bg-slate-50 border-slate-200 hover:border-blue-300'
                  }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-base">{m.name}</span>
                    {formData.methodologyId === m.id && <Check className="w-5 h-5 text-blue-600" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{m.description}</p>
                  <div className="mt-4 text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    <span>{m.phases?.length || 0} Defined Phases</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Lifecycle & Timeline Allocation */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-800">Step 3 — PM Phase Timeline & Duration Allocation</h2>
              <span className="text-[11px] text-blue-600 font-semibold">Total: {Object.values(phaseDurations).reduce((a, b) => a + Number(b), 0)} Days</span>
            </div>
            <div className="space-y-2.5">
              {selectedMethodology?.phases?.map(p => (
                <div key={p.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs gap-3 hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-bold flex items-center justify-center border border-blue-200 text-xs">P{p.sequence}</div>
                    <div>
                      <div className="font-semibold text-slate-800">{p.name}</div>
                      <div className="text-[11px] text-slate-500">{p.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" min="1" max="180"
                      value={phaseDurations[p.name] !== undefined ? phaseDurations[p.name] : 14}
                      onChange={e => setPhaseDurations({ ...phaseDurations, [p.name]: Math.max(1, parseInt(e.target.value || '1', 10)) })}
                      className="w-16 bg-white border border-slate-300 rounded-lg text-center py-1.5 font-bold text-blue-600 focus:outline-none focus:border-blue-500" />
                    <span className="text-[11px] text-slate-500">Days</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Configure RACI Roles — Strictly Role-Matched Options */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-800">Step 4 — Configure Project Roles & RACI Assignments</h2>
              <p className="text-xs text-slate-500 mt-1">
                Assign qualified system personnel to each governance role.
                <span className="text-blue-700 font-semibold ml-1">Options show only users registered with that specific role.</span>
              </p>
            </div>

            {/* Missing Roles Warning Blocker */}
            {missingRolesInSystem.length > 0 && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 space-y-2">
                <div className="font-bold flex items-center gap-2 text-xs text-red-700">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Cannot Proceed to Next Step: Missing Required System Roles ({missingRolesInSystem.length})</span>
                </div>
                <p className="text-xs text-red-700 leading-relaxed">
                  Every SDLC role must have at least one registered person in the system before you can create a project. The following roles currently have <strong>0 users</strong>:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {missingRolesInSystem.map(r => (
                    <span key={r} className="px-2.5 py-1 rounded-lg bg-red-100 border border-red-300 text-red-800 font-bold text-xs">
                      {r} (0 Persons)
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-red-600 pt-1">
                  Please ask the System Administrator to add personnel for these missing roles in <strong>System Employee Management</strong> before proceeding.
                </p>
              </div>
            )}

            {/* SINGLETON ROLES — Dropdown (Strictly filtered by role) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-100">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Lead Roles — Single Person Assignment (Strictly Role-Filtered)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {SINGLETON_ROLES.map(roleName => {
                  const matchedUsers = allUsers.filter(u => u.role === roleName);
                  const hasUsers = matchedUsers.length > 0;
                  const isAssigned = !!roleAssignments[roleName] && matchedUsers.some(u => u.id === roleAssignments[roleName]);

                  return (
                    <div
                      key={roleName}
                      className={`p-4 rounded-xl border transition-all ${
                        !hasUsers
                          ? 'bg-red-50/60 border-red-200'
                          : !isAssigned
                          ? 'bg-amber-50/60 border-amber-200'
                          : 'bg-slate-50 border-slate-200 hover:border-blue-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div>
                          <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5 flex-wrap">
                            <span>{roleName}</span>
                            {!hasUsers ? (
                              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold border border-red-200">
                                0 Persons Found
                              </span>
                            ) : isAssigned ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                Assigned
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold border border-amber-200">
                                Selection Required
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Single lead — 1 person</div>
                        </div>
                      </div>

                      {hasUsers ? (
                        <select
                          value={roleAssignments[roleName] || ''}
                          onChange={e => setRoleAssignments({ ...roleAssignments, [roleName]: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 text-xs focus:outline-none focus:border-blue-500 font-medium"
                        >
                          <option value="">— Select {roleName} —</option>
                          {matchedUsers.map(u => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.email})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-[11px] text-red-700 bg-white p-2.5 rounded-lg border border-red-200 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>No user registered with role <strong>"{roleName}"</strong> in system.</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* MULTI-MEMBER ROLES — Checkboxes (Strictly filtered by role) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-100">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Team Roles — Multiple Members Allowed (Checkboxes)</span>
              </div>

              {MULTI_MEMBER_ROLES.map(roleName => {
                const eligible = allUsers.filter(u => u.role === roleName);
                const selected = roleAssignments[roleName] || [];
                const hasUsers = eligible.length > 0;
                const hasSelected = selected.length > 0;

                return (
                  <div
                    key={roleName}
                    className={`p-4 rounded-xl border space-y-3 transition-all ${
                      !hasUsers
                        ? 'bg-red-50/60 border-red-200'
                        : !hasSelected
                        ? 'bg-amber-50/60 border-amber-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {/* Role Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5 flex-wrap">
                          <Users className="w-3.5 h-3.5 text-blue-600" />
                          <span>{roleName}</span>
                          {!hasUsers ? (
                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold border border-red-200">
                              0 Persons Found
                            </span>
                          ) : hasSelected ? (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold border border-blue-200">
                              {selected.length} Selected
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold border border-amber-200">
                              Selection Required
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Multiple members allowed &bull;{' '}
                          <span className={`font-semibold ${hasSelected ? 'text-blue-600' : 'text-amber-600'}`}>
                            {selected.length} assigned
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        Team Role
                      </span>
                    </div>

                    {/* Checkbox List */}
                    {hasUsers ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {eligible.map(u => {
                          const isChecked = selected.includes(u.id);
                          return (
                            <label
                              key={u.id}
                              className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center gap-2 text-xs ${
                                isChecked
                                  ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-2xs font-medium'
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleMultiMember(roleName, u.id)}
                                className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="font-semibold text-[11px] truncate">{u.name}</div>
                                <div className="text-[10px] text-slate-400 truncate">{u.email}</div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-[11px] text-red-700 bg-white p-2.5 rounded-lg border border-red-200 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>No user registered with role <strong>"{roleName}"</strong> in system.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* RACI Assignment Summary */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="font-bold text-slate-700 mb-2.5">RACI Assignment Summary</div>
              <div className="space-y-1.5 text-[11px] text-slate-500">
                {SINGLETON_ROLES.map(roleName => {
                  const u = allUsers.find(u => u.id === roleAssignments[roleName]);
                  return (
                    <div key={roleName} className="flex justify-between items-center">
                      <span>{roleName}:</span>
                      <span className="font-semibold text-slate-800">{u ? u.name : <span className="text-red-600 font-medium">Not Assigned</span>}</span>
                    </div>
                  );
                })}
                {MULTI_MEMBER_ROLES.map(roleName => {
                  const selected = roleAssignments[roleName] || [];
                  const names = selected.map(id => allUsers.find(u => u.id === id)?.name).filter(Boolean);
                  return (
                    <div key={roleName} className="flex justify-between items-start">
                      <span>{roleName}:</span>
                      <span className="font-semibold text-blue-700 text-right">
                        {names.length > 0 ? names.join(', ') : <span className="text-red-600 font-medium">None Selected</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Generated Documentation Plan — RACI Governance Matrix */}
        {step === 5 && (() => {
          const isScrum = selectedMethodology?.name?.toLowerCase().includes('scrum') || selectedMethodology?.name?.toLowerCase().includes('agile');
          const plan = isScrum ? SDLC_RACI_MATRIX.Scrum : SDLC_RACI_MATRIX.Waterfall;
          const totalDocs = plan.reduce((s, p) => s + p.documents.length, 0);
          const requiredDocs = plan.reduce((s, p) => s + p.documents.filter(d => d.required).length, 0);

          const colorMap = {
            purple:  { bg: 'bg-purple-50',  border: 'border-purple-200',  badge: 'bg-purple-100 text-purple-700 border-purple-200',   dot: 'bg-purple-500',  head: 'text-purple-700'  },
            blue:    { bg: 'bg-blue-50',    border: 'border-blue-200',    badge: 'bg-blue-100 text-blue-700 border-blue-200',         dot: 'bg-blue-500',    head: 'text-blue-700'    },
            cyan:    { bg: 'bg-cyan-50',    border: 'border-cyan-200',    badge: 'bg-cyan-100 text-cyan-700 border-cyan-200',         dot: 'bg-cyan-500',    head: 'text-cyan-700'    },
            indigo:  { bg: 'bg-indigo-50',  border: 'border-indigo-200',  badge: 'bg-indigo-100 text-indigo-700 border-indigo-200',   dot: 'bg-indigo-500',  head: 'text-indigo-700'  },
            amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   badge: 'bg-amber-100 text-amber-700 border-amber-200',      dot: 'bg-amber-500',   head: 'text-amber-700'   },
            orange:  { bg: 'bg-orange-50',  border: 'border-orange-200',  badge: 'bg-orange-100 text-orange-700 border-orange-200',   dot: 'bg-orange-500',  head: 'text-orange-700'  },
            rose:    { bg: 'bg-rose-50',    border: 'border-rose-200',    badge: 'bg-rose-100 text-rose-700 border-rose-200',         dot: 'bg-rose-500',    head: 'text-rose-700'    },
            emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', head: 'text-emerald-700' },
            slate:   { bg: 'bg-slate-50',   border: 'border-slate-200',   badge: 'bg-slate-100 text-slate-600 border-slate-200',      dot: 'bg-slate-500',   head: 'text-slate-600'   },
          };

          return (
            <div className="space-y-5">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Step 5 — SDLC RACI Document Ownership & Approval Matrix
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pre-configured governance rules mapping Document Ownership, Review/Approval Signoffs, and View Access per phase.
                </p>
              </div>

              {/* Banner */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div>
                  <div className="text-xs text-blue-100 font-semibold uppercase tracking-wider mb-1">Methodology Governance Matrix</div>
                  <div className="text-lg font-black text-white">{selectedMethodology?.name || (isScrum ? 'Scrum / Agile' : 'Waterfall')}</div>
                  <div className="text-xs text-blue-200 mt-0.5">RACI rules active for all {plan.length} phases & deliverables</div>
                </div>
                <div className="flex gap-3 shrink-0">
                  <div className="bg-white/15 border border-white/20 rounded-xl px-4 py-2 text-center">
                    <div className="text-2xl font-black text-white">{totalDocs}</div>
                    <div className="text-[10px] text-blue-100 font-semibold">Total Specs</div>
                  </div>
                  <div className="bg-white/15 border border-white/20 rounded-xl px-4 py-2 text-center">
                    <div className="text-2xl font-black text-emerald-300">{requiredDocs}</div>
                    <div className="text-[10px] text-blue-100 font-semibold">Gate Blockers</div>
                  </div>
                  <div className="bg-white/15 border border-white/20 rounded-xl px-4 py-2 text-center">
                    <div className="text-2xl font-black text-amber-300">{totalDocs - requiredDocs}</div>
                    <div className="text-[10px] text-blue-100 font-semibold">Optional Specs</div>
                  </div>
                </div>
              </div>

              {/* Phase-by-phase cards */}
              <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
                {plan.map((pg, pIdx) => {
                  const c = colorMap[pg.color] || colorMap.slate;
                  return (
                    <div key={pIdx} className={`rounded-2xl border ${c.border} overflow-hidden bg-white shadow-sm`}>
                      {/* Phase Header */}
                      <div className={`${c.bg} px-5 py-3.5 space-y-2 border-b ${c.border}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                            <span className={`text-xs font-bold uppercase tracking-wider ${c.head}`}>
                              {pg.phaseName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${c.badge}`}>
                              {pg.documents.length} Documents
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                              {pg.documents.filter(d => d.required).length} Mandatory
                            </span>
                          </div>
                        </div>

                        {pg.purpose && (
                          <div className="text-[11px] text-slate-600 pl-5 font-medium">
                            <strong className="text-slate-700">Purpose:</strong> {pg.purpose}
                          </div>
                        )}

                        {pg.mainAccessRoles && pg.mainAccessRoles.length > 0 && (
                          <div className="flex items-center gap-2 pl-5 flex-wrap pt-0.5">
                            <span className="text-[10px] font-bold uppercase text-slate-500">Main Access Roles:</span>
                            {pg.mainAccessRoles.map((role, rIdx) => (
                              <span key={rIdx} className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 text-[10px] font-semibold rounded-md shadow-2xs">
                                {role}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Documents RACI Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 text-[10px] text-slate-500 font-bold uppercase border-b border-slate-200">
                            <tr>
                              <th className="px-4 py-2.5 w-1/4">Document / Specification</th>
                              <th className="px-4 py-2.5 w-1/5">Owner / Author (Edit)</th>
                              <th className="px-4 py-2.5 w-1/4">Review / Signoff Approvers</th>
                              <th className="px-4 py-2.5 w-1/4">View Access Consumers</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {pg.documents.map((doc, dIdx) => (
                              <tr key={dIdx} className="hover:bg-blue-50/20 transition-colors">
                                {/* Document info */}
                                <td className="px-4 py-3 align-top">
                                  <div className="flex items-start gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${doc.required ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                    <div>
                                      <div className="font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                                        <span>{doc.name}</span>
                                        {doc.required && (
                                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            MANDATORY
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">Type: {doc.type}</div>
                                      {doc.description && (
                                        <div className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                          {doc.description}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                {/* Owner / Edit */}
                                <td className="px-4 py-3 align-top">
                                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-xs">
                                    <User className="w-3 h-3 text-blue-600 shrink-0" />
                                    <span>{doc.owner}</span>
                                  </div>
                                </td>

                                {/* Review / Approve */}
                                <td className="px-4 py-3 align-top">
                                  <div className="inline-flex items-start gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-xs leading-snug">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>{doc.reviewApprove}</span>
                                  </div>
                                </td>

                                {/* View Access */}
                                <td className="px-4 py-3 align-top">
                                  <div className="flex items-start gap-1.5 text-[11px] text-slate-600 leading-snug">
                                    <Eye className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                    <span>{doc.viewAccess}</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                <div className="flex items-center gap-1.5 font-medium">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span><strong>Mandatory:</strong> Required signoff before closing SDLC phase gate</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <span><strong>Optional:</strong> Recommended governance specification</span>
                </div>
              </div>
            </div>
          );
        })()}


        {/* Step 6: Confirmation */}
        {step === 6 && (
          <div className="space-y-5 text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center shadow-xl shadow-blue-500/20 mx-auto">
              <ShieldCheck className="w-9 h-9 text-white" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Ready to Initialize SDLC Governance Lifecycle</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Creating project <strong className="text-slate-800">{formData.name || 'New Project'}</strong> using{' '}
              <strong className="text-blue-600">{selectedMethodology?.name}</strong> framework with rule-based phase gate enforcement.
            </p>
            <button
              onClick={handleSubmitWizard}
              disabled={submitting}
              className="mt-4 px-8 py-3 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white font-bold rounded-xl text-sm shadow-xl shadow-blue-600/30 transition-all cursor-pointer"
            >
              {submitting ? 'Initializing Project...' : 'Confirm & Launch Project Governance'}
            </button>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold disabled:opacity-40 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {step < 6 && (
            <button
              onClick={handleNextStep}
              className={`px-4 py-2 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-md transition-all cursor-pointer ${
                step === 4 && !canProceedFromStep4
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
              }`}
            >
              <span>{step === 4 && !canProceedFromStep4 ? 'Validate & Next Step' : 'Next Step'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
