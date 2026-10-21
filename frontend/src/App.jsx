import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import TeamManagementPage from './pages/TeamManagementPage';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import UserDashboard from './pages/UserDashboard';
import ProjectList from './pages/ProjectList';
import ProjectWizard from './pages/ProjectWizard';
import ProjectDetail from './pages/ProjectDetail';
import DocumentRepository from './pages/DocumentRepository';
import DocumentEditor from './pages/DocumentEditor';
import DocumentCompare from './pages/DocumentCompare';
import ApprovalsPage from './pages/ApprovalsPage';

import MethodologyAdmin from './pages/MethodologyAdmin';
import AuditTrail from './pages/AuditTrail';

function MainLayout() {
  const { user, setUser } = useAuth();
  const location = useLocation();

  const activeUser = user || {
    id: 'usr-admin-01',
    email: 'admin@gmail.com',
    name: 'System Administrator',
    role: 'Admin',
    title: 'SDLC System Administrator'
  };

  const isAdmin = activeUser.role === 'Admin';

  // Strict Access Guard Rules:
  // 1. Admin ONLY has Administration access (/admin/users & /settings/password). Redirect to /admin/users if attempting to access project routes.
  if (isAdmin && location.pathname !== '/admin/users' && location.pathname !== '/team/manage' && location.pathname !== '/settings/password') {
    return <Navigate to="/admin/users" replace />;
  }

  // 2. Non-Admin (Project Managers, BAs, TAs, Devs, QAs) CANNOT access System Admin User Provisioning Portal (/admin/users).
  if (!isAdmin && (location.pathname === '/admin/users' || location.pathname === '/team/manage')) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFF] text-slate-800 font-sans">
      <Sidebar activeUser={activeUser} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar activeUser={activeUser} onSwitchUser={setUser} />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            {isAdmin ? (
              <>
                <Route path="/admin/users" element={<TeamManagementPage />} />
                <Route path="/team/manage" element={<TeamManagementPage />} />
                <Route path="/settings/password" element={<ChangePasswordPage />} />
                <Route path="*" element={<Navigate to="/admin/users" replace />} />
              </>
            ) : (
              <>
                <Route path="/dashboard" element={<ExecutiveDashboard activeUser={activeUser} />} />
                <Route path="/analytics" element={<AnalyticsDashboard activeUser={activeUser} />} />
                <Route path="/my-work" element={<UserDashboard activeUser={activeUser} />} />
                <Route path="/projects" element={<ProjectList activeUser={activeUser} />} />
                <Route
                  path="/projects/new"
                  element={
                    activeUser?.role === 'Project Manager'
                      ? <ProjectWizard activeUser={activeUser} />
                      : <Navigate to="/projects" replace />
                  }
                />
                <Route path="/projects/:id" element={<ProjectDetail activeUser={activeUser} />} />
                <Route path="/documents" element={<DocumentRepository activeUser={activeUser} />} />
                <Route path="/documents/:id" element={<DocumentEditor activeUser={activeUser} />} />
                <Route path="/documents/:id/compare" element={<DocumentCompare />} />
                <Route path="/approvals" element={<ApprovalsPage activeUser={activeUser} />} />

                <Route path="/settings/password" element={<ChangePasswordPage />} />
                <Route path="/methodologies" element={<MethodologyAdmin />} />
                <Route path="/audit" element={<AuditTrail />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<MainLayout />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
