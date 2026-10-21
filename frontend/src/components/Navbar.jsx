import React, { useState, useEffect } from 'react';
import { Bell, Search, Plus, Shield } from 'lucide-react';
import RoleSwitcher from './RoleSwitcher';
import { fetchApi } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { hasPermission } from '../utils/rbac';

export default function Navbar({ activeUser, onLogout }) {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const isAdmin = activeUser?.role === 'Admin';

  useEffect(() => {
    if (!isAdmin) {
      fetchApi('/audit/notifications')
        .then(data => setNotifications(data || []))
        .catch(() => setNotifications([]));
    }
  }, [activeUser, isAdmin]);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const canCreate = !isAdmin && activeUser?.role === 'Project Manager';

  return (
    <header className="h-16 bg-white border-b border-blue-100 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Search Input or Admin Title */}
      <div className="flex items-center gap-4 w-96">
        {isAdmin ? (
          <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>System Administration Portal</span>
          </div>
        ) : (
          <div className="relative w-full">
            <Search className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search artifacts, meetings, decisions, phases..."
              className="w-full bg-blue-50 border border-blue-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-blue-800 placeholder-blue-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Create Project Quick CTA - Gated by RBAC (NOT for Admin) */}
        {canCreate && (
          <button
            onClick={() => navigate('/projects/new')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        )}

        {/* User Profile & Sign Out */}
        <RoleSwitcher activeUser={activeUser} onLogout={onLogout} />

        {/* Notifications Drawer Toggle (for non-admin employees) */}
        {!isAdmin && (
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg bg-blue-50 border border-blue-200 hover:border-blue-400 text-blue-600 relative transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-blue-100 rounded-xl shadow-2xl p-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-blue-100 text-xs font-semibold text-blue-800">
                  <span>Notifications ({notifications.length})</span>
                  <button
                    onClick={() => setNotifications(notifications.map(n => ({ ...n, isRead: true })))}
                    className="text-[10px] text-blue-500 hover:underline"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="text-center py-4 text-xs text-blue-400">No new notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                          n.isRead ? 'bg-blue-50/50 border-blue-100 text-blue-500' : 'bg-blue-500/10 border-blue-500/30 text-blue-800'
                        }`}
                        onClick={() => {
                          if (n.linkUrl) navigate(n.linkUrl);
                          setShowNotifications(false);
                        }}
                      >
                        <div className="font-semibold text-blue-800 flex items-center justify-between">
                          <span>{n.title}</span>
                          <span className="text-[9px] text-blue-400">{n.type}</span>
                        </div>
                        <p className="text-[11px] text-blue-600 mt-1 leading-snug">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
