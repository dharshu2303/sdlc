import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  FolderGit2,
  CheckSquare,
  FileText,
  Users,
  KeyRound,
  Layers,
  History,
  ShieldCheck,
  FileCheck2,
  Shield
} from 'lucide-react';

import AppLogo from './AppLogo';

export default function Sidebar({ activeUser }) {
  const isAdmin = activeUser?.role === 'Admin';

  // Strict Role Separation:
  // Admin ONLY gets System Employee Management & Password Settings
  // Non-Admin employees get SDLC Project Governance Menu
  const navItems = isAdmin
    ? [
        { to: '/admin/users', label: 'Employees', icon: Shield },
        { to: '/settings/password', label: 'Password', icon: KeyRound }
      ]
    : [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/analytics', label: 'Analytics', icon: Compass },
        { to: '/my-work', label: 'My Work', icon: CheckSquare },
        { to: '/projects', label: 'Projects', icon: FolderGit2 },
        { to: '/documents', label: 'Documents', icon: FileText },
        { to: '/approvals', label: 'Approvals', icon: FileCheck2 },
        { to: '/settings/password', label: 'Password', icon: KeyRound },
        { to: '/methodologies', label: 'Methodologies', icon: Layers },
        { to: '/audit', label: 'Audit', icon: History }
      ];

  return (
    <aside className="w-64 bg-white border-r border-blue-100 flex flex-col justify-between h-screen sticky top-0 z-40 shadow-sm">
      <div>
        {/* Brand Logo Header */}
        <div className="h-16 flex items-center px-5 border-b border-blue-100">
          <AppLogo />
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-130px)]">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20'
                      : 'text-blue-700 hover:text-blue-900 hover:bg-blue-50'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-blue-100">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-600">
          <div className="font-semibold text-blue-800">{activeUser?.name || 'User'}</div>
          <div className="text-[11px] text-blue-500 mt-0.5">{activeUser?.role || 'Member'}</div>
        </div>
      </div>
    </aside>
  );
}
