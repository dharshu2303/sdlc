import React, { useState, useEffect } from 'react';
import {
  Scale,
  AlertTriangle,
  Gavel,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  ArrowUpRight,
  ShieldAlert,
  FileText,
  User,
  Share2,
  Sparkles,
  ChevronRight,
  TrendingUp,
  X
} from 'lucide-react';
import {
  fetchDisputes,
  fetchDisputeAnalytics,
  fetchDisputeDetail,
  createDispute,
  addDisputeComment,
  castDisputeVote,
  resolveDispute,
  escalateDispute,
  fetchApi
} from '../services/api';

const DISPUTE_TYPES = [
  { value: 'REQUIREMENT_CONFLICT', label: 'Requirement Conflict', desc: 'Contradictory business rules or scope clashes' },
  { value: 'DESIGN_TRADEOFF', label: 'Design Trade-Off', desc: 'Architecture, DB partitioning, or scalability disagreements' },
  { value: 'APPROVAL_DEADLOCK', label: 'Approval Deadlock', desc: 'Reviewer or approver signoff stalemate' },
  { value: 'SCOPE_CREEP', label: 'Scope Creep', desc: 'Unapproved feature additions beyond project charter' },
  { value: 'PRIORITY_CONFLICT', label: 'Priority Conflict', desc: 'Sprint sequencing and deliverable urgency clashes' },
  { value: 'VERSION_CONFLICT', label: 'Version Conflict', desc: 'Conflicting simultaneous document edits or fork' },
  { value: 'QUALITY_STANDARD', label: 'Quality Standard', desc: 'QA acceptance criteria vs dev readiness dispute' }
];

const STATUS_COLORS = {
  Open: 'bg-amber-50 text-amber-700 border-amber-200',
  'Under Discussion': 'bg-blue-50 text-blue-700 border-blue-200',
  Voting: 'bg-purple-50 text-purple-700 border-purple-200',
  Mediation: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Escalated: 'bg-rose-50 text-rose-700 border-rose-200',
  Closed: 'bg-slate-50 text-slate-600 border-slate-200'
};

const PRIORITY_BADGES = {
  Critical: 'bg-red-500 text-white',
  High: 'bg-orange-500 text-white',
  Medium: 'bg-amber-400 text-slate-900',
  Low: 'bg-slate-300 text-slate-800'
};

