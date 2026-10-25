import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { FolderGit2, Plus, ArrowRight, Users, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProjectList({ activeUser }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const isProjectManager = activeUser?.role === 'Project Manager';
  const canDeleteProject = isProjectManager || activeUser?.role === 'Admin';

  useEffect(() => {
    fetchApi('/projects')
      .then(data => {
        setProjects(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const deleteProject = async (event, project) => {
    event.stopPropagation();
    if (!window.confirm(`Delete "${project.name}" and its documents? This cannot be undone.`)) return;
    try {
      await fetchApi(`/projects/${project.id}`, { method: 'DELETE' });
      setProjects(current => current.filter(item => item.id !== project.id));
    } catch (err) {
      alert(`Could not delete project: ${err.message}`);
    }
  };

  if (loading) return (
    <div className="p-8 text-center text-blue-400 text-xs animate-pulse">Loading SDLC Projects...</div>
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <FolderGit2 className="w-4 h-4 text-blue-600" />
            </div>
            Projects
          </h1>
        </div>

        {isProjectManager && (
          <button
            onClick={() => navigate('/projects/new')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Project Wizard</span>
          </button>
        )}
      </div>

      {/* Grid of Projects */}
      {projects.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto">
              <FolderGit2 className="w-7 h-7 text-blue-400" />
            </div>
            <p className="text-sm font-semibold text-slate-600">No projects yet</p>
            <p className="text-xs text-slate-400">
              {isProjectManager
                ? 'Create your first SDLC project to get started.'
                : 'Only Project Managers have permission to initialize new SDLC projects. Please contact your Project Manager.'}
            </p>
            {isProjectManager && (
              <button
                onClick={() => navigate('/projects/new')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 inline-flex items-center gap-2 transition-all mt-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create SDLC Project</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {projects.map(proj => {
            const totalDocs = proj.artifactsCount || 0;
            const pubDocs = proj.publishedCount || 0;
            const pct = totalDocs > 0 ? Math.round((pubDocs / totalDocs) * 100) : 0;

            return (
              <div
                key={proj.id}
                onClick={() => navigate(`/projects/${proj.id}`)}
                className="bg-white border border-slate-200 p-6 rounded-2xl cursor-pointer hover:border-blue-300 hover:shadow-md hover:shadow-blue-100 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                      {proj.methodology?.name || 'Waterfall'}
                    </span>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={proj.status} />
                      {canDeleteProject && (
                        <button
                          type="button"
                          onClick={event => deleteProject(event, proj)}
                          aria-label={`Delete ${proj.name}`}
                          title="Delete project"
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h2 className="text-base font-bold text-slate-800 mt-3 group-hover:text-blue-700 transition-colors">{proj.name}</h2>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{proj.description}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Documentation Progress</span>
                    <span className="font-bold text-slate-700">{pct}% ({pubDocs}/{totalDocs})</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-400 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {proj.membersCount || 0} Members
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-blue-600 group-hover:gap-2 transition-all">
                      View Lifecycle <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
