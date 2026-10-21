// In-Memory Database Store for SDLC Governance Platform
// Clean slate — Admin-only bootstrap. All data created by Admin at runtime.

const store = {
  organization: [],

  users: [
    {
      id: 'usr-admin-01',
      email: 'admin@gmail.com',
      password: 'admin123',
      isDefaultPassword: false,
      name: 'System Administrator',
      role: 'Admin',
      title: 'SDLC System Administrator',
      systemRole: 'SUPER_ADMIN',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
    }
  ],

  methodologies: [
    {
      id: 'meth-waterfall',
      name: 'Waterfall',
      code: 'Waterfall',
      description: 'Structured sequential lifecycle with formal phase-gate approvals.',
      isSystem: true,
      phases: [
        { id: 'mp-w1', methodologyId: 'meth-waterfall', name: 'Planning', sequence: 1, description: 'Project kickoff & feasibility' },
        { id: 'mp-w2', methodologyId: 'meth-waterfall', name: 'Requirements', sequence: 2, description: 'SRS, Use Cases, RTM' },
        { id: 'mp-w3', methodologyId: 'meth-waterfall', name: 'Design', sequence: 3, description: 'HLD, LLD, Database Schema' },
        { id: 'mp-w4', methodologyId: 'meth-waterfall', name: 'Development', sequence: 4, description: 'Technical specs & Release Notes' },
        { id: 'mp-w5', methodologyId: 'meth-waterfall', name: 'Testing', sequence: 5, description: 'Test Strategy, Test Plan & Bug Reports' },
        { id: 'mp-w6', methodologyId: 'meth-waterfall', name: 'Deployment', sequence: 6, description: 'Deployment plan & Operational readiness' },
        { id: 'mp-w7', methodologyId: 'meth-waterfall', name: 'Maintenance', sequence: 7, description: 'Change requests & Impact analysis' }
      ],
      requiredArtifacts: [
        // 1. Planning
        { id: 'ma-w1', methodologyId: 'meth-waterfall', phaseName: 'Planning', artifactType: 'ProjectPlan', name: 'Project Management Plan', ownerRole: 'Project Manager', reviewerRoles: '["Technical Architect"]', approverRoles: '["Client Representative"]', consumerRoles: '["Team Lead"]', isRequired: true, blocksPhase: true },
        { id: 'ma-w2', methodologyId: 'meth-waterfall', phaseName: 'Planning', artifactType: 'Charter', name: 'Project Charter', ownerRole: 'Project Manager', reviewerRoles: '["Business Analyst"]', approverRoles: '["Client Representative"]', consumerRoles: '["Team Lead"]', isRequired: true, blocksPhase: false },
        { id: 'ma-w2b', methodologyId: 'meth-waterfall', phaseName: 'Planning', artifactType: 'RiskRegister', name: 'Risk Register & Mitigation Matrix', ownerRole: 'Project Manager', reviewerRoles: '["Technical Architect"]', approverRoles: '["Project Manager"]', consumerRoles: '["Team Lead"]', isRequired: true, blocksPhase: false },
        { id: 'ma-w3', methodologyId: 'meth-waterfall', phaseName: 'Planning', artifactType: 'Feasibility Study', name: 'Feasibility Study', ownerRole: 'Business Analyst', reviewerRoles: '["Technical Architect"]', approverRoles: '["Project Manager"]', consumerRoles: '["Team Lead"]', isRequired: false, blocksPhase: false },

        // 2. Requirements
        { id: 'ma-w4', methodologyId: 'meth-waterfall', phaseName: 'Requirements', artifactType: 'SRS', name: 'Software Requirements Specification (SRS)', ownerRole: 'Business Analyst', reviewerRoles: '["Technical Architect", "Team Lead"]', approverRoles: '["Project Manager", "Client Representative"]', consumerRoles: '["Developer", "Tester / QA"]', isRequired: true, blocksPhase: true },
        { id: 'ma-w5', methodologyId: 'meth-waterfall', phaseName: 'Requirements', artifactType: 'BRD', name: 'Business Requirements Document (BRD)', ownerRole: 'Business Analyst', reviewerRoles: '["Project Manager"]', approverRoles: '["Client Representative"]', consumerRoles: '["Technical Architect"]', isRequired: true, blocksPhase: false },
        { id: 'ma-w6', methodologyId: 'meth-waterfall', phaseName: 'Requirements', artifactType: 'RTM', name: 'Requirement Traceability Matrix (RTM)', ownerRole: 'Business Analyst', reviewerRoles: '["Tester / QA"]', approverRoles: '["Project Manager"]', consumerRoles: '["Developer"]', isRequired: true, blocksPhase: true },
        { id: 'ma-w7', methodologyId: 'meth-waterfall', phaseName: 'Requirements', artifactType: 'Use Cases', name: 'Use Cases & User Scenarios', ownerRole: 'Business Analyst', reviewerRoles: '["Team Lead"]', approverRoles: '["Project Manager"]', consumerRoles: '["Developer", "Tester / QA"]', isRequired: false, blocksPhase: false },

        // 3. Design
        { id: 'ma-w8', methodologyId: 'meth-waterfall', phaseName: 'Design', artifactType: 'HLD', name: 'High-Level Design (HLD)', ownerRole: 'Technical Architect', reviewerRoles: '["Team Lead"]', approverRoles: '["Project Manager", "Client Representative"]', consumerRoles: '["Developer", "Tester / QA"]', isRequired: true, blocksPhase: true },
        { id: 'ma-w9', methodologyId: 'meth-waterfall', phaseName: 'Design', artifactType: 'LLD', name: 'Low-Level Design (LLD)', ownerRole: 'Team Lead', reviewerRoles: '["Technical Architect"]', approverRoles: '["Team Lead"]', consumerRoles: '["Developer"]', isRequired: true, blocksPhase: true },
        { id: 'ma-w10', methodologyId: 'meth-waterfall', phaseName: 'Design', artifactType: 'Database Design', name: 'Database Schema & Architecture', ownerRole: 'Database Administrator', reviewerRoles: '["Technical Architect"]', approverRoles: '["Technical Architect"]', consumerRoles: '["Developer"]', isRequired: true, blocksPhase: false },
        { id: 'ma-w11', methodologyId: 'meth-waterfall', phaseName: 'Design', artifactType: 'UI/UX Design', name: 'UI/UX Design Spec & Wireframes', ownerRole: 'UI/UX Designer', reviewerRoles: '["Business Analyst"]', approverRoles: '["Project Manager"]', consumerRoles: '["Developer"]', isRequired: false, blocksPhase: false },

        // 4. Development
        { id: 'ma-w12', methodologyId: 'meth-waterfall', phaseName: 'Development', artifactType: 'Technical Documentation', name: 'Technical Architecture Spec', ownerRole: 'Developer', reviewerRoles: '["Technical Architect"]', approverRoles: '["Team Lead"]', consumerRoles: '["Tester / QA"]', isRequired: true, blocksPhase: true },
        { id: 'ma-w13', methodologyId: 'meth-waterfall', phaseName: 'Development', artifactType: 'API Documentation', name: 'API Spec (OpenAPI/Swagger)', ownerRole: 'Developer', reviewerRoles: '["Technical Architect"]', approverRoles: '["Team Lead"]', consumerRoles: '["Developer", "Tester / QA"]', isRequired: true, blocksPhase: false },
        { id: 'ma-w14', methodologyId: 'meth-waterfall', phaseName: 'Development', artifactType: 'Development Progress Report', name: 'Development Progress Report', ownerRole: 'Team Lead', reviewerRoles: '["Project Manager"]', approverRoles: '["Project Manager"]', consumerRoles: '["Client Representative"]', isRequired: false, blocksPhase: false },
        { id: 'ma-w15', methodologyId: 'meth-waterfall', phaseName: 'Development', artifactType: 'Integration Notes', name: 'Integration Notes', ownerRole: 'Developer', reviewerRoles: '["Team Lead"]', approverRoles: '["Team Lead"]', consumerRoles: '["Tester / QA"]', isRequired: false, blocksPhase: false },

        // 5. Testing
        { id: 'ma-w16', methodologyId: 'meth-waterfall', phaseName: 'Testing', artifactType: 'TestPlan', name: 'System Test Plan & Strategy', ownerRole: 'Tester / QA', reviewerRoles: '["Team Lead"]', approverRoles: '["Project Manager"]', consumerRoles: '["Developer", "Business Analyst"]', isRequired: true, blocksPhase: true },
        { id: 'ma-w17', methodologyId: 'meth-waterfall', phaseName: 'Testing', artifactType: 'Test Cases', name: 'Test Cases & Automation Suite', ownerRole: 'Tester / QA', reviewerRoles: '["Team Lead"]', approverRoles: '["Team Lead"]', consumerRoles: '["Developer"]', isRequired: true, blocksPhase: false },
        { id: 'ma-w18', methodologyId: 'meth-waterfall', phaseName: 'Testing', artifactType: 'Bug Report', name: 'Bug & Defect Report', ownerRole: 'Tester / QA', reviewerRoles: '["Team Lead"]', approverRoles: '["Team Lead"]', consumerRoles: '["Developer"]', isRequired: true, blocksPhase: false },
        { id: 'ma-w19', methodologyId: 'meth-waterfall', phaseName: 'Testing', artifactType: 'Test Summary Report', name: 'Test Summary & QA Signoff', ownerRole: 'Tester / QA', reviewerRoles: '["Project Manager"]', approverRoles: '["Project Manager"]', consumerRoles: '["Client Representative"]', isRequired: true, blocksPhase: true },

        // 6. Deployment
        { id: 'ma-w20', methodologyId: 'meth-waterfall', phaseName: 'Deployment', artifactType: 'Deployment Plan', name: 'Deployment & Rollout Runbook', ownerRole: 'Technical Architect', reviewerRoles: '["Team Lead"]', approverRoles: '["Project Manager"]', consumerRoles: '["Developer"]', isRequired: true, blocksPhase: true },
        { id: 'ma-w21', methodologyId: 'meth-waterfall', phaseName: 'Deployment', artifactType: 'Release Notes', name: 'Deployment Release Notes', ownerRole: 'Team Lead', reviewerRoles: '["Project Manager"]', approverRoles: '["Client Representative"]', consumerRoles: '["Client Representative"]', isRequired: true, blocksPhase: false },
        { id: 'ma-w22', methodologyId: 'meth-waterfall', phaseName: 'Deployment', artifactType: 'User Manual', name: 'User Manual & Admin Guide', ownerRole: 'Business Analyst', reviewerRoles: '["Team Lead"]', approverRoles: '["Project Manager"]', consumerRoles: '["Client Representative"]', isRequired: false, blocksPhase: false },

        // 7. Maintenance
        { id: 'ma-w23', methodologyId: 'meth-waterfall', phaseName: 'Maintenance', artifactType: 'Change Request', name: 'Change Request (CR)', ownerRole: 'Business Analyst', reviewerRoles: '["Technical Architect"]', approverRoles: '["Project Manager"]', consumerRoles: '["Team Lead"]', isRequired: false, blocksPhase: false },
        { id: 'ma-w24', methodologyId: 'meth-waterfall', phaseName: 'Maintenance', artifactType: 'Incident Report', name: 'Incident & Post-Mortem Report', ownerRole: 'Team Lead', reviewerRoles: '["Project Manager"]', approverRoles: '["Project Manager"]', consumerRoles: '["Client Representative"]', isRequired: false, blocksPhase: false },
        { id: 'ma-w25', methodologyId: 'meth-waterfall', phaseName: 'Maintenance', artifactType: 'Change Impact Analysis', name: 'Change Impact Analysis', ownerRole: 'Technical Architect', reviewerRoles: '["Team Lead"]', approverRoles: '["Project Manager"]', consumerRoles: '["Developer"]', isRequired: false, blocksPhase: false },
        { id: 'ma-w26', methodologyId: 'meth-waterfall', phaseName: 'Maintenance', artifactType: 'Maintenance Report', name: 'Maintenance & SLA Report', ownerRole: 'Team Lead', reviewerRoles: '["Project Manager"]', approverRoles: '["Project Manager"]', consumerRoles: '["Client Representative"]', isRequired: false, blocksPhase: false }
      ]
    },
    {
      id: 'meth-scrum',
      name: 'Scrum / Agile',
      code: 'Scrum',
      description: 'Iterative sprint-based lifecycle with recurring documentation cycles across 8 agile stages.',
      isSystem: true,
      phases: [
        { id: 'mp-s1', methodologyId: 'meth-scrum', name: 'Initiation / Planning', sequence: 1, description: 'Define project vision and scope (Product Vision, Roadmap)' },
        { id: 'mp-s2', methodologyId: 'meth-scrum', name: 'Requirements / Backlog', sequence: 2, description: 'Gather and prioritize requirements (Product Backlog, Epics, User Stories)' },
        { id: 'mp-s3', methodologyId: 'meth-scrum', name: 'Sprint Planning', sequence: 3, description: 'Plan the upcoming iteration (Sprint Goal, Sprint Backlog)' },
        { id: 'mp-s4', methodologyId: 'meth-scrum', name: 'Sprint Execution', sequence: 4, description: 'Build the product increment (Design Docs, Technical Docs)' },
        { id: 'mp-s5', methodologyId: 'meth-scrum', name: 'Testing', sequence: 5, description: 'Validate the increment (Test Cases, Bug Reports, Test Results)' },
        { id: 'mp-s6', methodologyId: 'meth-scrum', name: 'Sprint Review', sequence: 6, description: 'Review completed work with stakeholders (Review Notes, Feedback)' },
        { id: 'mp-s7', methodologyId: 'meth-scrum', name: 'Retrospective', sequence: 7, description: 'Improve the team\'s process (Retrospective Notes, Action Items)' },
        { id: 'mp-s8', methodologyId: 'meth-scrum', name: 'Release / Deployment', sequence: 8, description: 'Release the increment (Release Notes, Deployment Record)' }
      ],
      requiredArtifacts: [
        { id: 'ma-s1', methodologyId: 'meth-scrum', phaseName: 'Initiation / Planning', artifactType: 'Vision', name: 'Product Vision', ownerRole: 'Project Manager', reviewerRoles: '["Client Representative"]', approverRoles: '["Client Representative"]', consumerRoles: '["Developer", "Team Lead"]', isRequired: true, blocksPhase: true },
        { id: 'ma-s2', methodologyId: 'meth-scrum', phaseName: 'Initiation / Planning', artifactType: 'Roadmap', name: 'Product Roadmap', ownerRole: 'Project Manager', reviewerRoles: '["Client Representative"]', approverRoles: '["Client Representative"]', consumerRoles: '["Developer", "Business Analyst"]', isRequired: true, blocksPhase: true },
        { id: 'ma-s3', methodologyId: 'meth-scrum', phaseName: 'Requirements / Backlog', artifactType: 'Backlog', name: 'Product Backlog', ownerRole: 'Business Analyst', reviewerRoles: '["Project Manager"]', approverRoles: '["Client Representative"]', consumerRoles: '["Developer"]', isRequired: true, blocksPhase: true },
        { id: 'ma-s4', methodologyId: 'meth-scrum', phaseName: 'Requirements / Backlog', artifactType: 'UserStory', name: 'User Stories & Acceptance Criteria', ownerRole: 'Business Analyst', reviewerRoles: '["Project Manager"]', approverRoles: '["Project Manager"]', consumerRoles: '["Developer", "Tester / QA"]', isRequired: true, blocksPhase: true },
        { id: 'ma-s5', methodologyId: 'meth-scrum', phaseName: 'Sprint Planning', artifactType: 'SprintGoal', name: 'Sprint Goal', ownerRole: 'Project Manager', reviewerRoles: '["Team Lead"]', approverRoles: '["Project Manager"]', consumerRoles: '["Developer"]', isRequired: true, blocksPhase: true },
        { id: 'ma-s6', methodologyId: 'meth-scrum', phaseName: 'Sprint Planning', artifactType: 'SprintBacklog', name: 'Sprint Backlog', ownerRole: 'Team Lead', reviewerRoles: '["Project Manager"]', approverRoles: '["Team Lead"]', consumerRoles: '["Developer"]', isRequired: true, blocksPhase: true },
        { id: 'ma-s7', methodologyId: 'meth-scrum', phaseName: 'Sprint Execution', artifactType: 'Design', name: 'Design Docs & Wireframes', ownerRole: 'UI/UX Designer', reviewerRoles: '["Technical Architect"]', approverRoles: '["Team Lead"]', consumerRoles: '["Developer"]', isRequired: true, blocksPhase: true },
        { id: 'ma-s8', methodologyId: 'meth-scrum', phaseName: 'Sprint Execution', artifactType: 'Technical', name: 'Technical Docs', ownerRole: 'Developer', reviewerRoles: '["Technical Architect"]', approverRoles: '["Team Lead"]', consumerRoles: '["Tester / QA"]', isRequired: true, blocksPhase: true },
        { id: 'ma-s9', methodologyId: 'meth-scrum', phaseName: 'Testing', artifactType: 'TestCases', name: 'Test Cases', ownerRole: 'Tester / QA', reviewerRoles: '["Team Lead"]', approverRoles: '["Team Lead"]', consumerRoles: '["Developer"]', isRequired: true, blocksPhase: true },
        { id: 'ma-s10', methodologyId: 'meth-scrum', phaseName: 'Testing', artifactType: 'BugReport', name: 'Bug Reports', ownerRole: 'Tester / QA', reviewerRoles: '["Team Lead"]', approverRoles: '["Team Lead"]', consumerRoles: '["Developer"]', isRequired: true, blocksPhase: true },
        { id: 'ma-s11', methodologyId: 'meth-scrum', phaseName: 'Testing', artifactType: 'TestSummary', name: 'Test Results', ownerRole: 'Tester / QA', reviewerRoles: '["Project Manager"]', approverRoles: '["Project Manager"]', consumerRoles: '["Client Representative"]', isRequired: true, blocksPhase: true },
        { id: 'ma-s12', methodologyId: 'meth-scrum', phaseName: 'Sprint Review', artifactType: 'ReviewNotes', name: 'Sprint Review Notes', ownerRole: 'Project Manager', reviewerRoles: '["Client Representative"]', approverRoles: '["Client Representative"]', consumerRoles: '["Developer"]', isRequired: true, blocksPhase: true },
        { id: 'ma-s13', methodologyId: 'meth-scrum', phaseName: 'Sprint Review', artifactType: 'Feedback', name: 'Stakeholder Feedback', ownerRole: 'Project Manager', reviewerRoles: '["Client Representative"]', approverRoles: '["Client Representative"]', consumerRoles: '["Business Analyst"]', isRequired: true, blocksPhase: true },
        { id: 'ma-s14', methodologyId: 'meth-scrum', phaseName: 'Retrospective', artifactType: 'RetroNotes', name: 'Retrospective Notes', ownerRole: 'Project Manager', reviewerRoles: '["Team Lead"]', approverRoles: '["Project Manager"]', consumerRoles: '["Developer"]', isRequired: true, blocksPhase: true },
        { id: 'ma-s15', methodologyId: 'meth-scrum', phaseName: 'Retrospective', artifactType: 'ActionPlan', name: 'Improvement Action Items', ownerRole: 'Team Lead', reviewerRoles: '["Project Manager"]', approverRoles: '["Project Manager"]', consumerRoles: '["Developer"]', isRequired: true, blocksPhase: true },
        { id: 'ma-s16', methodologyId: 'meth-scrum', phaseName: 'Release / Deployment', artifactType: 'ReleaseNotes', name: 'Release Notes', ownerRole: 'Project Manager', reviewerRoles: '["Client Representative"]', approverRoles: '["Client Representative"]', consumerRoles: '["Developer", "Client Representative"]', isRequired: true, blocksPhase: true },
        { id: 'ma-s17', methodologyId: 'meth-scrum', phaseName: 'Release / Deployment', artifactType: 'DeploymentPlan', name: 'Deployment Record', ownerRole: 'Technical Architect', reviewerRoles: '["Project Manager"]', approverRoles: '["Project Manager"]', consumerRoles: '["Developer"]', isRequired: true, blocksPhase: true }
      ]
    }
  ],

  projects: [],
  projectMembers: [],
  phases: [],
  artifacts: [],
  versions: [],
  reviewers: [],
  approvers: [],
  meetings: [],
  decisions: [],
  actionItems: [],
  traceabilityLinks: [],
  auditLogs: [
    {
      id: 'aud-seed-01',
      projectId: 'proj-sdlc-01',
      entityType: 'Artifact',
      entityId: 'art-charter-01',
      action: 'EXECUTIVE_APPROVED',
      userId: 'usr-pm-01',
      userName: 'Project Manager',
      userRole: 'Project Manager',
      documentTitle: 'Project Charter',
      details: 'Project Manager (Project Manager) granted formal executive approval for "Project Charter". Status updated to Approved.',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    {
      id: 'aud-seed-02',
      projectId: 'proj-sdlc-01',
      entityType: 'Artifact',
      entityId: 'art-charter-01',
      action: 'REVIEW_APPROVED',
      userId: 'usr-ta-01',
      userName: 'Technical Architect',
      userRole: 'Technical Architect',
      documentTitle: 'Project Charter',
      details: 'Technical Architect (Technical Architect) signed off technical review for "Project Charter". Note: "All technical feasibility criteria approved."',
      createdAt: new Date(Date.now() - 3600000 * 6).toISOString()
    },
    {
      id: 'aud-seed-03',
      projectId: 'proj-sdlc-01',
      entityType: 'Artifact',
      entityId: 'art-charter-01',
      action: 'DOCUMENT_SUBMITTED',
      userId: 'usr-pm-01',
      userName: 'Project Manager',
      userRole: 'Project Manager',
      documentTitle: 'Project Charter',
      details: 'Project Manager (Project Manager) uploaded and submitted "Project Charter" (v1.0) for technical review.',
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
    }
  ],
  notifications: []
};

module.exports = store;
