import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import FileUploadZone from '../components/FileUploadZone';
import {
  FolderGit2,
  FileText,
  Upload,
  CheckSquare,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Clock,
  Layers,
  X,
  Users
} from 'lucide-react';
import { SDLC_RACI_MATRIX } from '../config/docRaci';

export default function ProjectDetail({ activeUser }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [gateEvaluation, setGateEvaluation] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Doc Form
  const [newDoc, setNewDoc] = useState({
    title: '',
    artifactType: 'SRS',
    content: ''
  });
  const [uploadPhaseId, setUploadPhaseId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedPhaseId, setSelectedPhaseId] = useState(null);
  const [lockedPhaseModal, setLockedPhaseModal] = useState(null);

  const canUserUploadForPhase = (phase) => {
    if (!activeUser?.role || activeUser.role === 'Admin' || project?.status === 'Completed' || project?.status === 'Archived') return false;
    if (activeUser.role === 'Project Manager') return true;

    const isScrum = project?.methodology?.name?.toLowerCase().includes('scrum') || project?.methodology?.name?.toLowerCase().includes('agile');
    const raciPlan = isScrum ? SDLC_RACI_MATRIX.Scrum : SDLC_RACI_MATRIX.Waterfall;
    const matchedPhase = raciPlan.find(pg => pg.phaseName.toLowerCase().includes((phase?.name || '').toLowerCase()) || (phase?.name || '').toLowerCase().includes(pg.phaseName.toLowerCase()));

    if (matchedPhase) {
      return matchedPhase.documents.some(d => {
        const owners = (d.owner || '').split(/[/+,]/).map(s => s.trim().toLowerCase());
        return owners.some(o => o.includes(activeUser.role.toLowerCase()) || activeUser.role.toLowerCase().includes(o));
      });
    }
    return false;
  };

  const loadProject = () => {
    fetchApi(`/projects/${id}`)
      .then(data => {
        setProject(data);
        if (data?.currentPhaseId) {
          setUploadPhaseId(data.currentPhaseId);
        } else if (data?.phases?.[0]?.id) {
          setUploadPhaseId(data.phases[0].id);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadProject();
  }, [id]);

  const handleEvaluateAndApprovePhase = async (phaseId) => {
    setEvaluating(true);
    try {
      const evaluation = await fetchApi(`/phase-gates/evaluate/${phaseId}`);
      setGateEvaluation(evaluation);

      if (evaluation.isGatePassed) {
        alert('Phase gate verified and approved. Project advanced to the next phase.');
        loadProject();
      } else {
        alert('Phase gate cannot be closed yet. Please review the missing deliverables or approvals listed below.');
      }
      setEvaluating(false);
    } catch (err) {
      alert(`Gate verification error: ${err.message}`);
      setEvaluating(false);
    }
  };

  const handleUploadDeliverable = async (e) => {
    e.preventDefault();
    if (!selectedFile && !newDoc.title) {
      return alert('Please select a file or provide a title.');
    }
    setSubmitting(true);
    try {
      const targetPhaseId = uploadPhaseId || project.currentPhaseId || project.phases?.[0]?.id;
      const payload = {
        title: newDoc.title || selectedFile?.name || 'Deliverable Document',
        artifactType: newDoc.artifactType,
        content: newDoc.content || 'Uploaded deliverable file.',
        projectId: project.id,
        phaseId: targetPhaseId,
        fileName: selectedFile?.name || `${newDoc.artifactType}_Doc.pdf`,
        fileSize: selectedFile?.size || '2.4 MB',
        fileType: selectedFile?.type || 'pdf',
        fileData: selectedFile?.data || ''
      };

      await fetchApi('/artifacts/upload', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setSubmitting(false);
      setUploadModalOpen(false);
      setSelectedFile(null);
      setNewDoc({ title: '', artifactType: 'SRS', content: '' });
      alert('Deliverable uploaded & submitted for phase verification!');
      loadProject();
    } catch (err) {
      alert(`Upload error: ${err.message}`);
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="p-8 text-center text-blue-500 text-xs animate-pulse">
      Loading Project SDLC Details...
    </div>
  );
  if (!project) return (
    <div className="p-8 text-center text-red-500 text-xs">
      Project not found.
    </div>
  );

  const currentPhase = project.phases?.find(p => p.id === project.currentPhaseId) || project.phases?.[0];
  const activePhaseId = selectedPhaseId || currentPhase?.id;
  const activeSelectedPhase = project.phases?.find(p => p.id === activePhaseId) || currentPhase;

  // Filter artifacts respective to the selected phase (or all if activePhaseId is 'ALL')
  const displayedArtifacts = (project.artifacts || []).filter(art => {
    if (activePhaseId === 'ALL') return true;
    return art.phaseId === activePhaseId;
  });

  const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 text-xs focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20";
  const labelCls = "block text-slate-700 font-semibold mb-1 text-xs";

  const handlePhaseClick = (phase) => {
    if (phase.status === 'Locked') {
      const prevPhase = project.phases?.find(p => p.sequence === phase.sequence - 1) || currentPhase;
      setLockedPhaseModal({
        phase,
        prevPhase
      });
      return;
    }
    setSelectedPhaseId(phase.id);
  };

  const isProjectCompleted = project.status === 'Completed';
  const allPhasesCompleted = project.phases?.length > 0 && project.phases.every(p => p.status === 'Completed');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Project Completed Banner */}
      {isProjectCompleted && (
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-300 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-emerald-800 flex items-center gap-2">
              🎉 Project Successfully Completed
            </h2>
            <p className="text-xs text-emerald-700 mt-0.5">
              All {project.phases?.length || 7} SDLC phases have passed gate review. This project is now archived.
              {project.endDate && (
                <span className="ml-2 font-semibold">Completed on: {new Date(project.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              )}
            </p>
          </div>
          <StatusBadge status="Completed" />
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-800">{project.name}</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
              {project.methodology?.name || 'Sequential 7-Phase SDLC'}
            </span>
            <StatusBadge status={project.status} />
          </div>
          <p className="text-xs text-slate-500 mt-1">{project.description}</p>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 flex-wrap">
            <span>Client: <strong className="text-slate-700">{project.clientName || 'Internal Client'}</strong></span>
            <span>Code: <strong className="text-slate-700">{project.code}</strong></span>
            <span>Priority: <strong className="text-blue-600 font-semibold">{project.priority}</strong></span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-slate-400" /> Members: <strong className="text-slate-700">{project.members?.length || 0}</strong></span>
            {currentPhase && !isProjectCompleted && (
              <span className="px-2 py-0.5 rounded-lg bg-blue-100/70 text-blue-800 font-semibold text-[11px] border border-blue-200 flex items-center gap-1">
                📍 Current Active Phase: <strong>{currentPhase.name}</strong>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isProjectCompleted && canUserUploadForPhase(activeSelectedPhase) ? (
            <button
              onClick={() => {
                setNewDoc(prev => ({
                  ...prev,
                  artifactType: activeSelectedPhase?.name === 'Planning' ? 'ProjectPlan' : activeSelectedPhase?.name === 'Requirements' ? 'SRS' : activeSelectedPhase?.name === 'Design' ? 'HLD' : activeSelectedPhase?.name === 'Testing' ? 'TestPlan' : 'SRS'
                }));
                setUploadModalOpen(true);
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload {activeSelectedPhase?.name || 'Phase'} Deliverable</span>
            </button>
          ) : isProjectCompleted ? (
            <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Project Completed — No Further Uploads</span>
            </div>
          ) : (
            <div className="px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 font-medium flex items-center gap-1.5">
              <span>👁️ View & Download Phase Access ({activeUser?.role || 'Team Member'})</span>
            </div>
          )}
        </div>
      </div>

      {/* 7-Phase Gate Stepper */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              SDLC Phase Lifecycle Stepper (Click a phase to view its respective documents)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Phase gates require deliverable upload & PM approval to advance to the next stage.</p>
          </div>
          <button
            onClick={() => navigate(`/analytics`)}
            className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
          >
            <span>View Time Analytics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {project.phases?.map((phase) => {
            const isCurrent = phase.id === project.currentPhaseId;
            const isSelected = activePhaseId === phase.id;
            const isDelayed = (phase.actualDays || 0) > (phase.plannedDays || 14);
            const phaseDocCount = (project.artifacts || []).filter(a => a.phaseId === phase.id).length;

            return (
              <div
                key={phase.id}
                onClick={() => handlePhaseClick(phase)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-blue-600 bg-blue-50/90 border-blue-500 shadow-md shadow-blue-500/15'
                    : isCurrent
                    ? 'bg-blue-50/50 border-blue-300'
                    : phase.status === 'Completed'
                    ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300'
                    : 'bg-slate-50 border-slate-200 opacity-80 hover:opacity-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="truncate">P{phase.sequence}: {phase.name}</span>
                  {phase.status === 'Completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : phase.status === 'Locked' ? (
                    <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
                  )}
                </div>

                <div className="mt-1.5 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">Docs: <strong className="text-blue-700 font-bold">{phaseDocCount}</strong></span>
                  {isCurrent && (
                    <span className="px-1.5 py-0.2 rounded bg-blue-600 text-white font-bold text-[9px]">ACTIVE</span>
                  )}
                </div>

                <div className="mt-2 text-[10px] text-slate-500 truncate">
                  Role: <strong className="text-slate-700 font-semibold">{phase.assignedRole || 'Phase Lead'}</strong>
                </div>

                <div className="mt-2 p-1.5 rounded-lg bg-white border border-slate-200 text-[10px]">
                  <div className="flex justify-between text-slate-500">
                    <span>Planned: <strong className="text-slate-700">{phase.plannedDays || 14}d</strong></span>
                    <span>Spent: <strong className={isDelayed ? 'text-amber-600 font-bold' : 'text-slate-700'}>{phase.actualDays || 0}d</strong></span>
                  </div>
                  {isDelayed && (
                    <div className="text-[9px] text-amber-600 font-semibold mt-0.5 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>+{phase.actualDays - phase.plannedDays}d Overdue</span>
                    </div>
                  )}
                </div>

                <div className="mt-2.5 flex items-center justify-between">
                  <StatusBadge status={phase.status} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Phase Verification Panel */}
      {currentPhase && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-800">Current Phase Gate: {currentPhase.name}</h3>
                <StatusBadge status={currentPhase.status} />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Assigned Employee Role: <strong className="text-slate-700">{currentPhase.assignedRole || 'Lead'}</strong> &bull; Planned Duration: <strong className="text-slate-700">{currentPhase.plannedDays || 14} Days</strong>
              </p>
            </div>

            <button
              onClick={() => handleEvaluateAndApprovePhase(currentPhase.id)}
              disabled={evaluating || isProjectCompleted}
              title={isProjectCompleted ? 'All phases completed — project is archived.' : ''}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <CheckSquare className="w-4 h-4" />
              <span>{evaluating ? 'Verifying Gate...' : isProjectCompleted ? '✅ All Phases Completed' : 'Verify & Approve Phase (PM Sign-off)'}</span>
            </button>
          </div>

          {gateEvaluation && !gateEvaluation.isGatePassed && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
              <div className="font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Phase Gate Verification Requirements:</span>
              </div>
              <ul className="mt-2 space-y-1 pl-6 list-disc text-amber-900">
                {gateEvaluation.blockers?.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Phase-Wise Deliverables & Documentation Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-800">
                {activePhaseId === 'ALL'
                  ? `All Project Deliverables (${project.artifacts?.length || 0})`
                  : `Phase Deliverables: ${activeSelectedPhase?.name || 'Current'} Phase (${displayedArtifacts.length})`}
              </h2>
              {activeSelectedPhase?.id === project.currentPhaseId && activePhaseId !== 'ALL' && (
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] border border-blue-200">
                  Current Active Phase
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {activePhaseId === 'ALL'
                ? 'Showing all documentation artifacts across all project phases.'
                : `Showing mandatory and supplementary documentation respective to the ${activeSelectedPhase?.name} phase.`}
            </p>
          </div>

          {canUserUploadForPhase(activeSelectedPhase) && (
            <button
              onClick={() => {
                setNewDoc(prev => ({
                  ...prev,
                  artifactType: activeSelectedPhase?.name === 'Planning' ? 'ProjectPlan' : activeSelectedPhase?.name === 'Requirements' ? 'SRS' : activeSelectedPhase?.name === 'Design' ? 'HLD' : activeSelectedPhase?.name === 'Testing' ? 'TestPlan' : 'SRS'
                }));
                setUploadModalOpen(true);
              }}
              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start md:self-auto transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Add Deliverable to {activeSelectedPhase?.name || 'Phase'}</span>
            </button>
          )}
        </div>

        {/* Phase Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-100 scrollbar-thin">
          <button
            onClick={() => setSelectedPhaseId(currentPhase?.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activePhaseId === currentPhase?.id
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            <span>📍 Active Phase ({currentPhase?.name})</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activePhaseId === currentPhase?.id ? 'bg-white/20 text-white' : 'bg-blue-200 text-blue-800'}`}>
              {(project.artifacts || []).filter(a => a.phaseId === currentPhase?.id).length}
            </span>
          </button>

          {project.phases?.map(p => {
            const count = (project.artifacts || []).filter(a => a.phaseId === p.id).length;
            const isSelected = activePhaseId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handlePhaseClick(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800 text-white font-semibold shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>P{p.sequence}: {p.name}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {count}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => setSelectedPhaseId('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activePhaseId === 'ALL'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            <span>All Phases</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activePhaseId === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {project.artifacts?.length || 0}
            </span>
          </button>
        </div>

        {/* Deliverables List Respective to Phase */}
        <div className="space-y-3 pt-1">
          {displayedArtifacts.length > 0 ? (
            displayedArtifacts.map(art => {
              const artPhase = project.phases?.find(p => p.id === art.phaseId);
              return (
                <div
                  key={art.id}
                  onClick={() => navigate(`/documents/${art.id}`)}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer transition-all flex items-center justify-between gap-4 group"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800 text-sm flex items-center gap-2 flex-wrap">
                      <span>{art.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                        {art.artifactType}
                      </span>
                      {artPhase && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          {artPhase.name} Phase
                        </span>
                      )}
                    </div>
                    {art.description && !art.description.includes('Required SDLC document') && !art.description.includes('SDLC document for') && (
                      <p className="text-xs text-slate-500 mt-1">{art.description}</p>
                    )}
                    <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-4 flex-wrap">
                      <span>Author: <strong className="text-slate-600">{art.owner?.name || art.ownerId}</strong></span>
                      <span>Version: <strong className="text-blue-600">v{art.currentVersion}</strong></span>
                      {art.fileName && (
                        <span>File: <strong className="text-slate-600">{art.fileName}</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={art.status} />
                    <div className="p-2 rounded-lg bg-white text-slate-500 border border-slate-200 group-hover:border-blue-300 group-hover:text-blue-600 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 space-y-3">
              <FileText className="w-8 h-8 text-slate-400 mx-auto" />
              <div>
                <p className="text-xs font-semibold text-slate-700">
                  No deliverables registered for the {activeSelectedPhase?.name || 'selected'} phase yet.
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Upload the required phase artifacts to fulfill SDLC governance and unblock the phase gate.
                </p>
              </div>
              <button
                onClick={() => {
                  setNewDoc(prev => ({
                    ...prev,
                    artifactType: activeSelectedPhase?.name === 'Planning' ? 'ProjectPlan' : activeSelectedPhase?.name === 'Requirements' ? 'SRS' : activeSelectedPhase?.name === 'Design' ? 'HLD' : activeSelectedPhase?.name === 'Testing' ? 'TestPlan' : 'SRS'
                  }));
                  setUploadModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 inline-flex items-center gap-1.5 transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload {activeSelectedPhase?.name || 'Phase'} Deliverable</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Upload Deliverable Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 md:p-7 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Upload Deliverable Document
              </h3>
              <button
                onClick={() => {
                  setUploadModalOpen(false);
                  setSelectedFile(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadDeliverable} className="space-y-4 text-xs">
              <div>
                <label className={labelCls}>Target SDLC Phase Gate *</label>
                <select
                  value={uploadPhaseId || activeSelectedPhase?.id || ''}
                  onChange={e => {
                    const chosenId = e.target.value;
                    setUploadPhaseId(chosenId);
                    const chosenPhase = project.phases?.find(p => p.id === chosenId);
                    if (chosenPhase?.name === 'Planning') setNewDoc(d => ({ ...d, artifactType: 'ProjectPlan' }));
                    else if (chosenPhase?.name === 'Requirements') setNewDoc(d => ({ ...d, artifactType: 'SRS' }));
                    else if (chosenPhase?.name === 'Design') setNewDoc(d => ({ ...d, artifactType: 'HLD' }));
                    else if (chosenPhase?.name === 'Development') setNewDoc(d => ({ ...d, artifactType: 'Technical Documentation' }));
                    else if (chosenPhase?.name === 'Testing') setNewDoc(d => ({ ...d, artifactType: 'TestPlan' }));
                    else if (chosenPhase?.name === 'Deployment') setNewDoc(d => ({ ...d, artifactType: 'Deployment Plan' }));
                    else if (chosenPhase?.name === 'Maintenance') setNewDoc(d => ({ ...d, artifactType: 'Change Request' }));
                  }}
                  className={inputCls}
                >
                  {project.phases?.map(p => (
                    <option key={p.id} value={p.id}>
                      P{p.sequence}: {p.name} Phase {p.id === project.currentPhaseId ? '(Current Active Phase)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Select Document File (PDF, Word, Excel, Images, Text) *</label>
                <FileUploadZone onFileSelected={setSelectedFile} />
              </div>

              <div>
                <label className={labelCls}>Document Title</label>
                <input
                  type="text"
                  placeholder="e.g. System Architecture Design Specification"
                  value={newDoc.title}
                  onChange={e => setNewDoc({ ...newDoc, title: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Artifact Type *</label>
                <select
                  value={newDoc.artifactType}
                  onChange={e => setNewDoc({ ...newDoc, artifactType: e.target.value })}
                  className={inputCls}
                >
                  {(() => {
                    const isScrum = project.methodology?.name?.toLowerCase().includes('scrum') || project.methodology?.name?.toLowerCase().includes('agile');
                    const raciPlan = isScrum ? SDLC_RACI_MATRIX.Scrum : SDLC_RACI_MATRIX.Waterfall;
                    return raciPlan.map(pg => (
                      <optgroup key={pg.phaseId} label={pg.phaseName}>
                        {pg.documents.map(d => (
                          <option key={d.id} value={d.type}>
                            {d.name} {d.required ? '(Mandatory Gate Requirement)' : '(Recommended Specification)'}
                          </option>
                        ))}
                      </optgroup>
                    ));
                  })()}
                </select>
              </div>

              <div>
                <label className={labelCls}>Deliverable Summary / Specification Notes</label>
                <textarea
                  rows={3}
                  placeholder="Enter specifications or deliverable summary..."
                  value={newDoc.content}
                  onChange={e => setNewDoc({ ...newDoc, content: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUploadModalOpen(false);
                    setSelectedFile(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/20 transition-all"
                >
                  {submitting ? 'Uploading Deliverable...' : 'Upload & Submit Deliverable'}
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
                  This phase is <strong>locked</strong>. You must complete and verify all mandatory deliverables for <strong>Phase {lockedPhaseModal.prevPhase?.sequence || (lockedPhaseModal.phase.sequence - 1)}: {lockedPhaseModal.prevPhase?.name || 'Previous Phase'}</strong> and get PM sign-off before this phase unlocks.
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
                  setSelectedPhaseId(currentPhase?.id);
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
