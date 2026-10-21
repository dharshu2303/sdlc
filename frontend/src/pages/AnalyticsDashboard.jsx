import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Layers,
  FileCheck2,
  Clock,
  CheckCircle2,
  FolderGit2,
  PieChart as PieIcon,
  BarChart3,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AnalyticsDashboard({ activeUser }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectsList, setProjectsList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchApi('/projects')
      .then(res => {
        const projs = res || [];
        setProjectsList(projs);
        if (projs.length > 0) {
          setSelectedProjectId(projs[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch(() => { setLoading(false); });
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    setLoading(true);
    fetchApi(`/dashboard/analytics/${selectedProjectId}`)
      .then(res => {
        setAnalytics(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedProjectId]);

  if (loading) return (
    <div className="p-8 text-center text-blue-500 text-xs animate-pulse">
      Loading SDLC Analytics & Charts...
    </div>
  );

  if (projectsList.length === 0 || !analytics) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="p-10 text-center space-y-4 max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto text-blue-600">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-800">No Analytics Available</h2>
          <p className="text-xs text-slate-500">Create a project to start tracking real-time SDLC governance analytics.</p>
          <button
            onClick={() => navigate('/projects/new')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            Create Project
          </button>
        </div>
      </div>
    );
  }

  const {
    projectName,
    projectCode,
    overallProgressPct,
    totalArtifacts,
    completedArtifacts,
    pendingArtifacts,
    activePhaseName,
    phaseMetrics = [],
    statusDistribution = [],
    roleWorkload = []
  } = analytics;

  const validStatusData = statusDistribution.filter(s => s.value > 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Project Switcher */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Project: <strong className="text-blue-600">{projectName}</strong> ({projectCode}) &bull; Active Phase: <strong className="text-slate-700">{activePhaseName}</strong>
          </p>
        </div>

        {projectsList.length > 1 && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">Project:</label>
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-400"
            >
              {projectsList.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <FolderGit2 className="w-3.5 h-3.5 text-blue-500" />
            <span>Total Deliverables</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-800">{totalArtifacts}</div>
          <div className="text-[11px] text-slate-400">Defined SDLC specifications</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Completed / Submitted</span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{completedArtifacts}</div>
          <div className="text-[11px] text-emerald-600 font-semibold">{overallProgressPct}% Completion Rate</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Pending Upload</span>
          </div>
          <div className="text-2xl font-extrabold text-amber-600">{pendingArtifacts}</div>
          <div className="text-[11px] text-slate-400">Action items across phases</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-500" />
            <span>Active Stage</span>
          </div>
          <div className="text-lg font-bold text-blue-600 truncate">{activePhaseName}</div>
          <div className="text-[11px] text-slate-400">Current governance gate</div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Phase Deliverable Progress Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              Deliverables Progress by Phase
            </h2>
            <span className="text-xs text-slate-400 font-semibold">{phaseMetrics.length} Phases</span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={phaseMetrics}
                margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="phaseName"
                  tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#64748B', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#FFF',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: '#FFF' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="submitted" name="Completed / Submitted" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={22} />
                <Bar dataKey="pending" name="Pending Upload" fill="#CBD5E1" radius={[4, 4, 0, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Deliverable Status Pie/Donut Chart */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-blue-600" />
              Status Breakdown
            </h2>
          </div>

          <div className="h-56 w-full relative flex items-center justify-center">
            {validStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={validStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {validStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      borderRadius: '12px',
                      color: '#FFF',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-slate-400">No data available</div>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-black text-slate-800">{totalArtifacts}</span>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Total</span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            {statusDistribution.map(item => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Role Workload & Contribution Breakdown */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            Role Deliverable Distribution
          </h2>
          <span className="text-xs text-slate-400 font-semibold">{roleWorkload.length} Roles</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {roleWorkload.map(rw => (
            <div key={rw.role} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800">{rw.role}</span>
                <span className="text-xs font-extrabold text-blue-600">{rw.total} Docs</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                <div
                  className="bg-blue-600 h-full transition-all"
                  style={{ width: `${rw.total > 0 ? (rw.completed / rw.total) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                <span className="text-emerald-600 font-semibold">{rw.completed} Done</span>
                <span className="text-slate-400">{rw.pending} Pending</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
