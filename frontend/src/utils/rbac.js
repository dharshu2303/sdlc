// Role-Based Access Control (RBAC) Permission Matrix & Utilities
import { getAllDocumentTypes } from '../config/docRaci';

export const ROLE_PERMISSIONS = {
  'Admin': {
    canCreateProject: false,
    canManageTeam: true, // Account Administration Only
    canEditMethodology: false,
    canOverridePhaseGate: false,
    canCreateArtifact: false,
    canEditArtifact: false,
    canApproveDocument: false,
    canReviewTechnical: false,
    canScheduleMeeting: false,
    canLogDecision: false,
    canViewAudit: true,
    canViewAnalytics: false,
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
    description: 'System Administrator: Account Provisioning & System User Management Only'
  },

  'Project Manager': {
    canCreateProject: true,
    canManageTeam: false,
    canEditMethodology: true,
    canOverridePhaseGate: true,
    canCreateArtifact: true,
    canEditArtifact: true,
    allowedArtifactTypes: ['ProjectPlan', 'Charter', 'Plan', 'Feasibility', 'ProductVision', 'Vision', 'Roadmap', 'Backlog', 'ProductBacklog', 'SprintGoal', 'ReviewNotes', 'RetroNotes', 'ReleaseNotes'],
    canApproveDocument: true,
    canReviewTechnical: true,
    canScheduleMeeting: true,
    canLogDecision: true,
    canViewAudit: true,
    canViewAnalytics: true,
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    description: 'Project Leadership: Manage Projects, Phases, Approvals & SDLC Governance'
  },

  'Business Analyst': {
    canCreateProject: false,
    canManageTeam: false,
    canEditMethodology: false,
    canOverridePhaseGate: false,
    canCreateArtifact: true,
    canEditArtifact: true,
    allowedArtifactTypes: ['SRS', 'BRD', 'RTM', 'UseCases', 'UseCase', 'UserStory', 'Epic', 'Backlog', 'AcceptanceCriteria', 'ProductBacklog', 'ImpactAnalysis'],
    canApproveDocument: false,
    canReviewTechnical: false,
    canScheduleMeeting: true,
    canLogDecision: true,
    canViewAudit: true,
    canViewAnalytics: true,
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    description: 'Author & Maintain Requirements, Use Cases, RTM, User Stories & Epics'
  },

  'Technical Architect': {
    canCreateProject: false,
    canManageTeam: false,
    canEditMethodology: false,
    canOverridePhaseGate: false,
    canCreateArtifact: true,
    canEditArtifact: true,
    allowedArtifactTypes: ['HLD', 'ArchitectureDoc', 'APISpec', 'SecuritySpec', 'DeploymentPlan', 'DeploymentRecord', 'Database Design', 'DBDesign'],
    canApproveDocument: true,
    canReviewTechnical: true,
    canScheduleMeeting: true,
    canLogDecision: true,
    canViewAudit: true,
    canViewAnalytics: true,
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    description: 'Author HLD Architecture, Deployment Records, Conduct Technical Reviews & Signoffs'
  },

  'Team Lead': {
    canCreateProject: false,
    canManageTeam: false,
    canEditMethodology: false,
    canOverridePhaseGate: false,
    canCreateArtifact: true,
    canEditArtifact: true,
    allowedArtifactTypes: ['LLD', 'TechSpec', 'DevNotes', 'ReleaseNotes', 'SprintBacklog', 'ProgressReport', 'IncidentReport', 'ActionPlan', 'DeploymentPlan'],
    canApproveDocument: true,
    canReviewTechnical: true,
    canScheduleMeeting: true,
    canLogDecision: false,
    canViewAudit: true,
    canViewAnalytics: true,
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    description: 'Author Low-Level Design, Sprint Backlog, Dev Reviews & Technical Specs'
  },

  'Developer': {
    canCreateProject: false,
    canManageTeam: false,
    canEditMethodology: false,
    canOverridePhaseGate: false,
    canCreateArtifact: true,
    canEditArtifact: true,
    allowedArtifactTypes: ['Technical Documentation', 'Technical', 'API Documentation', 'API', 'IntegrationNotes', 'ProgressReport', 'LLD'],
    canApproveDocument: false,
    canReviewTechnical: false,
    canScheduleMeeting: false,
    canLogDecision: false,
    canViewAudit: false,
    canViewAnalytics: false,
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    description: 'Author Technical Documentation, API Specifications & Integration Notes'
  },

  'Tester / QA': {
    canCreateProject: false,
    canManageTeam: false,
    canEditMethodology: false,
    canOverridePhaseGate: false,
    canCreateArtifact: true,
    canEditArtifact: true,
    allowedArtifactTypes: ['TestPlan', 'TestCase', 'TestCases', 'TestStrategy', 'BugReport', 'TestSummary', 'Bug & Defect Report', 'Test Results'],
    canApproveDocument: false,
    canReviewTechnical: true,
    canScheduleMeeting: false,
    canLogDecision: false,
    canViewAudit: true,
    canViewAnalytics: true,
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    description: 'Author Test Plans, Test Cases, Bug Reports, Test Results & Quality Signoffs'
  },

  'UI/UX Designer': {
    canCreateProject: false,
    canManageTeam: false,
    canEditMethodology: false,
    canOverridePhaseGate: false,
    canCreateArtifact: true,
    canEditArtifact: true,
    allowedArtifactTypes: ['UI/UX Design', 'UIDesign', 'Design', 'Design Docs & Wireframes', 'Wireframes'],
    canApproveDocument: false,
    canReviewTechnical: false,
    canScheduleMeeting: false,
    canLogDecision: false,
    canViewAudit: false,
    canViewAnalytics: false,
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
    description: 'Author Wireframes, Design System Tokens & UI/UX Interaction Specs'
  },

  'Database Administrator': {
    canCreateProject: false,
    canManageTeam: false,
    canEditMethodology: false,
    canOverridePhaseGate: false,
    canCreateArtifact: true,
    canEditArtifact: true,
    allowedArtifactTypes: ['Database Design', 'DBDesign', 'SchemaSpec', 'Database Schema'],
    canApproveDocument: false,
    canReviewTechnical: true,
    canScheduleMeeting: false,
    canLogDecision: false,
    canViewAudit: false,
    canViewAnalytics: false,
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    description: 'Author Database Schema Blueprints, ER Diagrams & Storage Architecture'
  },

  'Client Representative': {
    canCreateProject: false,
    canManageTeam: false,
    canEditMethodology: false,
    canOverridePhaseGate: false,
    canCreateArtifact: false,
    canEditArtifact: false,
    allowedArtifactTypes: [],
    canApproveDocument: true,
    canReviewTechnical: false,
    canScheduleMeeting: true,
    canLogDecision: true,
    canViewAudit: true,
    canViewAnalytics: true,
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    description: 'Client Representative / Stakeholder: Review & Approve Deliverables, View & Download Specs'
  },

  'Auditor': {
    canCreateProject: false,
    canManageTeam: false,
    canEditMethodology: false,
    canOverridePhaseGate: false,
    canCreateArtifact: false,
    canEditArtifact: false,
    allowedArtifactTypes: [],
    canApproveDocument: false,
    canReviewTechnical: false,
    canScheduleMeeting: false,
    canLogDecision: false,
    canViewAudit: true,
    canViewAnalytics: true,
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
    description: 'Strict Read-Only Auditor Access: Audit Trail, Governance Reports & Phase Gates'
  }
};

