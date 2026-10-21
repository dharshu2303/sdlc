import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { Layers } from 'lucide-react';

export default function MethodologyAdmin() {
  const [methodologies, setMethodologies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/methodologies')
      .then(data => {
        setMethodologies(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="p-8 text-center text-blue-400 text-xs animate-pulse">
      Loading Methodology Frameworks...
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          Methodologies
        </h1>
      </div>

      {/* Methodology Cards */}
      {methodologies.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">No methodology templates</p>
          <p className="text-xs text-slate-400 mt-1">SDLC methodology frameworks will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {methodologies.map(m => (
            <div key={m.id} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4 hover:border-blue-200 hover:shadow-md hover:shadow-blue-100 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-slate-800">{m.name}</span>
                {m.isSystem && (
                  <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                    System Template
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">{m.description}</p>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="text-xs font-semibold text-slate-600">Phase Sequence ({m.phases?.length || 0}):</div>
                <div className="flex flex-wrap gap-2">
                  {m.phases?.map(p => (
                    <span
                      key={p.id}
                      className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-semibold text-blue-700"
                    >
                      {p.sequence}. {p.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
