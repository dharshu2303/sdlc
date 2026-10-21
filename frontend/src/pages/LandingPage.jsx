import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Layers, FileCheck2, Lock, Network } from 'lucide-react';
import AppLogo from '../components/AppLogo';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFF] text-slate-800 flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm px-8 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <AppLogo className="h-9" />
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Login to Portal</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-5xl mx-auto w-full">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-8">
          <ShieldCheck className="w-4 h-4 text-blue-500" />
          <span>SDLC Documentation Governance Platform</span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-800 leading-tight max-w-3xl">
          Guide every software project through{' '}
          <span className="text-blue-600">structured SDLC documentation</span>{' '}
          & approvals.
        </h1>

        {/* Subheading */}
        <p className="mt-6 text-base text-slate-500 max-w-2xl leading-relaxed">
          Ensure the right artifact is created by the right person, reviewed, approved, and verified before any phase gate can close.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex items-center gap-4">
          <button
            onClick={() => navigate('/login')}
            className="px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Get Started / Login</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Feature Cards */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-5 text-left w-full">
          {[
            { icon: <Layers className="w-7 h-7 text-blue-500" />,    bg: 'bg-blue-50',    title: 'Methodology Driven',    desc: 'Waterfall & Scrum templates with automated artifact generation per phase.' },
            { icon: <FileCheck2 className="w-7 h-7 text-emerald-500" />, bg: 'bg-emerald-50', title: 'Multi-Level Approvals', desc: 'Formal signoffs with sequential approval chains before phase gates close.' },
            { icon: <Network className="w-7 h-7 text-amber-500" />,  bg: 'bg-amber-50',   title: 'Document Traceability', desc: 'Link SRS, HLD, LLD, and Test Plans traceably to decisions and phases.' },
            { icon: <Lock className="w-7 h-7 text-indigo-500" />,    bg: 'bg-indigo-50',  title: 'Phase Gate System',     desc: 'Phase gates enforce compliance rules before unlocking the next phase.' },
          ].map((card, i) => (
            <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-200 hover:shadow-md hover:shadow-blue-100 transition-all">
              <div className={`w-11 h-11 rounded-xl ${card.bg} flex items-center justify-center mb-4`}>
                {card.icon}
              </div>
              <h3 className="font-bold text-sm text-slate-800">{card.title}</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-5 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        SDLC Documentation Governance Platform &copy; 2026. Built with React & Node.js.
      </footer>
    </div>
  );
}
