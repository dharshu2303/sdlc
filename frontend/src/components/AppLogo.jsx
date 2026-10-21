import React from 'react';

export default function AppLogo({ className = 'w-9 h-9', showText = true, textClassName = '' }) {
  return (
    <div className="flex items-center gap-3 select-none">
      {/* Unique SDLC Brandmark */}
      <div className="relative flex items-center justify-center shrink-0">
        <div className="absolute -inset-1 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 blur-[3px] opacity-70"></div>
        <svg
          className={`${className} relative z-10 rounded-xl bg-slate-900 p-1.5 shadow-md shadow-blue-500/20 shrink-0`}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* SDLC Infinite Hex Loop */}
          <path
            d="M20 5L33 12.5V27.5L20 35L7 27.5V12.5L20 5Z"
            stroke="url(#sdlc-grad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Core Lifecycle Wave */}
          <path
            d="M13 20C13 16 16.5 14 20 14C23.5 14 27 16 27 20C27 24 23.5 26 20 26C16.5 26 13 24 13 20Z"
            stroke="#38BDF8"
            strokeWidth="2"
          />
          <circle cx="20" cy="5" r="2.5" fill="#38BDF8" />
          <circle cx="33" cy="20" r="2.5" fill="#818CF8" />
          <circle cx="20" cy="35" r="2.5" fill="#3B82F6" />
          <circle cx="7" cy="20" r="2.5" fill="#06B6D4" />

          <defs>
            <linearGradient id="sdlc-grad" x1="7" y1="5" x2="33" y2="35" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38BDF8" />
              <stop offset="0.5" stopColor="#6366F1" />
              <stop offset="1" stopColor="#3B82F6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Brand Title */}
      {showText && (
        <span className={`font-black text-lg tracking-wider text-slate-800 leading-none ${textClassName}`}>
          SDLC
        </span>
      )}
    </div>
  );
}
