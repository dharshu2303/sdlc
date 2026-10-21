import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, KeyRound, LogOut } from 'lucide-react';

export default function RoleSwitcher({ activeUser }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const currentUser = activeUser || { name: 'User', role: 'Member', email: 'user@company.com' };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 hover:border-blue-400 text-xs text-blue-800 transition-all shadow-sm"
      >
        <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[11px]">
          {currentUser.name ? currentUser.name.charAt(0) : 'U'}
        </div>
        <div className="text-left">
          <div className="font-semibold text-blue-800 leading-tight">{currentUser.name}</div>
          <div className="text-[10px] text-blue-500 font-medium">{currentUser.role}</div>
        </div>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-blue-100 rounded-xl shadow-2xl p-3 z-50 space-y-3">
          <div className="pb-2 border-b border-blue-100">
            <div className="font-bold text-blue-800 text-xs">{currentUser.name}</div>
            <div className="text-[11px] text-blue-500 font-mono">{currentUser.email}</div>
            <div className="mt-1 inline-block px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 text-[10px] font-semibold border border-blue-500/20">
              {currentUser.role}
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <button
              onClick={() => {
                setOpen(false);
                navigate('/settings/password');
              }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 text-blue-700 flex items-center gap-2 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-500" />
              <span>Change My Password</span>
            </button>

            <button
              onClick={() => {
                setOpen(false);
                logout();
                navigate('/login');
              }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 hover:text-red-600 text-blue-500 flex items-center gap-2 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-red-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
