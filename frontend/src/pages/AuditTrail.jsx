import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import {
  History,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  FileCheck2,
  XCircle,
  MessageSquare,
  Search,
  FolderGit2
} from 'lucide-react';

export default function AuditTrail() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  useEffect(() => {
    fetchApi('/audit/logs')
      .then(data => {
        setLogs(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const getActionBadge = (action) => {
    switch (action) {
      case 'DOCUMENT_SUBMITTED':
        return {
          label: 'Submitted',
          color: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: UploadCloud
        };
      case 'REVIEW_APPROVED':
        return {
          label: 'Review Approved',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle2
        };
      case 'CHANGES_REQUESTED':
        return {
          label: 'Changes Requested',
          color: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: AlertTriangle
        };
      case 'EXECUTIVE_APPROVED':
        return {
          label: 'Executive Approved',
          color: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: FileCheck2
        };
      case 'EXECUTIVE_REJECTED':
        return {
          label: 'Rejected',
          color: 'bg-red-50 text-red-700 border-red-200',
          icon: XCircle
        };
      case 'DOCUMENT_RESUBMITTED':
        return {
          label: 'Revision Resubmitted',
          color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
          icon: UploadCloud
        };
      default:
        return {
          label: action?.replace(/_/g, ' ') || 'Audit Event',
          color: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: History
        };
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.userName && log.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.documentTitle && log.documentTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.userRole && log.userRole.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    return matchesSearch && matchesAction;
  });

  if (loading) return (
    <div className="p-8 text-center text-blue-500 text-xs animate-pulse">
      Loading SDLC Audit Logs...
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Top Header */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <History className="w-4 h-4 text-blue-600" />
            </div>
            Audit
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time chronological execution history tracking document uploads, reviews, signoffs, and change requests.
          </p>
        </div>

        <div className="px-3.5 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 font-semibold">
          Total Logs: <strong>{logs.length}</strong>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by user, role, document, or action..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-400 cursor-pointer w-full sm:w-auto"
          >
            <option value="ALL">All Actions</option>
            <option value="DOCUMENT_SUBMITTED">Uploads &amp; Submissions</option>
            <option value="REVIEW_APPROVED">Technical Reviews</option>
            <option value="CHANGES_REQUESTED">Changes Requested</option>
            <option value="EXECUTIVE_APPROVED">Executive Approvals</option>
            <option value="EXECUTIVE_REJECTED">Rejections</option>
            <option value="DOCUMENT_RESUBMITTED">Resubmissions</option>
          </select>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <History className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">No audit logs match your filter</p>
            <p className="text-xs text-slate-400">All uploads, signoffs, and change requests will be permanently logged here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => {
              const badge = getActionBadge(log.action);
              const BadgeIcon = badge.icon;
              const createdAtDate = log.createdAt ? new Date(log.createdAt) : new Date();

              return (
                <div
                  key={log.id}
                  className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 text-xs hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5 shadow-sm">
                      <BadgeIcon className="w-4 h-4" />
                    </div>

                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${badge.color}`}>
                          {badge.label}
                        </span>
                        {log.documentTitle && (
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-bold text-[11px] border border-slate-200">
                            {log.documentTitle}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">ID: {log.entityId}</span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {log.details || log.newState || 'Executed governance action.'}
                      </p>

                      {/* Rejection Reason Callout (if changes were requested or rejected) */}
                      {log.rejectionReason && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-800">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Reason for Rejection / Changes:</span>
                          </div>
                          <p className="text-xs text-amber-800 leading-relaxed pl-5 italic">
                            "{log.rejectionReason}"
                          </p>
                        </div>
                      )}

                      {/* Author Reply / Resubmission Note Callout */}
                      {log.responseNote && (
                        <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-900 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-[11px] text-cyan-800">
                            <MessageSquare className="w-3.5 h-3.5 text-cyan-600" />
                            <span>Author Response / Reply Note:</span>
                          </div>
                          <p className="text-xs text-cyan-800 leading-relaxed pl-5 italic">
                            "{log.responseNote}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timestamp & User Details Column */}
                  <div className="text-left md:text-right text-[11px] shrink-0 pl-12 md:pl-0 space-y-1">
                    <div className="font-bold text-slate-800 flex md:justify-end items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-500" />
                      <span>{log.userName || log.user?.name || 'System User'}</span>
                    </div>
                    <div className="text-[10px] text-blue-600 font-semibold">
                      {log.userRole || log.user?.role || 'Member'}
                    </div>
                    <div className="text-slate-400 flex md:justify-end items-center gap-1 text-[10px]">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{createdAtDate.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
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