export default function DisputeCenter({ activeUser }) {
  const [disputes, setDisputes] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('board'); // 'board' | 'analytics'

  // Selected dispute detail drawer
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isProposal, setIsProposal] = useState(false);
  const [voteReason, setVoteReason] = useState('');
  const [resolutionText, setResolutionText] = useState('');
  const [showResolutionForm, setShowResolutionForm] = useState(false);

  // Modal: Raise new dispute
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projects, setProjects] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [newDisputeData, setNewDisputeData] = useState({
    projectId: '',
    artifactId: '',
    title: '',
    description: '',
    disputeType: 'DESIGN_TRADEOFF',
    priority: 'High'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [disputesRes, analyticsRes, projsRes, artsRes] = await Promise.all([
        fetchDisputes({
          status: filterStatus !== 'All' ? filterStatus : undefined,
          disputeType: filterType !== 'All' ? filterType : undefined,
          priority: filterPriority !== 'All' ? filterPriority : undefined,
          search: search || undefined
        }),
        fetchDisputeAnalytics().catch(() => null),
        fetchApi('/projects').catch(() => []),
        fetchApi('/artifacts').catch(() => [])
      ]);

      setDisputes(Array.isArray(disputesRes) ? disputesRes : []);
      setAnalytics(analyticsRes);
      setProjects(Array.isArray(projsRes) ? projsRes : []);
      setArtifacts(Array.isArray(artsRes) ? artsRes : []);
    } catch (err) {
      console.error('Failed to load disputes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterStatus, filterType, filterPriority, search]);

  const openDetail = async (disputeId) => {
    try {
      setDetailLoading(true);
      const detail = await fetchDisputeDetail(disputeId);
      setSelectedDispute(detail);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedDispute) return;
    try {
      await addDisputeComment(selectedDispute.id, {
        content: newComment,
        isResolutionProposal: isProposal
      });
      setNewComment('');
      setIsProposal(false);
      openDetail(selectedDispute.id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleVote = async (voteType) => {
    if (!selectedDispute) return;
    try {
      await castDisputeVote(selectedDispute.id, {
        vote: voteType,
        reason: voteReason
      });
      setVoteReason('');
      openDetail(selectedDispute.id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResolve = async () => {
    if (!resolutionText.trim() || !selectedDispute) return;
    try {
      await resolveDispute(selectedDispute.id, { resolution: resolutionText });
      setShowResolutionForm(false);
      setResolutionText('');
      openDetail(selectedDispute.id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEscalate = async () => {
    if (!selectedDispute) return;
    const reason = prompt('Please enter the escalation rationale for the Steering Committee / Client:');
    if (!reason) return;
    try {
      await escalateDispute(selectedDispute.id, { reason });
      openDetail(selectedDispute.id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateDispute = async (e) => {
    e.preventDefault();
    try {
      await createDispute(newDisputeData);
      setShowCreateModal(false);
      setNewDisputeData({
        projectId: projects[0]?.id || '',
        artifactId: '',
        title: '',
        description: '',
        disputeType: 'DESIGN_TRADEOFF',
        priority: 'High'
      });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <Scale className="w-3.5 h-3.5" />
              SDLC Governance Engine
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Documentation Dispute Resolution Center</h1>
            <p className="text-indigo-200/80 text-sm mt-1 max-w-2xl">
              End-to-end consensus engine for requirements conflicts, architectural design trade-offs, approval deadlocks, and scope drift.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (projects.length > 0 && !newDisputeData.projectId) {
                  setNewDisputeData(prev => ({ ...prev, projectId: projects[0].id }));
                }
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium text-sm transition shadow-lg shadow-indigo-500/25"
            >
              <Plus className="w-4 h-4" />
              Raise SDLC Dispute
            </button>
          </div>
        </div>

        {/* Analytics Snapshot Bar */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-indigo-900/50">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-xs text-indigo-200/70 font-medium">Total Disputes Logged</div>
              <div className="text-2xl font-bold text-white mt-1">{analytics.totalDisputes}</div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" /> Fully Audited
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-xs text-indigo-200/70 font-medium">Active in Consensus</div>
              <div className="text-2xl font-bold text-amber-300 mt-1">{analytics.activeDisputes}</div>
              <div className="text-[11px] text-amber-200/70 mt-1">Under voting or mediation</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-xs text-indigo-200/70 font-medium">Resolved Disputes</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{analytics.resolvedDisputes}</div>
              <div className="text-[11px] text-emerald-200/70 mt-1">Formal binding signoffs</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-xs text-indigo-200/70 font-medium">Avg Resolution Cycle</div>
              <div className="text-2xl font-bold text-indigo-300 mt-1">{analytics.avgResolutionDays} days</div>
              <div className="text-[11px] text-indigo-200/70 mt-1">Throughput turnaround</div>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search disputes by title, deliverable, or topic..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Under Discussion">Under Discussion</option>
            <option value="Voting">Voting Active</option>
            <option value="Mediation">Mediation</option>
            <option value="Resolved">Resolved</option>
            <option value="Escalated">Escalated</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="All">All Conflict Categories</option>
            {DISPUTE_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="All">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          Showing <span className="text-slate-800 font-semibold">{disputes.length}</span> disputes
        </div>
      </div>

      {/* Disputes Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading SDLC disputes...</div>
      ) : disputes.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
          <Scale className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No disputes found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            All SDLC documentation processes are currently aligned without active deadlocks.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {disputes.map((d) => {
            const typeInfo = DISPUTE_TYPES.find(t => t.value === d.disputeType) || { label: d.disputeType };
            return (
              <div
                key={d.id}
                onClick={() => openDetail(d.id)}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_BADGES[d.priority] || 'bg-slate-200 text-slate-700'}`}>
                      {d.priority} Priority
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${STATUS_COLORS[d.status] || 'bg-slate-50 text-slate-600'}`}>
                      {d.status}
                    </span>
                  </div>

                  <div className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider mb-1">
                    {typeInfo.label}
                  </div>

                  <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition line-clamp-2">
                    {d.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                    {d.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 font-medium truncate max-w-[180px]">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{d.artifactTitle}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'Recent'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-2">
                      <img
                        src={d.raisedBy?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${d.raisedBy?.name || 'User'}`}
                        alt=""
                        className="w-5 h-5 rounded-full"
                      />
                      <span className="text-slate-600 text-[11px]">{d.raisedBy?.name || 'Contributor'}</span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-400 text-xs">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {d.commentsCount || 0}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 group-hover:text-indigo-600 transition" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Slide-over Dispute Detail Drawer */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_BADGES[selectedDispute.priority]}`}>
                    {selectedDispute.priority}
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${STATUS_COLORS[selectedDispute.status]}`}>
                    {selectedDispute.status}
                  </span>
                  <span className="text-xs text-slate-500">
                    ID: {selectedDispute.id}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 leading-snug">
                  {selectedDispute.title}
                </h2>
                <div className="text-xs text-indigo-600 font-semibold mt-1">
                  Category: {selectedDispute.disputeType}
                </div>
              </div>

              <button
                onClick={() => setSelectedDispute(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Linked Artifact Pill */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span className="font-semibold text-slate-800">Target Deliverable:</span>
                  <span className="text-slate-600">{selectedDispute.artifactTitle}</span>
                </div>
                <span className="text-xs text-slate-500 font-medium">Project: {selectedDispute.projectName}</span>
              </div>

              {/* Dispute Description */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Conflict Statement</h4>
                <div className="text-sm text-slate-700 bg-slate-50/50 p-4 rounded-xl border border-slate-200 leading-relaxed whitespace-pre-wrap">
                  {selectedDispute.description}
                </div>
              </div>

              {/* If Resolved: Show Resolution Banner */}
              {selectedDispute.status === 'Resolved' && selectedDispute.resolution && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Formal Binding Resolution Enacted
                  </div>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    {selectedDispute.resolution}
                  </p>
                  <div className="text-[11px] text-emerald-600 pt-1">
                    Resolved at: {new Date(selectedDispute.resolvedAt).toLocaleString()}
                  </div>
                </div>
              )}

              {/* Consensus Voting Section */}
              <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gavel className="w-4 h-4 text-purple-700" />
                    <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">Stakeholder Consensus Balloting</span>
                  </div>
                  <span className="text-xs text-purple-700 font-medium">
                    {(selectedDispute.votes || []).length} votes cast
                  </span>
                </div>

                {/* Vote Tally Bar */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white p-2.5 rounded-lg border border-purple-100 text-center">
                    <div className="text-[11px] font-semibold text-emerald-600 flex items-center justify-center gap-1">
                      <ThumbsUp className="w-3 h-3" /> Agree
                    </div>
                    <div className="text-lg font-bold text-slate-800 mt-0.5">
                      {selectedDispute.voteSummary?.agree || 0}
                    </div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-purple-100 text-center">
                    <div className="text-[11px] font-semibold text-rose-600 flex items-center justify-center gap-1">
                      <ThumbsDown className="w-3 h-3" /> Disagree
                    </div>
                    <div className="text-lg font-bold text-slate-800 mt-0.5">
                      {selectedDispute.voteSummary?.disagree || 0}
                    </div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-purple-100 text-center">
                    <div className="text-[11px] font-semibold text-slate-600">Abstain</div>
                    <div className="text-lg font-bold text-slate-800 mt-0.5">
                      {selectedDispute.voteSummary?.abstain || 0}
                    </div>
                  </div>
                </div>

                {/* Voting Actions */}
                {selectedDispute.status !== 'Resolved' && selectedDispute.status !== 'Closed' && (
                  <div className="pt-2 border-t border-purple-200/50 flex items-center gap-2">
                    <button
                      onClick={() => handleVote('agree')}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition flex items-center justify-center gap-1.5"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" /> Agree
                    </button>
                    <button
                      onClick={() => handleVote('disagree')}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition flex items-center justify-center gap-1.5"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" /> Disagree
                    </button>
                    <button
                      onClick={() => handleVote('abstain')}
                      className="py-1.5 px-3 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-xs transition"
                    >
                      Abstain
                    </button>
                  </div>
                )}
              </div>

              {/* Discussion Thread */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Deliberation Discussion & Proposals ({(selectedDispute.comments || []).length})
                </h4>

                <div className="space-y-3">
                  {(selectedDispute.comments || []).length === 0 ? (
                    <div className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-lg text-center">
                      No deliberation comments yet. Be the first to propose a resolution.
                    </div>
                  ) : (
                    selectedDispute.comments.map(c => (
                      <div
                        key={c.id}
                        className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                          c.isResolutionProposal
                            ? 'bg-amber-50/70 border-amber-200'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{c.user?.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">({c.user?.role})</span>
                            {c.isResolutionProposal && (
                              <span className="text-[10px] bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded">
                                Proposed Resolution
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment / Propose Resolution Input */}
                <form onSubmit={handleAddComment} className="pt-2 space-y-2">
                  <textarea
                    rows={3}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Contribute your perspective or formulate a compromise proposal..."
                    className="w-full p-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isProposal}
                        onChange={(e) => setIsProposal(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-medium">Mark as formal resolution proposal</span>
                    </label>

                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-xs transition"
                    >
                      Post Argument
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {selectedDispute.status !== 'Resolved' && selectedDispute.status !== 'Closed' && (
                  <>
                    <button
                      onClick={handleEscalate}
                      className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition"
                    >
                      Escalate to Steering Committee
                    </button>

                    <button
                      onClick={() => setShowResolutionForm(!showResolutionForm)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
                    >
                      Enact Formal Resolution
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => setSelectedDispute(null)}
                className="px-4 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 text-xs font-medium"
              >
                Close
              </button>
            </div>

            {/* Resolution Form Modal Drawer */}
            {showResolutionForm && (
              <div className="p-4 bg-emerald-50/90 border-t border-emerald-300 space-y-3">
                <h5 className="text-xs font-bold text-emerald-900">Enact Binding Resolution</h5>
                <textarea
                  rows={3}
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  placeholder="Summarize the definitive architectural / business decision that closes this dispute..."
                  className="w-full p-2.5 rounded-lg border border-emerald-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowResolutionForm(false)}
                    className="px-3 py-1 text-xs text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResolve}
                    className="px-4 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition"
                  >
                    Confirm Binding Signoff
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Raise New SDLC Dispute */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-indigo-600">
                <Scale className="w-5 h-5" />
                <h3 className="font-bold text-slate-900">Raise SDLC Documentation Dispute</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDispute} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Project</label>
                <select
                  value={newDisputeData.projectId}
                  onChange={(e) => setNewDisputeData({ ...newDisputeData, projectId: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Deliverable (Optional)</label>
                <select
                  value={newDisputeData.artifactId}
                  onChange={(e) => setNewDisputeData({ ...newDisputeData, artifactId: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs"
                >
                  <option value="">-- All Deliverables / General Process --</option>
                  {artifacts.map(a => (
                    <option key={a.id} value={a.id}>{a.title} ({a.artifactType})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dispute Category</label>
                  <select
                    value={newDisputeData.disputeType}
                    onChange={(e) => setNewDisputeData({ ...newDisputeData, disputeType: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs"
                  >
                    {DISPUTE_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newDisputeData.priority}
                    onChange={(e) => setNewDisputeData({ ...newDisputeData, priority: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs"
                  >
                    <option value="Critical">Critical (Blocks Phase)</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dispute Subject / Headline</label>
                <input
                  type="text"
                  required
                  value={newDisputeData.title}
                  onChange={(e) => setNewDisputeData({ ...newDisputeData, title: e.target.value })}
                  placeholder="e.g. Distributed SQL vs PostgreSQL Hash Partitioning SLA clash"
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Conflict Statement</label>
                <textarea
                  rows={4}
                  required
                  value={newDisputeData.description}
                  onChange={(e) => setNewDisputeData({ ...newDisputeData, description: e.target.value })}
                  placeholder="Explain the contradictory requirements, architecture trade-offs, or deadlocked opinions..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition shadow-md"
                >
                  Open Dispute Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
