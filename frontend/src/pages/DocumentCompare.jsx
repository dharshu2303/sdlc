import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { fetchApi } from '../services/api';
import { GitCompare, ArrowLeft, FileText, CheckCircle2, Clock } from 'lucide-react';

export default function DocumentCompare() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const v1 = searchParams.get('v1') || '1.0';
  const v2 = searchParams.get('v2') || '2.1';

  const [artifact, setArtifact] = useState(null);
  const [compareData, setCompareData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchApi(`/artifacts/${id}`),
      fetchApi(`/artifacts/${id}/compare?v1=${v1}&v2=${v2}`)
    ])
      .then(([artRes, compRes]) => {
        setArtifact(artRes);
        setCompareData(compRes);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id, v1, v2]);

  if (loading) return (
    <div className="p-8 text-center text-blue-500 text-xs animate-pulse">
      Loading Version Comparison...
    </div>
  );

  const version1Content = compareData?.version1?.content || artifact?.versions?.find(v => v.versionNumber === v1)?.content || 'Initial draft version content...';
  const version2Content = compareData?.version2?.content || artifact?.content || 'Latest approved version content...';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/documents/${id}`)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Document</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
          <GitCompare className="w-4 h-4 text-blue-600" />
          <span>Visual Side-by-Side Version Diff Comparison</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <h1 className="text-lg font-bold text-slate-800">{artifact?.title}</h1>
        <p className="text-xs text-slate-500 mt-1">Comparing version <strong className="text-amber-600">v{v1}</strong> against version <strong className="text-emerald-600">v{v2}</strong></p>
      </div>

      {/* Side by Side Comparison Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Version 1 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
            <span className="font-bold text-amber-600 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              Version {v1} (Previous Revision)
            </span>
            <span className="text-[11px] text-slate-400">Author: {artifact?.owner?.name || 'Author'}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 leading-relaxed whitespace-pre-wrap min-h-[400px]">
            {version1Content}
          </div>
        </div>

        {/* Right: Version 2 */}
        <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm space-y-3 bg-emerald-50/20">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100 text-xs">
            <span className="font-bold text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Version {v2} (Current / Approved)
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold">Active Production Baseline</span>
          </div>

          <div className="p-4 rounded-xl bg-white text-xs font-mono text-slate-800 leading-relaxed whitespace-pre-wrap min-h-[400px] border border-emerald-200 shadow-xs">
            {version2Content}
          </div>
        </div>
      </div>
    </div>
  );
}
