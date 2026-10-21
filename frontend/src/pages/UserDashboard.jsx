import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { CheckSquare, FileText, ArrowRight, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UserDashboard({ activeUser }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchApi(`/dashboard/user-work?userId=${activeUser?.id || 'usr-admin-01'}`)
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [activeUser]);

  if (loading) return (
    <div className="p-8 text-center text-blue-400 text-xs animate-pulse">
      Loading Personalized SDLC Work Items...
    </div>
  );

  const currentUser = activeUser || { name: 'Administrator', role: 'System Admin' };
  const { nextActions = [], ownedArtifacts = [] } = data || {};

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            Welcome, <span className="text-blue-600">{currentUser.name}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Role: <strong className="text-blue-600">{currentUser.role}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 font-semibold">
          <Clock className="w-4 h-4 text-amber-500" />
          <span><strong>{nextActions.length}</strong> Pending Action(s)</span>
        </div>
      </div>

      {/* Recommended Next Action Callout */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 rounded-2xl shadow-md">
        <div className="flex items-center gap-2 text-blue-100 text-xs font-bold uppercase tracking-wider mb-2">
          <ShieldCheck className="w-4 h-4 text-white" />
          <span>Next Action</span>
        </div>

        {nextActions.length > 0 ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white">{nextActions[0].title}</h2>
              <p className="text-xs text-blue-100 mt-0.5">{nextActions[0].description}</p>
            </div>
            <button
              onClick={() => navigate(nextActions[0].linkUrl)}
              className="px-5 py-2 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <span>{nextActions[0].actionLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <p className="text-xs text-emerald-200 font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            All documentation tasks are up to date!
          </p>
        )}
      </div>

      {/* Grid of Actionable Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Actions List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-blue-500" />
            Pending Actions ({nextActions.length})
          </h2>

          <div className="space-y-3">
            {nextActions.length > 0 ? (
              nextActions.map(action => (
                <div
                  key={action.id}
                  className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{action.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        action.priority === 'High'
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : 'bg-amber-50 text-amber-600 border-amber-200'
                      }`}>
                        {action.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{action.description}</p>
                  </div>

                  <button
                    onClick={() => navigate(action.linkUrl)}
                    className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer"
                  >
                    {action.actionLabel}
                  </button>
                </div>
              ))
            ) : (
              <div className="p-8 rounded-xl bg-white border border-slate-200 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                No pending actions.
              </div>
            )}
          </div>
        </div>

        {/* Owned Artifacts & Status Summary */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            My Artifacts ({ownedArtifacts?.length || 0})
          </h2>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
            {ownedArtifacts && ownedArtifacts.length > 0 ? (
              ownedArtifacts.map(art => (
                <div
                  key={art.id}
                  onClick={() => navigate(`/documents/${art.id}`)}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span className="truncate pr-2">{art.title}</span>
                    <StatusBadge status={art.status} />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                    <span>{art.artifactType} &bull; v{art.currentVersion}</span>
                    <span>{art.phase?.name || 'Design'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                No artifacts assigned yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
