const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SDLC Governance Platform Database...');

  // Clean existing tables
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.traceabilityLink.deleteMany();
  await prisma.actionItem.deleteMany();
  await prisma.decision.deleteMany();
  await prisma.meetingParticipant.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.artifactApprover.deleteMany();
  await prisma.artifactReviewer.deleteMany();
  await prisma.artifactVersion.deleteMany();
  await prisma.artifact.deleteMany();
  await prisma.phaseGate.deleteMany();
  await prisma.phase.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.methodologyArtifact.deleteMany();
  await prisma.methodologyPhase.deleteMany();
  await prisma.methodology.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // 1. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Global Financial Solutions Inc.',
      code: 'GFS-ORG-01'
    }
  });

  const passwordHash = await bcrypt.hash('password123', 10);

  // 2. Create Users (Demo Roles)
  const usersData = [
    { id: 'usr-pm-01', email: 'john.pm@bankgov.com', name: 'John Smith', title: 'Senior Project Manager', systemRole: 'ADMIN', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' },
    { id: 'usr-ba-01', email: 'sarah.ba@bankgov.com', name: 'Sarah Wilson', title: 'Lead Business Analyst', systemRole: 'MEMBER', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
    { id: 'usr-ta-01', email: 'david.ta@bankgov.com', name: 'David Brown', title: 'Principal Technical Architect', systemRole: 'MEMBER', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David' },
    { id: 'usr-tl-01', email: 'mike.tl@bankgov.com', name: 'Mike Johnson', title: 'Development Team Lead', systemRole: 'MEMBER', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike' },
    { id: 'usr-dev-01', email: 'alex.dev@bankgov.com', name: 'Alex Carter', title: 'Senior Fullstack Developer', systemRole: 'MEMBER', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
    { id: 'usr-ux-01', email: 'emma.ux@bankgov.com', name: 'Emma Davis', title: 'Lead UI/UX Designer', systemRole: 'MEMBER', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma' },
    { id: 'usr-qa-01', email: 'robert.qa@bankgov.com', name: 'Robert Miller', title: 'QA & Test Lead', systemRole: 'MEMBER', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert' },
    { id: 'usr-dba-01', email: 'daniel.dba@bankgov.com', name: 'Daniel Wilson', title: 'Database Administrator', systemRole: 'MEMBER', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Daniel' },
    { id: 'usr-client-01', email: 'client@abcbank.com', name: 'ABC Bank Representative', title: 'Client Product Owner', systemRole: 'MEMBER', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ABCClient' }
  ];

  for (const u of usersData) {
    await prisma.user.create({
      data: {
        ...u,
        password: passwordHash,
        orgId: org.id
      }
    });
  }

  // 3. Create Methodologies
  // Waterfall
  const waterfall = await prisma.methodology.create({
    data: {
      name: 'Waterfall',
      code: 'Waterfall',
      description: 'Structured sequential lifecycle with formal phase-gate approvals.',
      isSystem: true,
      phases: {
        create: [
          { name: 'Planning', sequence: 1, description: 'Project kickoff, business feasibility & planning docs' },
          { name: 'Requirements', sequence: 2, description: 'SRS, Use Cases, Acceptance Criteria, RTM' },
          { name: 'Design', sequence: 3, description: 'HLD, LLD, Database schema, API specification' },
          { name: 'Development', sequence: 4, description: 'Technical specs, release notes, deployment plans' },
          { name: 'Testing', sequence: 5, description: 'Test Strategy, Test Plan, Test Cases, Bug Reports' },
          { name: 'Deployment', sequence: 6, description: 'Deployment checklist, operational readiness' },
          { name: 'Maintenance', sequence: 7, description: 'Change requests, impact analysis records' }
        ]
      },
      requiredArtifacts: {
        create: [
          { phaseName: 'Planning', artifactType: 'ProjectPlan', name: 'Project Management Plan', ownerRole: 'Project Manager', reviewerRoles: '["Technical Architect"]', approverRoles: '["Client"]', consumerRoles: '["Team Lead"]', isRequired: true, blocksPhase: true },
          { phaseName: 'Requirements', artifactType: 'SRS', name: 'Software Requirements Specification (SRS)', ownerRole: 'Business Analyst', reviewerRoles: '["Technical Architect", "Development Team Lead"]', approverRoles: '["Project Manager", "Client"]', consumerRoles: '["Developer", "QA"]', isRequired: true, blocksPhase: true },
          { phaseName: 'Requirements', artifactType: 'RTM', name: 'Requirement Traceability Matrix (RTM)', ownerRole: 'Business Analyst', reviewerRoles: '["QA"]', approverRoles: '["Project Manager"]', consumerRoles: '["Developer"]', isRequired: true, blocksPhase: true },
          { phaseName: 'Design', artifactType: 'HLD', name: 'High-Level Design (HLD)', ownerRole: 'Technical Architect', reviewerRoles: '["Development Team Lead"]', approverRoles: '["Project Manager", "Client"]', consumerRoles: '["Developer", "QA"]', isRequired: true, blocksPhase: true },
          { phaseName: 'Design', artifactType: 'LLD', name: 'Low-Level Design (LLD)', ownerRole: 'Development Team Lead', reviewerRoles: '["Technical Architect"]', approverRoles: '["Development Team Lead"]', consumerRoles: '["Developer"]', isRequired: true, blocksPhase: true },
          { phaseName: 'Testing', artifactType: 'TestPlan', name: 'System Test Plan', ownerRole: 'QA', reviewerRoles: '["Development Team Lead"]', approverRoles: '["Project Manager"]', consumerRoles: '["Developer", "Business Analyst"]', isRequired: true, blocksPhase: true }
        ]
      }
    }
  });

  // Scrum / Agile
  const scrum = await prisma.methodology.create({
    data: {
      name: 'Scrum / Agile',
      code: 'Scrum',
      description: 'Iterative sprint-based lifecycle with recurring documentation cycles.',
      isSystem: true,
      phases: {
        create: [
          { name: 'Product Initiation', sequence: 1, description: 'Product Vision & Charter' },
          { name: 'Product Backlog', sequence: 2, description: 'Epics, User Story Definitions' },
          { name: 'Sprint Planning', sequence: 3, description: 'Sprint Backlog & Goal Documentation' },
          { name: 'Sprint Cycle', sequence: 4, description: 'Requirement Refinement, Design & Test Docs' },
          { name: 'Sprint Review', sequence: 5, description: 'Demo Summary & Stakeholder Feedback' },
          { name: 'Retrospective', sequence: 6, description: 'Process Improvement Action Items' }
        ]
      },
      requiredArtifacts: {
        create: [
          { phaseName: 'Product Initiation', artifactType: 'ProductVision', name: 'Product Charter & Vision', ownerRole: 'Business Analyst', reviewerRoles: '["Project Manager"]', approverRoles: '["Client"]', consumerRoles: '["Developer"]', isRequired: true, blocksPhase: true },
          { phaseName: 'Sprint Planning', artifactType: 'SprintGoal', name: 'Sprint 4 Goal & Scope Specification', ownerRole: 'Business Analyst', reviewerRoles: '["Technical Architect"]', approverRoles: '["Project Manager"]', consumerRoles: '["Developer", "QA"]', isRequired: true, blocksPhase: true }
        ]
      }
    }
  });

  // 4. Create Demo Project 1: Banking Management System (Waterfall)
  const bankProject = await prisma.project.create({
    data: {
      name: 'Banking Management System',
      code: 'BMS-2026',
      description: 'Core retail banking transformation platform with strict compliance & governance.',
      clientName: 'ABC Commercial Bank',
      startDate: '2026-06-01',
      endDate: '2026-12-31',
      type: 'Enterprise Banking Platform',
      priority: 'High',
      orgId: org.id,
      methodologyId: waterfall.id,
      status: 'Active'
    }
  });

  // Project Roles Mapping
  const rolesMap = [
    { roleName: 'Project Manager', userId: 'usr-pm-01' },
    { roleName: 'Business Analyst', userId: 'usr-ba-01' },
    { roleName: 'Technical Architect', userId: 'usr-ta-01' },
    { roleName: 'Team Lead', userId: 'usr-tl-01' },
    { roleName: 'Developer', userId: 'usr-dev-01' },
    { roleName: 'UI/UX Designer', userId: 'usr-ux-01' },
    { roleName: 'Tester / QA', userId: 'usr-qa-01' },
    { roleName: 'Database Administrator', userId: 'usr-dba-01' },
    { roleName: 'Client Representative', userId: 'usr-client-01' }
  ];

  for (const rm of rolesMap) {
    await prisma.projectMember.create({
      data: {
        projectId: bankProject.id,
        userId: rm.userId,
        roleName: rm.roleName
      }
    });
  }

  // Create Project Phases
  const phasePlanning = await prisma.phase.create({
    data: { projectId: bankProject.id, name: 'Planning', sequence: 1, status: 'Completed', progress: 100 }
  });
  const phaseReq = await prisma.phase.create({
    data: { projectId: bankProject.id, name: 'Requirements', sequence: 2, status: 'Completed', progress: 100 }
  });
  const phaseDesign = await prisma.phase.create({
    data: { projectId: bankProject.id, name: 'Design', sequence: 3, status: 'InProgress', progress: 64, isBlocked: true, blockReason: 'HLD client signoff pending & Database Schema approval blocked.' }
  });
  const phaseDev = await prisma.phase.create({
    data: { projectId: bankProject.id, name: 'Development', sequence: 4, status: 'Locked', progress: 0 }
  });
  const phaseTesting = await prisma.phase.create({
    data: { projectId: bankProject.id, name: 'Testing', sequence: 5, status: 'Locked', progress: 0 }
  });

  // Set current phase
  await prisma.project.update({
    where: { id: bankProject.id },
    data: { currentPhaseId: phaseDesign.id }
  });

  // Create Artifacts for Banking Project
  // Artifact 1: SRS (Published)
  const srsArtifact = await prisma.artifact.create({
    data: {
      projectId: bankProject.id,
      phaseId: phaseReq.id,
      artifactType: 'SRS',
      title: 'Banking Core SRS Specification',
      description: 'Functional & non-functional requirements for transaction processing, OAuth2 authentication, and ledger accounting.',
      ownerId: 'usr-ba-01', // Sarah (BA)
      status: 'Published',
      currentVersion: '2.1',
      origin: 'Requirement Workshop #04',
      confidentiality: 'Internal',
      content: `# Software Requirements Specification (SRS) - v2.1\n\n## 1. System Overview\nThe Banking Management System processes real-time payments, loan applications, and audit compliance.\n\n## 2. Security Requirements\n- All API communication must be encrypted with TLS 1.3.\n- Authentication must utilize OAuth2 with JWT tokens (DEC-001).\n\n## 3. Account Processing\n- Account balances must update atomically with ACID transaction isolation.\n`
    }
  });

  // SRS Reviewers & Approvers
  await prisma.artifactReviewer.create({
    data: { artifactId: srsArtifact.id, userId: 'usr-ta-01', roleName: 'Technical Architect', status: 'Reviewed', comments: 'Architectural compliance verified.' }
  });
  await prisma.artifactReviewer.create({
    data: { artifactId: srsArtifact.id, userId: 'usr-tl-01', roleName: 'Development Team Lead', status: 'Reviewed', comments: 'Implementation feasibility confirmed.' }
  });
  await prisma.artifactApprover.create({
    data: { artifactId: srsArtifact.id, userId: 'usr-pm-01', roleName: 'Project Manager', sequence: 1, status: 'Approved', comments: 'Approved scope and timeline.' }
  });
  await prisma.artifactApprover.create({
    data: { artifactId: srsArtifact.id, userId: 'usr-client-01', roleName: 'Client Representative', sequence: 2, status: 'Approved', comments: 'Signed off by ABC Bank Product Board.' }
  });

  // Versions for SRS
  await prisma.artifactVersion.create({
    data: { artifactId: srsArtifact.id, versionNumber: '1.0', content: 'Initial SRS draft by Sarah', changeSummary: 'Draft created', authorId: 'usr-ba-01', status: 'Draft' }
  });
  await prisma.artifactVersion.create({
    data: { artifactId: srsArtifact.id, versionNumber: '2.1', content: srsArtifact.content, changeSummary: 'Added OAuth2 security spec based on DEC-001', authorId: 'usr-ba-01', status: 'Published' }
  });

  // Artifact 2: HLD (Under Review)
  const hldArtifact = await prisma.artifact.create({
    data: {
      projectId: bankProject.id,
      phaseId: phaseDesign.id,
      artifactType: 'HLD',
      title: 'High-Level Architecture & Integration Design',
      description: 'Microservices architecture topology, event-driven ledger sync via Kafka, and database caching layer.',
      ownerId: 'usr-ta-01', // David (TA)
      status: 'Under Review',
      currentVersion: '1.3',
      origin: 'Technical Architecture Workshop',
      confidentiality: 'Internal',
      content: `# High-Level Design (HLD) - v1.3\n\n## 1. System Topology\n- Mobile App / Web App $\\rightarrow$ API Gateway $\\rightarrow$ Core Banking Services.\n- PostgreSQL Database Cluster with read replicas.\n\n## 2. Event Bus\nApache Kafka streams real-time audit ledger entries to the compliance service.\n`
    }
  });

  await prisma.artifactReviewer.create({
    data: { artifactId: hldArtifact.id, userId: 'usr-tl-01', roleName: 'Development Team Lead', status: 'Reviewed', comments: 'Verified service boundaries.' }
  });
  await prisma.artifactApprover.create({
    data: { artifactId: hldArtifact.id, userId: 'usr-pm-01', roleName: 'Project Manager', sequence: 1, status: 'Approved', comments: 'Approved infrastructure budget.' }
  });
  await prisma.artifactApprover.create({
    data: { artifactId: hldArtifact.id, userId: 'usr-client-01', roleName: 'Client Representative', sequence: 2, status: 'Pending', comments: 'Awaiting client security audit team signoff.' }
  });

  // Artifact 3: LLD (Draft)
  const lldArtifact = await prisma.artifact.create({
    data: {
      projectId: bankProject.id,
      phaseId: phaseDesign.id,
      artifactType: 'LLD',
      title: 'Low-Level Class & Database Schema Specification',
      description: 'Detailed ER diagrams, DTO definitions, and SQL table migration script specs.',
      ownerId: 'usr-tl-01', // Mike (TL)
      status: 'Draft',
      currentVersion: '1.0',
      origin: 'Design Workshop',
      content: `# Low-Level Design (LLD) - v1.0\n\n## 1. Database Schema\n\`users\`, \`accounts\`, \`transactions\`, \`audit_logs\` tables specified.\n`
    }
  });

  // Meetings for Banking Project
  const reqMeeting = await prisma.meeting.create({
    data: {
      projectId: bankProject.id,
      title: 'Requirement Review Workshop #04',
      meetingType: 'Requirement Workshop',
      date: '2026-08-15',
      time: '10:00 AM',
      location: 'Main Boardroom',
      organizer: 'Sarah Wilson',
      agenda: 'Review OAuth2 security integration and payment gateway transaction rules.',
      minutes: 'Agreed on using OAuth2 JWT authentication for all client apps. Approved SRS v2.1 modifications.'
    }
  });

  await prisma.meetingParticipant.create({ data: { meetingId: reqMeeting.id, userId: 'usr-ba-01', role: 'Organizer / BA' } });
  await prisma.meetingParticipant.create({ data: { meetingId: reqMeeting.id, userId: 'usr-ta-01', role: 'Technical Architect' } });
  await prisma.meetingParticipant.create({ data: { meetingId: reqMeeting.id, userId: 'usr-pm-01', role: 'Project Manager' } });
  await prisma.meetingParticipant.create({ data: { meetingId: reqMeeting.id, userId: 'usr-client-01', role: 'Client Product Owner' } });

  // Decisions
  const dec01 = await prisma.decision.create({
    data: {
      projectId: bankProject.id,
      meetingId: reqMeeting.id,
      decisionCode: 'DEC-001',
      title: 'Adopt OAuth2 with JWT for System Authentication',
      description: 'All core banking APIs will enforce OAuth2 standard with 15-minute expiring JWT tokens.',
      decisionMakerId: 'usr-ta-01',
      reason: 'Enhances client mobile security and satisfies PCI-DSS Level 1 compliance requirements.',
      impact: 'Affects SRS v2.1, HLD v1.3, and Security Test Cases.',
      status: 'Approved'
    }
  });

  // Traceability Links (Meeting -> Decision -> SRS -> HLD -> LLD)
  await prisma.traceabilityLink.create({
    data: {
      sourceArtifactId: srsArtifact.id,
      targetArtifactId: hldArtifact.id,
      relationshipType: 'DerivedInto',
      description: 'SRS requirements implemented into High-Level Architecture'
    }
  });
  await prisma.traceabilityLink.create({
    data: {
      sourceArtifactId: hldArtifact.id,
      targetArtifactId: lldArtifact.id,
      relationshipType: 'DerivedInto',
      description: 'HLD microservices translated to LLD database & class schemas'
    }
  });

  // Notifications
  await prisma.notification.create({
    data: {
      userId: 'usr-ta-01',
      title: 'High-Level Design (HLD) Review',
      message: 'HLD v1.3 submitted. Technical review needed.',
      type: 'Review',
      isRead: false,
      linkUrl: `/documents/${hldArtifact.id}`
    }
  });

  await prisma.notification.create({
    data: {
      userId: 'usr-client-01',
      title: 'Mandatory Signoff Approval Pending',
      message: 'HLD v1.3 requires your mandatory Client Product Owner signoff.',
      type: 'Approval',
      isRead: false,
      linkUrl: `/approvals`
    }
  });

  // Audit Logs
  await prisma.auditLog.create({
    data: {
      projectId: bankProject.id,
      userId: 'usr-client-01',
      action: 'DOCUMENT_APPROVED',
      entityType: 'Artifact',
      entityId: srsArtifact.id,
      previousState: 'Under Review',
      newState: 'Published',
      reason: 'SRS v2.1 approved by ABC Bank Product Board'
    }
  });

  console.log('✅ Database seeded successfully with demo projects!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
