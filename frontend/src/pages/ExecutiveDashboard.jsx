import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import {
  LayoutDashboard,
  CheckCircle2,
  Lock,
  Clock,
  AlertTriangle,
  FileCheck2,
  ChevronRight,
  TrendingUp,
  Layers,
  FileText,
  UserCheck,
  Compass,
  Activity,
  Plus,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ExecutiveDashboard({ activeUser }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projectsList, setProjectsList] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [lockedPhaseModal, setLockedPhaseModal] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchApi('/projects')
      .then(res => {
        const projs = res || [];
        setProjectsList(projs);
        if (projs.length > 0 && !selectedProjectId) {
          setSelectedProjectId(projs[0].id);
        } else if (projs.length === 0) {
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

    fetchApi('/audit/logs')
      .then(res => setAuditLogs(res || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    setLoading(true);
    fetchApi(`/dashboard/overview/${selectedProjectId}`)
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedProjectId]);

  if (loading) return (
    <div className="p-8 text-center text-blue-400 text-xs animate-pulse">
      Loading Executive Governance Dashboard...
    </div>
  );

  const isProjectManager = activeUser?.role === 'Project Manager';

  if (projectsList.length === 0 || !data) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="p-12 text-center space-y-5 max-w-md w-full bg-white border border-blue-100 rounded-2xl shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto">
            <Compass className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">No SDLC Projects Available</h2>
            <p className="text-xs text-slate-500 leading-relaxed mt-2">
              {isProjectManager
                ? 'You have a fresh clean slate! Create your first software development project to begin SDLC phase gate governance and track documentation deliverables.'
                : 'No projects have been assigned yet. Please contact your Project Manager to initialize and configure an SDLC project.'}
            </p>
          </div>
          {isProjectManager && (
            <button
              onClick={() => navigate('/projects/new')}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 inline-flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Project</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const {
    project,
    overallProgressPct = 0,
    totalArtifacts = 0,
    publishedArtifacts = 0,
    currentPhase,
    blockers = [],
    actionsNeeded = []
  } = data || {};

  const phases = project?.phases || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* HERO PROJECT GOVERNANCE HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-2xl shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-72 h-72 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-2 relative">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-white/20 text-white border border-white/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              SDLC Governance Active
            </span>
            <span className="text-xs text-blue-200 font-mono">ID: {project?.code || 'PRJ'}</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white tracking-tight">{project?.name}</h1>
            {projectsList.length > 1 && (
              <select
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
                className="bg-white/20 border border-white/30 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none font-semibold cursor-pointer backdrop-blur"
              >
                {projectsList.map(p => (
                  <option key={p.id} value={p.id} className="text-slate-800 bg-white">{p.name}</option>
                ))}
              </select>
            )}
          </div>

          <p className="text-xs text-blue-100 max-w-2xl leading-relaxed">
            {project?.description} &bull; Client: <strong className="text-white">{project?.clientName || 'Internal'}</strong> &bull; Priority: <strong className="text-emerald-300">{project?.priority || 'Normal'}</strong>
          </p>
        </div>

        {/* Overall Progress Gauge Widget */}
        <div className="bg-white/15 border border-white/20 backdrop-blur p-4 rounded-2xl flex items-center gap-4 shrink-0 relative">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-white/20"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-white transition-all duration-1000"
                strokeDasharray={`${overallProgressPct}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute text-xs font-black text-white">{overallProgressPct}%</div>
          </div>
          <div>
            <div className="text-xs font-bold text-white">SDLC Health</div>
            <div className="text-[11px] text-blue-100">{publishedArtifacts} / {totalArtifacts} Docs</div>
          </div>
        </div>
      </div>

      {/* SDLC LIFECYCLE ROADMAP */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <Layers className="w-4 h-4 text-blue-600" />
              </div>
              Lifecycle Roadmap
            </h2>
          </div>

          <button
            onClick={() => navigate(`/projects/${project?.id}`)}
            className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors self-start md:self-auto"
          >
            <span>Inspect Phase Gates</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {phases.map(p => {
            const isCurrent = p.id === currentPhase?.id;
            const isPast = p.status === 'Completed';

            return (
              <div
                key={p.id}
                onClick={() => {
                  if (p.status === 'Locked') {
                    const prevPhase = phases.find(ph => ph.sequence === p.sequence - 1) || currentPhase;
                    setLockedPhaseModal({
                      phase: p,
                      prevPhase
                    });
                    return;
                  }
                  navigate(`/projects/${project?.id}`);
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isCurrent
                    ? 'bg-blue-600 border-blue-600 shadow-md shadow-blue-600/20'
                    : isPast
                    ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-400'
                    : 'bg-slate-50 border-slate-200 opacity-70 hover:opacity-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className={isCurrent ? 'text-white' : isPast ? 'text-emerald-700' : 'text-slate-500'}>
                    {p.sequence}. {p.name}
                  </span>
                  {isPast ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : isCurrent ? (
                    <Clock className="w-4 h-4 text-blue-200" />
                  ) : (
                    <Lock className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                <div className={`mt-3 text-[10px] pt-2 border-t font-semibold ${
                  isCurrent ? 'border-white/20 text-blue-100' : isPast ? 'border-emerald-200 text-emerald-600' : 'border-slate-200 text-slate-400'
                }`}>
                  {isCurrent ? 'Active Phase' : isPast ? 'Gate Passed ✓' : 'Phase Locked'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM SECTION: GOVERNANCE ACTIONS & RECENT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Role-Tailored Governance Action Items */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-500" />
              Actions Required — {activeUser?.role || 'User'}
            </h2>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold">
              {(actionsNeeded || []).length} Pending
            </span>
          </div>

          <div className="space-y-3">
            {(actionsNeeded && actionsNeeded.length > 0) ? (
              actionsNeeded.map(act => (
                <div key={act.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4 hover:border-blue-200 hover:bg-blue-50/30 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-xs">{act.title}</span>
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-semibold border border-blue-200">{act.artifactType}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{act.reason}</p>
                  </div>
                  <button
                    onClick={() => navigate(act.linkUrl || '/approvals')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shrink-0 shadow-sm shadow-blue-600/20 transition-colors"
                  >
                    {act.actionLabel || 'Take Action'}
                  </button>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                No immediate pending governance actions.
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Live SDLC Audit Activity Feed */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Activity className="w-4 h-4 text-emerald-500" />
            Live Activity Feed
          </h2>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {auditLogs && auditLogs.length > 0 ? (
              auditLogs.slice(0, 5).map(log => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 hover:border-blue-200 transition-colors">
                  <div className="flex justify-between text-slate-700 font-bold">
                    <span>{log.user?.name || log.userId || 'System'}</span>
                    <span className="text-[10px] text-slate-400 font-normal">Recently</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{log.newState || log.action}</p>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                No activity logs recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Locked Phase Governance Alert Popup Modal */}
      {lockedPhaseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 text-slate-800 font-bold text-sm">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Lock className="w-4 h-4" />
                </div>
                <span>Phase Gate Locked: {lockedPhaseModal.phase.name}</span>
              </div>
              <button
                onClick={() => setLockedPhaseModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Sequential SDLC Phase Gate Rule</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-900">
                  This phase is <strong>locked</strong>. You must complete and verify all mandatory deliverables for <strong>Phase {lockedPhaseModal.prevPhase?.sequence || (lockedPhaseModal.phase.sequence - 1)}: {lockedPhaseModal.prevPhase?.name || 'Previous Phase'}</strong> before this phase unlocks.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-[11px]">
                <div className="flex justify-between items-center text-slate-500">
                  <span>Current Active Phase:</span>
                  <strong className="text-blue-700 font-bold">{currentPhase?.name} (P{currentPhase?.sequence})</strong>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Target Locked Phase:</span>
                  <strong className="text-slate-700 font-semibold">{lockedPhaseModal.phase.name} (P{lockedPhaseModal.phase.sequence})</strong>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setLockedPhaseModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setLockedPhaseModal(null);
                  navigate(`/projects/${project?.id}`);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                Go to Active Phase Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
