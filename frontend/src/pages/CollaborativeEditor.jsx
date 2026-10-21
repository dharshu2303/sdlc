import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Users,
  Save,
  MessageSquare,
  Sparkles,
  GitCommit,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit3,
  History,
  Scale,
  ArrowLeft,
  Send,
  Check,
  X,
  Share2,
  CornerDownRight
} from 'lucide-react';
import {
  fetchApi,
  joinCollaboration,
  heartbeatCollaboration,
  leaveCollaboration,
  saveCollaborativeDoc,
  fetchDocComments,
  addDocComment,
  resolveDocComment,
  fetchDocSuggestions,
  addDocSuggestion,
  reviewDocSuggestion
} from '../services/api';

export default function CollaborativeEditor({ activeUser }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [artifact, setArtifact] = useState(null);
  const [content, setContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [baseVersion, setBaseVersion] = useState('1.0');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [conflictError, setConflictError] = useState(null);

  // Presence & Peers
  const [activePeers, setActivePeers] = useState([]);
  const [myColor, setMyColor] = useState('#3B82F6');

  // Sidebar Tabs: 'comments' | 'suggestions' | 'versions'
  const [activeSideTab, setActiveSideTab] = useState('comments');
  const [comments, setComments] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [newSuggestionText, setNewSuggestionText] = useState('');
  const [selectedText, setSelectedText] = useState('');

  // Mode: 'split' | 'edit' | 'preview'
  const [viewMode, setViewMode] = useState('split');
  const textareaRef = useRef(null);

  // Load document and register presence
  useEffect(() => {
    let heartbeatTimer = null;

    const init = async () => {
      try {
        setLoading(true);
        const art = await fetchApi(`/artifacts/${id}`);
        setArtifact(art);
        setContent(art.content || '');
        setSavedContent(art.content || '');
        setBaseVersion(art.currentVersion || '1.0');

        // Join collaborative session
        const joinRes = await joinCollaboration(id).catch(() => ({}));
        if (joinRes.activePeers) setActivePeers(joinRes.activePeers);
        if (joinRes.session?.color) setMyColor(joinRes.session.color);

        // Load comments & suggestions
        const [cList, sList] = await Promise.all([
          fetchDocComments(id).catch(() => []),
          fetchDocSuggestions(id).catch(() => [])
        ]);
        setComments(Array.isArray(cList) ? cList : []);
        setSuggestions(Array.isArray(sList) ? sList : []);

        // Start heartbeat every 10 seconds
        heartbeatTimer = setInterval(async () => {
          try {
            const pos = textareaRef.current
              ? { line: 1, ch: textareaRef.current.selectionStart || 0 }
              : { line: 1, ch: 0 };
            const hb = await heartbeatCollaboration(id, pos);
            if (hb.activePeers) setActivePeers(hb.activePeers);
          } catch (e) {}
        }, 10000);
      } catch (err) {
        console.error('Init error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) init();

    return () => {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      leaveCollaboration(id).catch(() => {});
    };
  }, [id]);

  // Handle Save
  const handleSave = async (isMajor = false) => {
    try {
      setSaving(true);
      setConflictError(null);
      const res = await saveCollaborativeDoc(id, {
        content,
        baseVersion,
        isMajorVersion: isMajor,
        changeSummary: isMajor ? 'Major deliverable milestone release' : 'Collaborative live editing update'
      });

      if (res.conflict) {
        setConflictError(res.message);
        return;
      }

      setSavedContent(content);
      if (res.newVersion) {
        setBaseVersion(res.newVersion);
        if (artifact) setArtifact({ ...artifact, currentVersion: res.newVersion });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      if (err.message?.includes('conflict') || err.message?.includes('409')) {
        setConflictError('Version Conflict Detected: Another collaborator updated this deliverable.');
      } else {
        alert(err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  // Add Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    try {
      const added = await addDocComment({
        artifactId: id,
        content: newCommentText,
        positionStart: textareaRef.current?.selectionStart || 0,
        positionEnd: textareaRef.current?.selectionEnd || 0
      });
      setComments([...comments, added]);
      setNewCommentText('');
    } catch (err) {
      alert(err.message);
    }
  };

  // Resolve Comment
  const handleResolveComment = async (commentId) => {
    try {
      await resolveDocComment(commentId);
      setComments(comments.map(c => c.id === commentId ? { ...c, isResolved: true } : c));
    } catch (err) {
      alert(err.message);
    }
  };

  // Propose Suggestion
  const handleAddSuggestion = async (e) => {
    e.preventDefault();
    if (!newSuggestionText.trim()) return;
    try {
      const added = await addDocSuggestion({
        artifactId: id,
        originalText: selectedText || '',
        suggestedText: newSuggestionText,
        positionStart: textareaRef.current?.selectionStart || 0,
        positionEnd: textareaRef.current?.selectionEnd || 0
      });
      setSuggestions([...suggestions, added]);
      setNewSuggestionText('');
      setSelectedText('');
    } catch (err) {
      alert(err.message);
    }
  };

  // Accept / Reject Suggestion
  const handleReviewSuggestion = async (sugId, status) => {
    try {
      await reviewDocSuggestion(sugId, status);
      setSuggestions(suggestions.map(s => s.id === sugId ? { ...s, status } : s));
      if (status === 'accepted') {
        // Refresh deliverable content
        const art = await fetchApi(`/artifacts/${id}`);
        setContent(art.content || '');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center text-slate-400">
        Initializing collaborative workspace...
      </div>
    );
  }

  const isDirty = content !== savedContent;

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden font-sans">
      {/* Top Navigation & Presence Bar */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4 shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => navigate('/documents')}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 truncate">
                {artifact?.title || 'Deliverable Specification'}
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold">
                v{artifact?.currentVersion || baseVersion}
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>{artifact?.artifactType}</span>
              <span>•</span>
              <span>{artifact?.phase?.name || 'SDLC Phase'}</span>
              <span>•</span>
              <span className={isDirty ? 'text-amber-500 font-semibold' : 'text-slate-400'}>
                {isDirty ? 'Unsaved edits' : 'All changes saved'}
              </span>
            </div>
          </div>
        </div>

        {/* Live Active Collaborators Bar */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
            <Users className="w-4 h-4 text-indigo-600" />
            <div className="flex items-center -space-x-1.5">
              {activePeers.slice(0, 4).map((peer, i) => (
                <div
                  key={i}
                  title={`${peer.name} (${peer.role})`}
                  className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm overflow-hidden"
                  style={{ backgroundColor: peer.color || '#3B82F6' }}
                >
                  {peer.avatar ? (
                    <img src={peer.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    peer.name?.charAt(0) || 'U'
                  )}
                </div>
              ))}
            </div>
            <span className="text-xs font-semibold text-slate-700 ml-1">
              {activePeers.length} Live
            </span>
          </div>

          {/* Quick-action: Raise Dispute */}
          <button
            onClick={() => navigate('/disputes')}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-xs font-semibold hover:bg-amber-100 transition"
          >
            <Scale className="w-3.5 h-3.5 text-amber-600" />
            Raise Dispute on Doc
          </button>

          {/* Save Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSave(false)}
              disabled={saving || !isDirty}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs transition shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Syncing...' : saveSuccess ? 'Saved!' : 'Save Revision'}
            </button>
          </div>
        </div>
      </header>

      {/* Conflict Warning Alert */}
      {conflictError && (
        <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 flex items-center justify-between text-xs text-rose-800 shrink-0">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            {conflictError}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 bg-rose-600 text-white font-bold rounded hover:bg-rose-700"
          >
            Reload Latest Server Version
          </button>
        </div>
      )}

      {/* Main Workspace Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor & Preview Pane */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200 bg-white">
          {/* Sub-toolbar */}
          <div className="h-10 border-b border-slate-200 px-4 flex items-center justify-between text-xs text-slate-600 bg-slate-50/70 shrink-0">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode('edit')}
                className={`px-2.5 py-1 rounded font-medium ${viewMode === 'edit' ? 'bg-white shadow-xs text-indigo-600' : 'hover:bg-slate-200/50'}`}
              >
                Editor
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-2.5 py-1 rounded font-medium ${viewMode === 'split' ? 'bg-white shadow-xs text-indigo-600' : 'hover:bg-slate-200/50'}`}
              >
                Split View
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`px-2.5 py-1 rounded font-medium ${viewMode === 'preview' ? 'bg-white shadow-xs text-indigo-600' : 'hover:bg-slate-200/50'}`}
              >
                Preview
              </button>
            </div>

            <div className="text-[11px] text-slate-400">
              Markdown Syntax Supported (KaTeX math, tables, code blocks)
            </div>
          </div>

          {/* Text Area / Render Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Editor Input */}
            {(viewMode === 'edit' || viewMode === 'split') && (
              <div className={`flex-1 p-6 overflow-y-auto ${viewMode === 'split' ? 'border-r border-slate-200' : ''}`}>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onSelect={(e) => {
                    const start = e.target.selectionStart;
                    const end = e.target.selectionEnd;
                    if (start !== end) {
                      setSelectedText(content.substring(start, end));
                    }
                  }}
                  placeholder="Draft deliverable specifications in Markdown..."
                  className="w-full h-full font-mono text-sm leading-relaxed resize-none focus:outline-none text-slate-800"
                />
              </div>
            )}

            {/* Live Rendered Output */}
            {(viewMode === 'preview' || viewMode === 'split') && (
              <div className="flex-1 p-6 overflow-y-auto bg-slate-50/40">
                <div className="prose prose-slate max-w-none text-sm leading-relaxed">
                  <div className="whitespace-pre-wrap font-sans text-slate-800">
                    {content}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Collaboration Tools */}
        <div className="w-80 bg-white flex flex-col shrink-0">
          {/* Tabs header */}
          <div className="h-10 border-b border-slate-200 flex text-xs font-semibold text-slate-500 bg-slate-50">
            <button
              onClick={() => setActiveSideTab('comments')}
              className={`flex-1 flex items-center justify-center gap-1.5 border-b-2 ${
                activeSideTab === 'comments' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Comments ({comments.filter(c => !c.isResolved).length})
            </button>
            <button
              onClick={() => setActiveSideTab('suggestions')}
              className={`flex-1 flex items-center justify-center gap-1.5 border-b-2 ${
                activeSideTab === 'suggestions' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Suggestions ({suggestions.filter(s => s.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveSideTab('versions')}
              className={`flex-1 flex items-center justify-center gap-1.5 border-b-2 ${
                activeSideTab === 'versions' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Revisions
            </button>
          </div>

          {/* Sidebar Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* 1. COMMENTS TAB */}
            {activeSideTab === 'comments' && (
              <div className="space-y-4">
                <form onSubmit={handleAddComment} className="space-y-2">
                  <textarea
                    rows={2}
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Add an inline review note..."
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                  />
                  <button
                    type="submit"
                    disabled={!newCommentText.trim()}
                    className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold"
                  >
                    Post Note
                  </button>
                </form>

                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      No comments yet on this deliverable.
                    </div>
                  ) : (
                    comments.map(c => (
                      <div
                        key={c.id}
                        className={`p-3 rounded-xl border text-xs space-y-2 ${
                          c.isResolved ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{c.user?.name || 'Contributor'}</span>
                          <span className="text-[10px] text-slate-400">
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{c.content}</p>
                        <div className="pt-1 flex justify-end">
                          {!c.isResolved ? (
                            <button
                              onClick={() => handleResolveComment(c.id)}
                              className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Mark Resolved
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">Resolved</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 2. SUGGESTIONS TAB */}
            {activeSideTab === 'suggestions' && (
              <div className="space-y-4">
                <form onSubmit={handleAddSuggestion} className="space-y-2">
                  {selectedText && (
                    <div className="p-2 bg-indigo-50 border border-indigo-200 rounded text-[11px] text-indigo-900 line-clamp-2">
                      <span className="font-bold">Target Text:</span> "{selectedText}"
                    </div>
                  )}
                  <textarea
                    rows={2}
                    value={newSuggestionText}
                    onChange={(e) => setNewSuggestionText(e.target.value)}
                    placeholder="Suggest revised text replacement..."
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                  />
                  <button
                    type="submit"
                    disabled={!newSuggestionText.trim()}
                    className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold"
                  >
                    Propose Tracked Change
                  </button>
                </form>

                <div className="space-y-3">
                  {suggestions.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      No tracked suggestions active.
                    </div>
                  ) : (
                    suggestions.map(s => (
                      <div key={s.id} className="p-3 rounded-xl border border-slate-200 text-xs space-y-2 bg-white">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{s.user?.name || 'Reviewer'}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            s.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                            s.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {s.status}
                          </span>
                        </div>
                        {s.originalText && (
                          <div className="line-through text-rose-600 text-[11px] bg-rose-50 p-1 rounded">
                            {s.originalText}
                          </div>
                        )}
                        <div className="text-emerald-700 text-[11px] bg-emerald-50 p-1 rounded">
                          {s.suggestedText}
                        </div>

                        {s.status === 'pending' && (
                          <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
                            <button
                              onClick={() => handleReviewSuggestion(s.id, 'rejected')}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleReviewSuggestion(s.id, 'accepted')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold"
                            >
                              Accept & Apply
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 3. REVISIONS TAB */}
            {activeSideTab === 'versions' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-500 font-medium">Snapshot Audit History</div>
                {(artifact?.versions || []).map((v, i) => (
                  <div key={v.id || i} className="p-3 rounded-xl border border-slate-200 bg-white text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>Version {v.versionNumber || v.version_number}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {v.createdAt ? new Date(v.createdAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{v.changeSummary || v.change_summary || 'Document update'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
