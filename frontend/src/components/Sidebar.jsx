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
  FileCheck2,
  Shield,
  Scale
} from 'lucide-react';

import AppLogo from './AppLogo';

export default function Sidebar({ activeUser }) {
  const isAdmin = activeUser?.role === 'Admin';
  const isManager = activeUser?.role === 'Project Manager' || isAdmin;

  // Unified Navigation Items
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/analytics', label: 'Analytics', icon: Compass },
    { to: '/my-work', label: 'My Work', icon: CheckSquare },
    { to: '/projects', label: 'Projects', icon: FolderGit2 },
    { to: '/documents', label: 'Documents', icon: FileText },
    { to: '/disputes', label: 'Disputes Center', icon: Scale, badge: 'New' },
    { to: '/approvals', label: 'Approvals', icon: FileCheck2 },
    ...(isManager ? [{ to: '/admin/users', label: 'Team & Credentials', icon: Shield, badge: 'PM' }] : []),
    { to: '/methodologies', label: 'Methodologies', icon: Layers },
    { to: '/audit', label: 'Audit Trail', icon: History },
    { to: '/settings/password', label: 'Change Password', icon: KeyRound }
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
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20'
                      : 'text-slate-700 hover:text-blue-900 hover:bg-blue-50'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700">
                    {item.badge}
                  </span>
                )}
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
