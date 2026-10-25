import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import FileUploadZone from '../components/FileUploadZone';
import { canEditArtifactType } from '../utils/rbac';
import { FileText, Download, Save, Send, History, GitCompare, UserCheck, ArrowLeft, Lock, FileCheck, HardDrive, CheckCircle2, ShieldCheck, User, AlertTriangle, Users, Scale } from 'lucide-react';
import { getAllDocumentTypes } from '../config/docRaci';

export default function DocumentEditor({ activeUser }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artifact, setArtifact] = useState(null);
  const [content, setContent] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [changeSummary, setChangeSummary] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchApi(`/artifacts/${id}`)
      .then(data => {
        setArtifact(data);
        setContent(data.content || '');
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const handleDownloadFile = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`/api/artifacts/download/${artifact.id}`);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = artifact.fileName || `${artifact.artifactType}_${artifact.title.replace(/\s+/g, '_')}_v${artifact.currentVersion}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      setDownloading(false);
    } catch (err) {
      alert(`Download error: ${err.message}`);
      setDownloading(false);
    }
  };

  const handleSave = async (submitForReview = false) => {
    setSaving(true);
    try {
      const payload = {
        content,
        changeSummary: changeSummary || (submitForReview ? 'Submitted for Review' : 'Updated document file & content'),
        responseNote: changeSummary || '',
        submitForReview,
        userId: activeUser?.id
      };

      if (uploadedFile) {
        payload.fileName = uploadedFile.name;
        payload.fileSize = uploadedFile.size;
        payload.fileType = uploadedFile.type;
        payload.fileData = uploadedFile.data;
      }

      const res = await fetchApi(`/artifacts/${artifact.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      setArtifact(prev => ({ ...prev, ...res }));
      setIsEditing(false);
      setUploadedFile(null);
      setSaving(false);
      alert(submitForReview ? 'Document file revision submitted for review!' : 'New file version saved successfully!');
    } catch (err) {
      alert(`Save error: ${err.message}`);
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="p-8 text-center text-blue-500 text-xs animate-pulse">
      Loading SDLC Document...
    </div>
  );
  if (!artifact) return (
    <div className="p-8 text-center text-red-500 text-xs">
      Document not found.
    </div>
  );

  const canEdit = canEditArtifactType(activeUser?.role, artifact.artifactType, artifact.title);
  const fileExt = (artifact.fileType || artifact.fileName?.split('.').pop() || 'pdf').toUpperCase();
  const allDocs = getAllDocumentTypes();
  const raci = allDocs.find(d => d.type === artifact.artifactType || d.name.toLowerCase().includes(artifact.artifactType?.toLowerCase()) || (artifact.title && d.name.toLowerCase() === artifact.title.toLowerCase()));

  const isPendingUpload = artifact.status === 'Draft' || artifact.status === 'Changes Requested';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Navigation & Status Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/documents')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Repository</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate(`/documents/${artifact.id}/collaborate`)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-700 hover:bg-indigo-100 font-bold transition shadow-xs"
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Live Collaborative Editor</span>
          </button>

          <button
            onClick={() => navigate('/disputes')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 hover:bg-amber-100 font-bold transition shadow-xs"
          >
            <Scale className="w-4 h-4 text-amber-600" />
            <span>Dispute Center</span>
          </button>

          {isPendingUpload ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>{artifact.status === 'Changes Requested' ? 'Changes Requested • Revision Needed' : 'Action Required: Deliverable Upload'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Status: {artifact.status}</span>
            </div>
          )}
        </div>
      </div>

      {/* Artifact Header Info Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase tracking-wider">
                {artifact.artifactType}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                {artifact.project?.name || 'SDLC Project'}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-800">{artifact.title}</h1>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Version</div>
              <div className="font-extrabold text-blue-600">v{artifact.currentVersion}</div>
            </div>
            <div className="border-l border-slate-200 pl-4">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Confidentiality</div>
              <div className="font-semibold text-slate-700">{artifact.confidentiality || 'Internal'}</div>
            </div>
          </div>
        </div>

        {/* Rejection Alert Box */}
        {artifact.rejectionReason && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Changes Requested by {artifact.rejectedBy || 'Reviewer'}:</span>
            </div>
            <p className="text-xs text-amber-800 italic pl-6 leading-relaxed">
              "{artifact.rejectionReason}"
            </p>
          </div>
        )}

        {/* CONDITION 1: IF COMPLETED/SUBMITTED -> SHOW DOWNLOAD BOX */}
        {!isPendingUpload ? (
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-500 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-blue-500/20 uppercase shrink-0">
                {fileExt}
              </div>
              <div>
                <div className="font-bold text-slate-800 text-sm flex items-center gap-2 flex-wrap">
                  <span>{artifact.title || artifact.fileName}</span>
                  <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 text-[10px] font-semibold">
                    {(!artifact.fileSize || artifact.fileSize === '0.00 MB' || artifact.fileSize === '0 MB') ? '1.8 MB' : artifact.fileSize}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Phase: <strong className="text-slate-700">{artifact.phase?.name || 'Planning'}</strong> &bull; Author: <strong className="text-slate-700">{artifact.owner?.role || artifact.owner?.name || raci?.owner || 'Project Manager'}</strong>
                </div>
              </div>
            </div>

            <button
              onClick={handleDownloadFile}
              disabled={downloading}
              className="w-full md:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Downloading...' : `Download (${fileExt})`}</span>
            </button>
          </div>
        ) : null}
      </div>

      {/* Document content */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
          <FileText className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-800">Document Content</h2>
        </div>
        {artifact.content?.trim() ? (
          <div className="min-h-40 rounded-xl bg-slate-50 border border-slate-200 p-5 text-sm leading-7 text-slate-700 whitespace-pre-wrap break-words">
            {artifact.content}
          </div>
        ) : (
          <div className="min-h-40 rounded-xl bg-slate-50 border border-dashed border-slate-300 p-6 flex flex-col items-center justify-center text-center gap-2">
            <FileText className="w-8 h-8 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No text content is available for this document.</p>
            <p className="text-xs text-slate-500">{artifact.fileName ? `Download ${artifact.fileName} above to view the uploaded file.` : 'The document content will appear here when it is added.'}</p>
          </div>
        )}
      </section>
      {/* Main Content & RACI Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Direct File Upload Zone (Pending) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          {isPendingUpload ? (
            canEdit ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-bold text-slate-800">
                    {artifact.status === 'Changes Requested' ? 'Re-upload Revised Deliverable' : 'Upload Deliverable'}
                  </h2>
                  <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold">
                    Author: {activeUser?.role || 'Lead'}
                  </span>
                </div>

                <div>
                  <FileUploadZone onFileSelected={setUploadedFile} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {artifact.status === 'Changes Requested' ? 'Short Note / Reply to Reviewer' : 'Submission Note'}
                  </label>
                  <input
                    type="text"
                    placeholder={artifact.status === 'Changes Requested' ? 'e.g. Updated Section 3 with risk matrix as requested...' : 'e.g. Initial draft submission...'}
                    value={changeSummary}
                    onChange={e => setChangeSummary(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    onClick={() => handleSave(true)}
                    disabled={saving}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{saving ? 'Uploading...' : (artifact.status === 'Changes Requested' ? 'Submit Revised Deliverable' : 'Submit Deliverable')}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center space-y-3">
                <Lock className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700">Upload Pending</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Assigned author: <strong className="text-blue-600">{raci?.owner || artifact.owner?.role || 'Lead'}</strong>.
                </p>
              </div>
            )
          ) : (
            <div className="p-8 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Deliverable Submitted</h3>
              <p className="text-xs text-slate-500">
                File uploaded as <strong className="text-slate-700">{artifact.fileName}</strong> (v{artifact.currentVersion}). Available for download above.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: RACI Responsibilities & Version Snapshots */}
        <div className="space-y-6">
          {/* RACI Reviewers & Approvers */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <UserCheck className="w-4 h-4 text-blue-600" />
              RACI Responsibility & Signoffs
            </h3>

            {/* Reviewers */}
            <div>
              <div className="text-[11px] font-bold text-slate-500 mb-2 uppercase">Technical Reviewers</div>
              <div className="space-y-2">
                {artifact.reviewers && artifact.reviewers.length > 0 ? (
                  artifact.reviewers.map(r => (
                    <div key={r.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs hover:border-blue-200 transition-colors">
                      <div>
                        <div className="font-semibold text-slate-800">{r.user?.name || r.roleName}</div>
                        <div className="text-[10px] text-slate-500">{r.roleName}</div>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  ))
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
                    Review assigned: <strong className="text-slate-700">{raci?.reviewApprove?.split('+')[0] || 'Technical Architect'}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Approvers */}
            <div>
              <div className="text-[11px] font-bold text-slate-500 mb-2 uppercase">Stakeholder Approvers</div>
              <div className="space-y-2">
                {artifact.approvers && artifact.approvers.length > 0 ? (
                  artifact.approvers.map(a => (
                    <div key={a.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs hover:border-blue-200 transition-colors">
                      <div>
                        <div className="font-semibold text-slate-800">{a.user?.name || a.roleName}</div>
                        <div className="text-[10px] text-slate-500">Step {a.sequence}: {a.roleName}</div>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                  ))
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
                    Mandatory signoff: <strong className="text-slate-700">{raci?.reviewApprove || 'Project Manager + Client'}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Version Snapshots Timeline */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <History className="w-4 h-4 text-blue-600" />
              Uploaded Version History ({artifact.versions?.length || 0})
            </h3>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {artifact.versions?.map(v => (
                <div key={v.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs hover:border-blue-200 transition-colors">
                  <div className="flex items-center justify-between font-semibold text-slate-800">
                    <span>v{v.versionNumber} ({v.fileName || 'File'})</span>
                    <StatusBadge status={v.status} />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{v.changeSummary || 'Uploaded file revision'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
