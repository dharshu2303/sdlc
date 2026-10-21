import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import FileUploadZone from '../components/FileUploadZone';
import {
  FileText,
  Search,
  Plus,
  Filter,
  ArrowUpRight,
  UploadCloud,
  X,
  ShieldCheck,
  User,
  Eye,
  Layers,
  FolderGit2,
  CheckCircle2,
  Clock,
  Lock,
  ChevronRight,
  Info,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SDLC_RACI_MATRIX, getAllDocumentTypes } from '../config/docRaci';
import { canEditArtifactType } from '../utils/rbac';

export default function DocumentRepository({ activeUser }) {
  const [artifacts, setArtifacts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState('CURRENT'); // 'CURRENT', 'ALL', or phase.id
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lockedPhaseModal, setLockedPhaseModal] = useState(null);
  const navigate = useNavigate();

  const [uploadData, setUploadData] = useState({
    title: '',
    artifactType: 'SRS',
    description: '',
    projectId: '',
    phaseId: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const loadData = () => {
    Promise.all([
      fetchApi('/artifacts'),
      fetchApi('/projects')
    ]).then(([artifactsData, projectsData]) => {
      setArtifacts(artifactsData || []);
      setProjects(projectsData || []);

      if (projectsData && projectsData.length > 0 && !selectedProjectId) {
        const firstProj = projectsData[0];
        setSelectedProjectId(firstProj.id);
        const currPhase = firstProj.phases?.find(p => p.id === firstProj.currentPhaseId) || firstProj.phases?.[0];
        setUploadData(prev => ({
          ...prev,
          projectId: firstProj.id,
          phaseId: currPhase?.id || ''
        }));
      }

      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];
  const currentPhase = selectedProject?.phases?.find(p => p.id === selectedProject?.currentPhaseId) || selectedProject?.phases?.[0];

  const handleCreateDocument = async (e) => {
    e.preventDefault();
    if (!selectedFile && !uploadData.title) {
      return alert('Please select a document file to upload or enter a title.');
    }
    setSubmitting(true);
    try {
      const payload = {
        ...uploadData,
        projectId: uploadData.projectId || selectedProject?.id,
        phaseId: uploadData.phaseId || currentPhase?.id,
        title: uploadData.title || selectedFile?.name || 'Uploaded Document',
        fileName: selectedFile?.name || `${uploadData.artifactType}_Doc.pdf`,
        fileSize: selectedFile?.size || '2.5 MB',
        fileType: selectedFile?.type || 'pdf',
        fileData: selectedFile?.data || 'Mock file data payload'
      };
      const created = await fetchApi('/artifacts/upload', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setSubmitting(false);
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadData(prev => ({
        ...prev,
        title: '',
        artifactType: 'SRS',
        description: ''
      }));
      loadData();
      if (created.id) navigate(`/documents/${created.id}`);
    } catch (err) {
      alert(`Upload error: ${err.message}`);
      setSubmitting(false);
    }
  };

  // Filter artifacts according to project, phase filter, search and status
  const filteredArtifacts = artifacts.filter(a => {
    // 1. Project filtering
    if (selectedProjectId && selectedProjectId !== 'ALL') {
      if (a.projectId && a.projectId !== selectedProjectId) return false;
    }

    // 2. Phase filtering
    if (selectedPhaseFilter === 'CURRENT') {
      if (currentPhase && a.phaseId && a.phaseId !== currentPhase.id) {
        return false;
      }
    } else if (selectedPhaseFilter !== 'ALL') {
      // Specific phase ID selected
      if (a.phaseId && a.phaseId !== selectedPhaseFilter) {
        return false;
      }
    }

    // 3. Search filter
    const matchesSearch = !search ||
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.artifactType?.toLowerCase().includes(search.toLowerCase()) ||
      (a.fileName && a.fileName.toLowerCase().includes(search.toLowerCase()));

    // 4. Status filter
    const matchesStatus = !statusFilter || a.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) return (
    <div className="p-8 text-center text-blue-400 text-xs animate-pulse">Loading Document Catalog...</div>
  );

  const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 text-xs focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition-all";
  const labelCls = "block text-slate-700 font-semibold mb-1 text-xs";

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            Documents
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (selectedProject) {
                setUploadData(prev => ({
                  ...prev,
                  projectId: selectedProject.id,
                  phaseId: currentPhase?.id || selectedProject.phases?.[0]?.id || ''
                }));
              }
              setShowUploadModal(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Project & Current Phase Status Banner */}
      {selectedProject && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-700">Project Context:</span>
              </div>
              <select
                value={selectedProjectId}
                onChange={e => {
                  const pId = e.target.value;
                  setSelectedProjectId(pId);
                  const p = projects.find(proj => proj.id === pId);
                  const cp = p?.phases?.find(ph => ph.id === p?.currentPhaseId) || p?.phases?.[0];
                  setUploadData(prev => ({ ...prev, projectId: pId, phaseId: cp?.id || '' }));
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-400"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code || 'PRJ'})</option>
                ))}
                <option value="ALL">All Projects (Global View)</option>
              </select>

              {currentPhase && selectedProjectId !== 'ALL' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200 rounded-xl text-xs">
                  <span className="text-slate-500 font-medium">📍 Current Active Phase:</span>
                  <span className="font-bold text-blue-700 flex items-center gap-1">
                    {currentPhase.name}
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                  </span>
                  <span className="text-[10px] text-slate-400">({currentPhase.status})</span>
                </div>
              )}
            </div>

            {selectedProjectId !== 'ALL' && (
              <button
                onClick={() => navigate(`/projects/${selectedProject.id}`)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 self-start md:self-auto cursor-pointer"
              >
                <span>View Full Project SDLC Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Phase-wise Filter Tabs */}
          {selectedProject && selectedProject.phases && selectedProject.phases.length > 0 && selectedProjectId !== 'ALL' && (
            <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-1">
              <button
                onClick={() => setSelectedPhaseFilter('CURRENT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedPhaseFilter === 'CURRENT'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                <span>📍 Current Phase Only ({currentPhase?.name})</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedPhaseFilter === 'CURRENT' ? 'bg-white/20 text-white' : 'bg-blue-200 text-blue-800'}`}>
                  {artifacts.filter(a => (a.projectId === selectedProject.id || !a.projectId) && a.phaseId === currentPhase?.id).length}
                </span>
              </button>

              <button
                onClick={() => setSelectedPhaseFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedPhaseFilter === 'ALL'
                    ? 'bg-slate-800 text-white font-semibold shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>All Phases</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedPhaseFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {artifacts.filter(a => a.projectId === selectedProject.id || !a.projectId).length}
                </span>
              </button>

              {selectedProject.phases.map(ph => {
                const count = artifacts.filter(a => (a.projectId === selectedProject.id || !a.projectId) && a.phaseId === ph.id).length;
                const isSelected = selectedPhaseFilter === ph.id;
                return (
                  <button
                    key={ph.id}
                    onClick={() => {
                      if (ph.status === 'Locked') {
                        const prevPhase = selectedProject.phases?.find(p => p.sequence === ph.sequence - 1) || currentPhase;
                        setLockedPhaseModal({
                          phase: ph,
                          prevPhase
                        });
                        return;
                      }
                      setSelectedPhaseFilter(ph.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 text-white font-semibold shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>P{ph.sequence}: {ph.name}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row gap-3 items-center shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by title, file name, type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-400"
          >
            <option value="">All Statuses</option>
            <option value="Published">Published</option>
            <option value="Under Review">Under Review</option>
            <option value="Submitted">Submitted</option>
            <option value="Changes Requested">Changes Requested</option>
            <option value="Draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Grid of Documents */}
      {filteredArtifacts.length === 0 ? (
        <div className="flex items-center justify-center py-20 bg-white border border-slate-200 rounded-2xl">
          <div className="text-center space-y-3 p-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto">
              <FileText className="w-7 h-7 text-blue-400" />
            </div>
            <p className="text-sm font-semibold text-slate-600">
              {selectedPhaseFilter === 'CURRENT'
                ? `No documents found for the active ${currentPhase?.name || 'current'} phase.`
                : 'No documents match the selected filters.'}
            </p>
            <p className="text-xs text-slate-400">
              {selectedPhaseFilter === 'CURRENT'
                ? 'Upload the required deliverables for this phase to proceed.'
                : 'Try clearing filters or upload a new document.'}
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 inline-flex items-center gap-2 transition-all mt-2 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredArtifacts.map(art => {
            const fileExt = (art.fileType || art.fileName?.split('.').pop() || 'pdf').toUpperCase();
            const artProject = projects.find(p => p.id === art.projectId) || selectedProject;
            const artPhase = artProject?.phases?.find(p => p.id === art.phaseId) || art.phase;
            const isCurrentPhaseDoc = artPhase && currentPhase && artPhase.id === currentPhase.id;
            const allDocs = getAllDocumentTypes();
            const raci = allDocs.find(d => d.type === art.artifactType || d.name.toLowerCase().includes((art.artifactType || '').toLowerCase()) || (art.title && d.name.toLowerCase() === art.title.toLowerCase()));
            const ownerRole = raci?.owner || art.owner?.role || 'Designated Role Lead';
            const canUserUploadThis = canEditArtifactType(activeUser?.role, art.artifactType, art.title);

            return (
              <div
                key={art.id}
                onClick={() => navigate(`/documents/${art.id}`)}
                className={`bg-white border p-5 rounded-2xl cursor-pointer hover:border-blue-300 hover:shadow-md hover:shadow-blue-100 transition-all flex flex-col justify-between group ${
                  isCurrentPhaseDoc ? 'border-blue-200 ring-1 ring-blue-100' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-extrabold uppercase">
                        {fileExt}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                        {art.artifactType}
                      </span>
                      {artPhase && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isCurrentPhaseDoc
                            ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {artPhase.name} Phase {isCurrentPhaseDoc ? '📍' : ''}
                        </span>
                      )}
                    </div>
                    <StatusBadge status={art.status} />
                  </div>

                  <h2 className="text-sm font-bold text-slate-800 mt-3 group-hover:text-blue-700 transition-colors">{art.title}</h2>
                  {art.description && !art.description.includes('Required SDLC document') && !art.description.includes('SDLC document for') && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{art.description}</p>
                  )}

                  <div className="mt-3 flex items-center gap-2 flex-wrap text-[11px]">
                    <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold flex items-center gap-1">
                      <User className="w-3 h-3" /> Author: {ownerRole}
                    </span>
                    {art.blocksNextPhase && (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium text-[10px]">
                        Mandatory Gate
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate pr-2">
                    {canUserUploadThis ? (
                      <span className="text-blue-600 font-semibold flex items-center gap-1">
                        <UploadCloud className="w-3 h-3" /> Upload / Edit
                      </span>
                    ) : (
                      <span className="text-slate-500 flex items-center gap-1">
                        <Eye className="w-3 h-3" /> View & Download
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/documents/${art.id}/collaborate`);
                      }}
                      className="px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center gap-1 border border-indigo-200 transition"
                      title="Open Live Collaborative Markdown Editor"
                    >
                      <Users className="w-2.5 h-2.5" /> Collab
                    </button>
                  </div>
                  <span className="font-semibold text-blue-600 flex items-center gap-1 shrink-0">
                    v{art.currentVersion} <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* UPLOAD DOCUMENT MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-blue-600" />
                Upload SDLC Document
              </h2>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-4">
              <div>
                <label className={labelCls}>Select Document File (PDF, Word, Excel, Images) *</label>
                <FileUploadZone onFileSelected={setSelectedFile} />
              </div>

              <div>
                <label className={labelCls}>Document Title</label>
                <input
                  type="text"
                  placeholder="e.g. System Security Architecture Spec"
                  value={uploadData.title}
                  onChange={e => setUploadData({ ...uploadData, title: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Target Project *</label>
                  <select
                    value={uploadData.projectId || selectedProjectId || ''}
                    onChange={e => {
                      const pId = e.target.value;
                      const p = projects.find(proj => proj.id === pId);
                      const cp = p?.phases?.find(ph => ph.id === p?.currentPhaseId) || p?.phases?.[0];
                      setUploadData(prev => ({
                        ...prev,
                        projectId: pId,
                        phaseId: cp?.id || ''
                      }));
                    }}
                    className={inputCls}
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Target SDLC Phase Gate *</label>
                  <select
                    value={uploadData.phaseId || currentPhase?.id || ''}
                    onChange={e => {
                      const pId = e.target.value;
                      setUploadData(prev => ({ ...prev, phaseId: pId }));
                    }}
                    className={inputCls}
                  >
                    {selectedProject?.phases?.map(ph => (
                      <option key={ph.id} value={ph.id}>
                        P{ph.sequence}: {ph.name} Phase {ph.id === selectedProject.currentPhaseId ? '(Active)' : ''}
                      </option>
                    )) || (
                      <>
                        <option value="ph-bank-1">Planning Phase</option>
                        <option value="ph-bank-2">Requirements Phase</option>
                        <option value="ph-bank-3">Design Phase</option>
                        <option value="ph-bank-4">Development Phase</option>
                        <option value="ph-bank-5">Testing Phase</option>
                        <option value="ph-bank-6">Deployment Phase</option>
                        <option value="ph-bank-7">Maintenance Phase</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Document / Artifact Specification *</label>
                <select
                  value={uploadData.artifactType}
                  onChange={e => setUploadData({ ...uploadData, artifactType: e.target.value })}
                  className={inputCls}
                >
                  {(() => {
                    const isScrum = selectedProject?.methodology?.name?.toLowerCase().includes('scrum') || selectedProject?.methodology?.name?.toLowerCase().includes('agile');
                    const raciPlan = isScrum ? SDLC_RACI_MATRIX.Scrum : SDLC_RACI_MATRIX.Waterfall;
                    return raciPlan.map(pg => (
                      <optgroup key={pg.phaseId} label={pg.phaseName}>
                        {pg.documents.map(d => (
                          <option key={d.id} value={d.type}>
                            {d.name} {d.required ? '(Mandatory)' : '(Recommended)'}
                          </option>
                        ))}
                      </optgroup>
                    ));
                  })()}
                </select>
              </div>

              {/* Dynamic RACI Approval Chain Preview */}
              {(() => {
                const allDocs = getAllDocumentTypes();
                const matched = allDocs.find(d => d.type === uploadData.artifactType || d.name.toLowerCase().includes(uploadData.artifactType.toLowerCase()));
                if (!matched) return null;
                return (
                  <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-2">
                    <div className="flex items-center gap-1.5 text-blue-800 font-bold uppercase tracking-wider text-[10px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Governance RACI Chain for {matched.name}</span>
                    </div>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex items-start gap-2">
                        <span className="text-slate-500 font-semibold w-24 shrink-0 flex items-center gap-1">
                          <User className="w-3 h-3 text-blue-600" /> Owner/Edit:
                        </span>
                        <span className="font-bold text-slate-800">{matched.owner}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-slate-500 font-semibold w-24 shrink-0 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" /> Signoff:
                        </span>
                        <span className="font-bold text-emerald-700">{matched.reviewApprove}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-slate-500 font-semibold w-24 shrink-0 flex items-center gap-1">
                          <Eye className="w-3 h-3 text-slate-400" /> Consumers:
                        </span>
                        <span className="text-slate-600">{matched.viewAccess}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className={labelCls}>Document Description</label>
                <textarea
                  rows={2}
                  placeholder="Provide scope overview for reviewers and approvers..."
                  value={uploadData.description}
                  onChange={e => setUploadData({ ...uploadData, description: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold text-xs transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl shadow-md shadow-blue-600/20 text-xs transition-all cursor-pointer">
                  {submitting ? 'Uploading...' : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  This phase is <strong>locked</strong>. You must complete and verify all mandatory deliverables for <strong>Phase {lockedPhaseModal.prevPhase?.sequence || (lockedPhaseModal.phase.sequence - 1)}: {lockedPhaseModal.prevPhase?.name || 'Previous Phase'}</strong> and get PM approval before this phase unlocks.
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
                  setSelectedPhaseFilter('CURRENT');
                  setLockedPhaseModal(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                Go to Active Phase ({currentPhase?.name})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
