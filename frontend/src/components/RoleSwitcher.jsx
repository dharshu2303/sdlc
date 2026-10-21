import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, KeyRound, Users, ChevronDown, Check } from 'lucide-react';

export default function RoleSwitcher({ activeUser }) {
  const { user, setUser, availableUsers, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const currentUser = activeUser || user || { name: 'User', role: 'Member', email: 'user@company.com' };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 hover:border-blue-400 text-xs text-blue-800 transition-all shadow-sm"
      >
        <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[11px] overflow-hidden">
          {currentUser.avatar ? (
            <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            currentUser.name?.charAt(0) || 'U'
          )}
        </div>
        <div className="text-left">
          <div className="font-semibold text-blue-800 leading-tight">{currentUser.name}</div>
          <div className="text-[10px] text-blue-500 font-medium">{currentUser.role}</div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 z-50 space-y-3 animate-in fade-in zoom-in-95 duration-100">
          {/* Current User Card */}
          <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-100">
            <div className="font-bold text-blue-900 text-xs">{currentUser.name}</div>
            <div className="text-[11px] text-blue-600 font-mono">{currentUser.email}</div>
            <div className="mt-1 inline-block px-2 py-0.5 rounded bg-blue-200/60 text-blue-800 text-[10px] font-bold">
              {currentUser.role}
            </div>
          </div>

          {/* Quick Role Switcher List */}
          {availableUsers && availableUsers.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1">
                <Users className="w-3 h-3" /> Quick Switch Active Role
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                {availableUsers.map(u => {
                  const isCurrent = u.id === currentUser.id || u.email === currentUser.email;
                  return (
                    <button
                      key={u.id || u.email}
                      onClick={() => {
                        setUser(u);
                        setOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        isCurrent
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="truncate font-medium">{u.name}</div>
                        <div className={`text-[10px] ${isCurrent ? 'text-blue-100' : 'text-slate-400'}`}>
                          {u.role}
                        </div>
                      </div>
                      {isCurrent && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-1 text-xs pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                setOpen(false);
                navigate('/settings/password');
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-2 transition-colors"
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
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-50 text-red-600 flex items-center gap-2 transition-colors"
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