export function hasPermission(roleName, permissionKey) {
  const roleConfig = ROLE_PERMISSIONS[roleName] || ROLE_PERMISSIONS['Developer'];
  return !!roleConfig[permissionKey];
}

export function canEditArtifactType(roleName, artifactType, artifactTitle = '') {
  if (!roleName || roleName === 'Admin') return false;
  if (roleName === 'Project Manager') return true;

  const roleConfig = ROLE_PERMISSIONS[roleName];
  if (!roleConfig) return false;

  const allowed = (roleConfig.allowedArtifactTypes || []).map(t => t.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const normalizedType = (artifactType || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizedTitle = (artifactTitle || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  if (allowed.some(t => normalizedType.includes(t) || t.includes(normalizedType))) {
    return true;
  }
  if (artifactTitle && allowed.some(t => normalizedTitle.includes(t) || t.includes(normalizedTitle))) {
    return true;
  }

  // Check RACI owner match
  try {
    const allDocs = getAllDocumentTypes();
    const matchedDoc = allDocs.find(
      d => d.type === artifactType ||
           d.name.toLowerCase() === (artifactType || '').toLowerCase() ||
           (artifactTitle && d.name.toLowerCase() === artifactTitle.toLowerCase())
    );
    if (matchedDoc && matchedDoc.owner) {
      const owners = matchedDoc.owner.split(/[/+,]/).map(s => s.trim().toLowerCase());
      return owners.some(o => o.includes(roleName.toLowerCase()) || roleName.toLowerCase().includes(o));
    }
  } catch (e) {
    // fallback
  }

  return false;
}
