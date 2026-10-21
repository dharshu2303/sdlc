import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { hasPermission } from '../utils/rbac';
import { FileCheck2, CheckCircle2, XCircle, Lock, ArrowRight, User, ShieldCheck, Eye, Scale } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllDocumentTypes } from '../config/docRaci';

export default function ApprovalsPage({ activeUser }) {
  const [data, setData] = useState({ pendingReviews: [], pendingApprovals: [] });
  const [loading, setLoading] = useState(true);
  const [commentMap, setCommentMap] = useState({});
  const navigate = useNavigate();

  const loadData = () => {
    fetchApi(`/approvals/pending?userId=${activeUser?.id}`)
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => { loadData(); }, [activeUser]);

  const handleReviewAction = async (reviewerId, action) => {
    let comment = commentMap[reviewerId] || '';
    if (action === 'Changes Requested' && !comment.trim()) {
      const promptComment = window.prompt('Please enter the reason for requesting changes / rejection:');
      if (promptComment === null) return;
      if (!promptComment.trim()) {
        alert('A reason is required to request changes.');
        return;
      }
      comment = promptComment;
    }

    try {
      await fetchApi('/approvals/review', {
        method: 'POST',
        body: JSON.stringify({ reviewerId, action, comments: comment, userId: activeUser?.id })
      });
      alert(`Recorded: ${action}`);
      loadData();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleApproveAction = async (approverId, action) => {
    let comment = commentMap[approverId] || '';
    if (action === 'Rejected' && !comment.trim()) {
      const promptComment = window.prompt('Please enter the reason for rejecting signoff:');
      if (promptComment === null) return;
      if (!promptComment.trim()) {
        alert('A reason is required to reject.');
        return;
      }
      comment = promptComment;
    }

    try {
      await fetchApi('/approvals/approve', {
        method: 'POST',
        body: JSON.stringify({ approverId, action, comments: comment, userId: activeUser?.id })
      });
      alert(`Recorded: ${action}`);
      loadData();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) return (
    <div className="p-8 text-center text-blue-400 text-xs animate-pulse">
      Loading Pending Signoffs &amp; Reviews...
    </div>
  );

  const totalPending = data.pendingReviews.length + data.pendingApprovals.length;
  const allDocTypes = getAllDocumentTypes();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4 text-blue-600" />
            </div>
            Approvals &amp; Reviews
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Logged in: <strong className="text-blue-600">{activeUser.name} ({activeUser.role})</strong>
          </p>
        </div>

        <div className="px-3.5 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 font-semibold">
          Pending: <strong>{totalPending}</strong>
        </div>
      </div>

      {/* SECTION 1: TECHNICAL REVIEWS (Reviewers Sign Off First) */}
      {data.pendingReviews.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              1. Technical Reviews Required ({data.pendingReviews.length})
            </h2>
            <span className="text-[11px] text-blue-600 font-medium">Reviewers sign off technical accuracy first</span>
          </div>

          <div className="space-y-4">
            {data.pendingReviews.map(rev => {
              const art = rev.artifact;
              if (!art) return null;
              return (
                <div key={rev.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-800">{art.title}</span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold">{art.artifactType}</span>
                        <StatusBadge status={art.status} />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Phase: <strong className="text-slate-700">{art.phase?.name}</strong> &bull; Author: <strong className="text-slate-700">{art.owner?.name || 'Lead'}</strong>
                      </p>
                    </div>

                    <button
                      onClick={() => navigate(`/documents/${art.id}`)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start md:self-auto cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View File</span>
                    </button>
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-3">
                    <input
                      type="text"
                      placeholder="Technical review comment..."
                      value={commentMap[rev.id] || ''}
                      onChange={e => setCommentMap({ ...commentMap, [rev.id]: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-400"
                    />
                    <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                      <button
                        onClick={() => handleReviewAction(rev.id, 'Approved')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Sign Off Review</span>
                      </button>
                      <button
                        onClick={() => handleReviewAction(rev.id, 'Changes Requested')}
                        className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Request Changes</span>
                      </button>
                      <button
                        onClick={() => navigate('/disputes')}
                        className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Escalate review conflict to Dispute Center"
                      >
                        <Scale className="w-3.5 h-3.5 text-amber-600" />
                        <span>Dispute</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: EXECUTIVE SIGNOFF APPROVALS (Approvers Sign Off After Reviewers) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
            2. Executive Signoff Approvals ({data.pendingApprovals.length})
          </h2>
          <span className="text-[11px] text-slate-500 font-medium">Final approval after technical review</span>
        </div>

        {data.pendingApprovals.length === 0 ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No pending approvals assigned to your role.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.pendingApprovals.map(app => {
              const art = app.artifact;
              if (!art) return null;
              const isLockedByReviews = !app.allReviewsCompleted;

              return (
                <div key={app.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-800">{art.title}</span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold">{art.artifactType}</span>
                        <StatusBadge status={art.status} />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Phase: <strong className="text-slate-700">{art.phase?.name}</strong> &bull; Author: <strong className="text-slate-700">{art.owner?.name || 'Lead'}</strong>
                      </p>

                      {/* Review Status Dependency Tag */}
                      <div className="mt-2">
                        {isLockedByReviews ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold">
                            <Lock className="w-3 h-3 text-amber-600" />
                            Awaiting Technical Reviews ({app.approvedReviewsCount} / {app.reviewsCount} Completed)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Technical Reviews Completed &bull; Ready for Executive Signoff
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/documents/${art.id}`)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start md:self-auto cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View File</span>
                    </button>
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-3">
                    <input
                      type="text"
                      placeholder="Signoff comment / approval notes..."
                      value={commentMap[app.id] || ''}
                      onChange={e => setCommentMap({ ...commentMap, [app.id]: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-400"
                    />
                    <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                      <button
                        onClick={() => handleApproveAction(app.id, 'Approved')}
                        disabled={isLockedByReviews}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-colors cursor-pointer ${
                          isLockedByReviews
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isLockedByReviews ? 'Awaiting Reviews' : 'Grant Approval'}</span>
                      </button>
                      <button
                        onClick={() => handleApproveAction(app.id, 'Rejected')}
                        className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => navigate('/disputes')}
                        className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Escalate approval deadlock to Dispute Center"
                      >
                        <Scale className="w-3.5 h-3.5 text-amber-600" />
                        <span>Dispute</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
