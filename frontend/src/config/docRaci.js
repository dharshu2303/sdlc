// Central RACI Document Matrix Configuration across all SDLC Phases

export const SDLC_RACI_MATRIX = {
  Waterfall: [
    {
      phaseId: 'planning',
      phaseName: 'Planning Phase',
      color: 'purple',
      mainAccessRoles: ['PM', 'BA', 'TA', 'TL', 'Client Representative'],
      documents: [
        {
          id: 'project-charter',
          name: 'Project Charter',
          type: 'Charter',
          owner: 'Project Manager',
          reviewApprove: 'Client Representative / Sponsor',
          viewAccess: 'Project Manager, Business Analyst, Technical Architect, Team Lead',
          required: false,
          description: 'Defines formal project scope, executive sponsorship, and high-level objectives.'
        },
        {
          id: 'project-plan',
          name: 'Project Plan',
          type: 'Plan',
          owner: 'Project Manager',
          reviewApprove: 'Client Representative / Management',
          viewAccess: 'Business Analyst, Technical Architect, Team Lead, Project Team',
          required: true,
          description: 'Master SDLC schedule, milestones, work breakdown structure, and resource allocation.'
        },
        {
          id: 'risk-register',
          name: 'Risk Register & Mitigation Matrix',
          type: 'RiskRegister',
          owner: 'Project Manager',
          reviewApprove: 'Client Representative / Management',
          viewAccess: 'Business Analyst, Technical Architect, Team Lead, Project Team',
          required: true,
          description: 'Identifies potential project risks, impact severity ratings, contingency plans, and mitigation owners.'
        },
        {
          id: 'feasibility-study',
          name: 'Feasibility Study',
          type: 'Analysis',
          owner: 'Business Analyst / Project Manager',
          reviewApprove: 'Project Manager, Technical Architect, Client Representative',
          viewAccess: 'Key Stakeholders, Core Leadership Team',
          required: false,
          description: 'Technical, operational, and financial feasibility assessment.'
        }
      ]
    },
    {
      phaseId: 'requirements',
      phaseName: 'Requirements Phase',
      color: 'blue',
      mainAccessRoles: ['BA', 'PM', 'Client Representative', 'TA', 'TL', 'Developer', 'Tester / QA', 'UI/UX Designer'],
      documents: [
        {
          id: 'brd',
          name: 'BRD (Business Requirements Document)',
          type: 'BRD',
          owner: 'Business Analyst',
          reviewApprove: 'Project Manager + Client Representative',
          viewAccess: 'Technical Architect, Team Lead',
          required: false,
          description: 'High-level business problems, user personas, and commercial objectives.'
        },
        {
          id: 'srs',
          name: 'SRS (Software Requirements Specification)',
          type: 'SRS',
          owner: 'Business Analyst',
          reviewApprove: 'Technical Architect, Project Manager + Client Representative',
          viewAccess: 'Team Lead, Developer, Tester / QA, UI/UX Designer',
          required: true,
          description: 'Complete functional and non-functional specifications, interface contracts, and system constraints.'
        },
        {
          id: 'use-cases',
          name: 'Use Cases & User Scenarios',
          type: 'UseCases',
          owner: 'Business Analyst',
          reviewApprove: 'Project Manager / Client Representative',
          viewAccess: 'Developer, Tester / QA, UI/UX Designer',
          required: false,
          description: 'Actor-system interaction flows, edge cases, and pre/post-conditions.'
        },
        {
          id: 'rtm',
          name: 'RTM (Requirements Traceability Matrix)',
          type: 'RTM',
          owner: 'Business Analyst',
          reviewApprove: 'Project Manager / QA Lead',
          viewAccess: 'Technical Architect, Team Lead, Developer, Tester / QA',
          required: false,
          description: 'Bidirectional matrix linking business goals to requirements, design elements, and test cases.'
        }
      ]
    },
    {
      phaseId: 'design',
      phaseName: 'Design Phase',
      color: 'cyan',
      mainAccessRoles: ['TA', 'TL', 'Developer', 'UI/UX Designer', 'Database Administrator', 'Tester / QA', 'BA'],
      documents: [
        {
          id: 'hld',
          name: 'HLD (High-Level Design)',
          type: 'HLD',
          owner: 'Technical Architect',
          reviewApprove: 'Team Lead + Project Manager',
          viewAccess: 'Developer, Tester / QA, Database Administrator',
          required: true,
          description: 'Architectural blueprints, technology stack, microservices, cloud infrastructure, and security.'
        },
        {
          id: 'lld',
          name: 'LLD (Low-Level Design)',
          type: 'LLD',
          owner: 'Team Lead / Developer',
          reviewApprove: 'Technical Architect + Team Lead',
          viewAccess: 'Developers, Tester / QA',
          required: true,
          description: 'Component-level class diagrams, sequence flows, database schemas, and method contracts.'
        },
        {
          id: 'database-design',
          name: 'Database Design & Schema Spec',
          type: 'DBDesign',
          owner: 'Database Administrator',
          reviewApprove: 'Technical Architect + Team Lead',
          viewAccess: 'Developer, Tester / QA',
          required: false,
          description: 'ER diagrams, indexing strategy, data partitioning, and ORM entity mapping.'
        },
        {
          id: 'ui-ux-design',
          name: 'UI/UX Design & Wireframe Specs',
          type: 'UIDesign',
          owner: 'UI/UX Designer',
          reviewApprove: 'Business Analyst + Client Representative',
          viewAccess: 'Developer, Tester / QA, Team Lead',
          required: false,
          description: 'Interactive wireframes, design system tokens, accessibility criteria, and journey flows.'
        }
      ]
    },
    {
      phaseId: 'development',
      phaseName: 'Development Phase',
      color: 'indigo',
      mainAccessRoles: ['Developer', 'Team Lead', 'Technical Architect', 'Tester / QA', 'PM'],
      documents: [
        {
          id: 'technical-docs',
          name: 'Technical Documentation',
          type: 'Technical',
          owner: 'Developer',
          reviewApprove: 'Team Lead / Technical Architect',
          viewAccess: 'Developers, Tester / QA',
          required: false,
          description: 'Core algorithm documentation, setup instructions, build configurations, and code patterns.'
        },
        {
          id: 'api-docs',
          name: 'API Documentation (OpenAPI/Swagger)',
          type: 'API',
          owner: 'Developer / Technical Architect',
          reviewApprove: 'Team Lead / Technical Architect',
          viewAccess: 'Developer, Tester / QA',
          required: false,
          description: 'REST/GraphQL endpoint schemas, request/response models, and authentication headers.'
        },
        {
          id: 'dev-progress-report',
          name: 'Development Progress Report',
          type: 'ProgressReport',
          owner: 'Team Lead',
          reviewApprove: 'Project Manager',
          viewAccess: 'Technical Architect, Project Team',
          required: false,
          description: 'Module completion metrics, code review audit logs, and velocity tracking.'
        },
        {
          id: 'integration-notes',
          name: 'Integration Notes & Third-Party Specs',
          type: 'IntegrationNotes',
          owner: 'Developer / Team Lead',
          reviewApprove: 'Team Lead',
          viewAccess: 'Tester / QA, Developer',
          required: false,
          description: 'Payment gateways, webhook hooks, SSO identity integrations, and third-party dependencies.'
        }
      ]
    },
    {
      phaseId: 'testing',
      phaseName: 'Testing Phase',
      color: 'amber',
      mainAccessRoles: ['Tester / QA', 'Team Lead', 'Developer', 'Project Manager', 'BA'],
      documents: [
        {
          id: 'test-plan',
          name: 'Test Plan & Strategy',
          type: 'TestPlan',
          owner: 'Tester / QA Lead',
          reviewApprove: 'Project Manager + Team Lead',
          viewAccess: 'Business Analyst, Developer',
          required: true,
          description: 'Testing scope, environment setup, automation framework, pass/fail threshold, and schedule.'
        },
        {
          id: 'test-cases',
          name: 'Test Cases & Execution Suite',
          type: 'TestCases',
          owner: 'Tester / QA',
          reviewApprove: 'Tester / QA Lead',
          viewAccess: 'Developer, Business Analyst',
          required: true,
          description: 'Positive, negative, security, and load test scripts with expected vs actual results.'
        },
        {
          id: 'bug-report',
          name: 'Bug & Defect Report',
          type: 'BugReport',
          owner: 'Tester / QA',
          reviewApprove: 'Tester / QA Lead / Team Lead',
          viewAccess: 'Assigned Developer, Project Manager, Team Lead',
          required: true,
          description: 'Severity/priority classifications, reproduction steps, console logs, and remediation verification.'
        },
        {
          id: 'test-summary-report',
          name: 'Test Summary Report (Signoff)',
          type: 'TestSummary',
          owner: 'Tester / QA Lead',
          reviewApprove: 'Project Manager',
          viewAccess: 'Client Representative, Business Analyst, Team Lead',
          required: true,
          description: 'Final quality gate assessment, defect density, code coverage metrics, and release readiness.'
        }
      ]
    },
    {
      phaseId: 'deployment',
      phaseName: 'Deployment Phase',
      color: 'emerald',
      mainAccessRoles: ['Team Lead', 'Project Manager', 'Technical Architect', 'Developer', 'Tester / QA', 'Client Representative'],
      documents: [
        {
          id: 'deployment-plan',
          name: 'Deployment & Rollout Plan',
          type: 'DeploymentPlan',
          owner: 'Team Lead / Technical Architect',
          reviewApprove: 'Project Manager + Technical Architect',
          viewAccess: 'Developer, Tester / QA',
          required: true,
          description: 'Release window timeline, rollback procedures, database migration runbook, and health verification.'
        },
        {
          id: 'release-notes',
          name: 'Release Notes',
          type: 'ReleaseNotes',
          owner: 'Team Lead / Developer',
          reviewApprove: 'Project Manager',
          viewAccess: 'Client Representative, Project Team',
          required: true,
          description: 'Feature changelogs, deprecated endpoints, bug fixes, and security patches.'
        },
        {
          id: 'deployment-checklist',
          name: 'Deployment Checklist',
          type: 'Checklist',
          owner: 'Team Lead',
          reviewApprove: 'Team Lead / Project Manager',
          viewAccess: 'Relevant Project Team',
          required: false,
          description: 'Pre-flight DNS checks, SSL certificate verification, secrets management, and monitoring alerts.'
        },
        {
          id: 'user-manual',
          name: 'User Manual & Admin Guide',
          type: 'UserManual',
          owner: 'Business Analyst / Technical Writer',
          reviewApprove: 'Client Representative / Project Manager',
          viewAccess: 'End Users, Operations Team',
          required: false,
          description: 'Customer onboarding workflows, screenshots, FAQ, and administrative configuration manual.'
        }
      ]
    },
    {
      phaseId: 'maintenance',
      phaseName: 'Maintenance Phase',
      color: 'slate',
      mainAccessRoles: ['Team Lead', 'Business Analyst', 'Technical Architect', 'Project Manager', 'Developer', 'Tester / QA', 'Client Representative'],
      documents: [
        {
          id: 'change-request',
          name: 'Change Request (CR Document)',
          type: 'ChangeRequest',
          owner: 'Client Representative / Business Analyst',
          reviewApprove: 'Project Manager + Technical Architect',
          viewAccess: 'Team Lead, Developer, Tester / QA',
          required: false,
          description: 'Formal scope change description, effort estimation, and commercial impact.'
        },
        {
          id: 'incident-report',
          name: 'Incident & Post-Mortem Report',
          type: 'IncidentReport',
          owner: 'Team Lead / Support',
          reviewApprove: 'Team Lead / Project Manager',
          viewAccess: 'Relevant Technical Team',
          required: false,
          description: 'Root cause analysis (RCA), downtime duration, customer impact, and preventative actions.'
        },
        {
          id: 'change-impact-analysis',
          name: 'Change Impact Analysis',
          type: 'ImpactAnalysis',
          owner: 'Business Analyst + Technical Architect',
          reviewApprove: 'Project Manager',
          viewAccess: 'Developer, Tester / QA',
          required: false,
          description: 'Architectural and dependency risk assessment before implementing change requests.'
        },
        {
          id: 'maintenance-report',
          name: 'Maintenance & SLA Report',
          type: 'MaintenanceReport',
          owner: 'Team Lead',
          reviewApprove: 'Project Manager',
          viewAccess: 'Client Representative / Stakeholders',
          required: false,
          description: 'Monthly uptime SLA metrics, ticket turnaround times, and infrastructure costs.'
        }
      ]
    }
  ],

  Scrum: [
    {
      phaseId: 'initiation',
      phaseName: 'Stage 1: Initiation / Planning',
      color: 'purple',
      purpose: 'Define project vision and scope',
      mainAccessRoles: ['PM', 'BA', 'Client Representative'],
      documents: [
        {
          id: 'product-vision',
          name: 'Product Vision',
          type: 'Vision',
          owner: 'Project Manager',
          reviewApprove: 'Client Representative / Sponsor',
          viewAccess: 'Full Scrum Team, Stakeholders',
          required: true,
          description: 'Core product philosophy, target market, business value proposition.'
        },
        {
          id: 'roadmap',
          name: 'Product Roadmap',
          type: 'Roadmap',
          owner: 'Project Manager',
          reviewApprove: 'Client Representative / Stakeholders',
          viewAccess: 'Scrum Team, Management',
          required: true,
          description: 'Quarterly milestones, theme releases, and strategic capability goals.'
        }
      ]
    },
    {
      phaseId: 'requirements-backlog',
      phaseName: 'Stage 2: Requirements / Backlog',
      color: 'blue',
      purpose: 'Gather and prioritize requirements',
      mainAccessRoles: ['BA', 'PM', 'Client Representative', 'Team Lead'],
      documents: [
        {
          id: 'product-backlog',
          name: 'Product Backlog',
          type: 'Backlog',
          owner: 'Project Manager',
          reviewApprove: 'Client Representative / Stakeholders',
          viewAccess: 'Full Scrum Team',
          required: true,
          description: 'Prioritized single source of truth for all proposed features and technical tasks.'
        },
        {
          id: 'epics',
          name: 'Epics Specification',
          type: 'Epic',
          owner: 'Business Analyst',
          reviewApprove: 'Project Manager',
          viewAccess: 'Scrum Team',
          required: false,
          description: 'Large body of work broken down into multiple user stories.'
        },
        {
          id: 'user-stories',
          name: 'User Stories & Acceptance Criteria',
          type: 'UserStory',
          owner: 'Business Analyst',
          reviewApprove: 'Project Manager + Client Representative',
          viewAccess: 'Developer, Tester / QA, UI/UX Designer',
          required: true,
          description: 'As a [user], I want [feature] so that [benefit], with Given-When-Then criteria.'
        }
      ]
    },
    {
      phaseId: 'sprint-planning',
      phaseName: 'Stage 3: Sprint Planning',
      color: 'cyan',
      purpose: 'Plan the upcoming iteration',
      mainAccessRoles: ['PM', 'Team Lead', 'Developer', 'Tester / QA'],
      documents: [
        {
          id: 'sprint-goal',
          name: 'Sprint Goal',
          type: 'SprintGoal',
          owner: 'Project Manager / Scrum Master',
          reviewApprove: 'Scrum Team Consensus',
          viewAccess: 'All Project Members, Stakeholders',
          required: true,
          description: 'Unified objective that guides the sprint implementation.'
        },
        {
          id: 'sprint-backlog',
          name: 'Sprint Backlog & Capacity Allocation',
          type: 'SprintBacklog',
          owner: 'Project Manager / Team Lead',
          reviewApprove: 'Team Lead + Developer Team',
          viewAccess: 'Full Scrum Team',
          required: true,
          description: 'Committed story points, technical tasks, and story breakdown.'
        }
      ]
    },
    {
      phaseId: 'sprint-execution',
      phaseName: 'Stage 4: Sprint Execution',
      color: 'indigo',
      purpose: 'Build the product increment',
      mainAccessRoles: ['Developer', 'Technical Architect', 'Team Lead', 'UI/UX Designer'],
      documents: [
        {
          id: 'design-docs',
          name: 'Design Docs & Wireframes',
          type: 'Design',
          owner: 'Technical Architect / UI/UX Designer',
          reviewApprove: 'Team Lead',
          viewAccess: 'Developers, Tester / QA',
          required: false,
          description: 'Feature-specific micro-architecture and UI interaction specs.'
        },
        {
          id: 'technical-docs-scrum',
          name: 'Technical Documentation',
          type: 'Technical',
          owner: 'Developer',
          reviewApprove: 'Technical Architect / Team Lead',
          viewAccess: 'Scrum Team',
          required: false,
          description: 'Implementation details, schema migrations, and code patterns.'
        }
      ]
    },
    {
      phaseId: 'testing-scrum',
      phaseName: 'Stage 5: Testing',
      color: 'amber',
      purpose: 'Validate the increment',
      mainAccessRoles: ['Tester / QA', 'Team Lead', 'Developer'],
      documents: [
        {
          id: 'test-cases-scrum',
          name: 'Test Cases & Automation Suite',
          type: 'TestCases',
          owner: 'Tester / QA',
          reviewApprove: 'Team Lead / QA Lead',
          viewAccess: 'Developers, Product Owner',
          required: true,
          description: 'Sprint story validation tests, regression runs, and API tests.'
        },
        {
          id: 'bug-reports-scrum',
          name: 'Bug Reports & Defect Logs',
          type: 'BugReport',
          owner: 'Tester / QA',
          reviewApprove: 'Team Lead',
          viewAccess: 'Assigned Developer, Project Manager',
          required: true,
          description: 'Defect documentation, logs, steps to reproduce, and fix verification.'
        },
        {
          id: 'test-results',
          name: 'Test Results & Quality Scorecard',
          type: 'TestSummary',
          owner: 'Tester / QA',
          reviewApprove: 'Team Lead / Project Manager',
          viewAccess: 'Full Team',
          required: true,
          description: 'Sprint test pass percentage and open blocker status.'
        }
      ]
    },
    {
      phaseId: 'sprint-review',
      phaseName: 'Stage 6: Sprint Review',
      color: 'orange',
      purpose: 'Review completed work with stakeholders',
      mainAccessRoles: ['PM', 'Client Representative', 'Full Team'],
      documents: [
        {
          id: 'review-notes',
          name: 'Sprint Review Notes',
          type: 'ReviewNotes',
          owner: 'Project Manager',
          reviewApprove: 'Client Representative / Stakeholders',
          viewAccess: 'Full Scrum Team, Stakeholders',
          required: true,
          description: 'Demo outcomes, accepted user stories, and increment signoff.'
        },
        {
          id: 'feedback',
          name: 'Stakeholder Feedback & Action Log',
          type: 'Feedback',
          owner: 'Client Representative / Project Manager',
          reviewApprove: 'Project Manager',
          viewAccess: 'Scrum Team',
          required: false,
          description: 'Product suggestions, change requests, and roadmap adjustments.'
        }
      ]
    },
    {
      phaseId: 'retrospective',
      phaseName: 'Stage 7: Retrospective',
      color: 'rose',
      purpose: "Improve the team's process",
      mainAccessRoles: ['Team Lead', 'Project Manager', 'Developers', 'Tester / QA'],
      documents: [
        {
          id: 'retro-notes',
          name: 'Retrospective Notes',
          type: 'RetroNotes',
          owner: 'Project Manager / Scrum Master',
          reviewApprove: 'Scrum Team',
          viewAccess: 'Internal Team Only',
          required: true,
          description: 'What went well, what could be improved, and process bottlenecks.'
        },
        {
          id: 'action-items',
          name: 'Improvement Action Items',
          type: 'ActionPlan',
          owner: 'Team Lead',
          reviewApprove: 'Project Manager',
          viewAccess: 'Scrum Team',
          required: false,
          description: 'Concrete actions to implement in next sprint.'
        }
      ]
    },
    {
      phaseId: 'release-scrum',
      phaseName: 'Stage 8: Release / Deployment',
      color: 'emerald',
      purpose: 'Release the increment',
      mainAccessRoles: ['Technical Architect', 'Team Lead', 'PM', 'Client Representative'],
      documents: [
        {
          id: 'release-notes-scrum',
          name: 'Release Notes',
          type: 'ReleaseNotes',
          owner: 'Project Manager / Team Lead',
          reviewApprove: 'Client Representative',
          viewAccess: 'End Users, Stakeholders, Team',
          required: true,
          description: 'Sprint release delta, feature notes, and resolved defects.'
        },
        {
          id: 'deployment-record',
          name: 'Deployment Record & Verification',
          type: 'DeploymentPlan',
          owner: 'Technical Architect / Team Lead',
          reviewApprove: 'Project Manager',
          viewAccess: 'Technical Team, Stakeholders',
          required: true,
          description: 'Production release tags, environment verification, and health check validation.'
        }
      ]
    }
  ]
};

export const getAllDocumentTypes = () => {
  const types = new Map();
  Object.values(SDLC_RACI_MATRIX).forEach(methodology => {
    methodology.forEach(phase => {
      phase.documents.forEach(doc => {
        if (!types.has(doc.type)) {
          types.set(doc.type, {
            type: doc.type,
            name: doc.name,
            owner: doc.owner,
            reviewApprove: doc.reviewApprove,
            viewAccess: doc.viewAccess,
            phaseName: phase.phaseName,
            description: doc.description
          });
        }
      });
    });
  });
  return Array.from(types.values());
};
