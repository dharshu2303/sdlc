const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const isConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your-project')
);

let supabase = null;
let supabaseAdmin = null;

if (isConfigured) {
  try {
    console.log(`📡 Connecting to Supabase Cloud: ${supabaseUrl}`);
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    console.log(`✅ Supabase Cloud Client Initialized Successfully`);
  } catch (err) {
    console.error('❌ Failed to initialize Supabase client:', err.message);
  }
}

// If not connected to live Supabase, provide the resilient Local Supabase Engine
if (!supabase || !supabaseAdmin) {
  console.log('⚡ Initializing Resilient Local Supabase-Compatible Engine (Storage & Query Engine Active)');
  console.log('ℹ️  To connect to live Supabase Cloud, add your SUPABASE_URL and SUPABASE_ANON_KEY in backend/.env');

  const DB_PATH = path.join(__dirname, '..', '..', 'local-supabase-db.json');

const bcrypt = require('bcryptjs');
const SEED_PASSWORD_HASH = bcrypt.hashSync('Admin@123', 10);

  const getInitialData = () => {
    return {
      users: [
        {
          id: 'usr-admin-01',
          email: 'admin@sdlcgov.com',
          password: SEED_PASSWORD_HASH, // Admin@123
          name: 'System Administrator',
          role: 'Admin',
          title: 'SDLC Governance Admin',
          system_role: 'SUPER_ADMIN',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
        },
        {
          id: 'usr-pm-01',
          email: 'john.pm@bankgov.com',
          password: SEED_PASSWORD_HASH,
          name: 'John Smith',
          role: 'Project Manager',
          title: 'Senior Project Manager',
          system_role: 'ADMIN',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
        },
        {
          id: 'usr-ba-01',
          email: 'sarah.ba@bankgov.com',
          password: SEED_PASSWORD_HASH,
          name: 'Sarah Wilson',
          role: 'Business Analyst',
          title: 'Lead Requirements Analyst',
          system_role: 'MEMBER',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
        },
        {
          id: 'usr-ta-01',
          email: 'david.ta@bankgov.com',
          password: SEED_PASSWORD_HASH,
          name: 'David Brown',
          role: 'Technical Architect',
          title: 'Chief Technical Architect',
          system_role: 'MEMBER',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David'
        },
        {
          id: 'usr-tl-01',
          email: 'mike.tl@bankgov.com',
          password: SEED_PASSWORD_HASH,
          name: 'Mike Johnson',
          role: 'Team Lead',
          title: 'Dev Team Lead',
          system_role: 'MEMBER',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike'
        },
        {
          id: 'usr-dev-01',
          email: 'alex.dev@bankgov.com',
          password: SEED_PASSWORD_HASH,
          name: 'Alex Carter',
          role: 'Developer',
          title: 'Senior Software Engineer',
          system_role: 'MEMBER',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'
        },
        {
          id: 'usr-qa-01',
          email: 'robert.qa@bankgov.com',
          password: SEED_PASSWORD_HASH,
          name: 'Robert Miller',
          role: 'Tester / QA',
          title: 'QA Lead',
          system_role: 'MEMBER',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert'
        },
        {
          id: 'usr-client-01',
          email: 'client@abcbank.com',
          password: SEED_PASSWORD_HASH,
          name: 'Elena Rostova',
          role: 'Client Representative',
          title: 'Client Product Owner',
          system_role: 'MEMBER',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Client'
        }
      ],
      methodologies: [
        {
          id: 'meth-waterfall',
          name: 'Waterfall',
          code: 'waterfall',
          description: 'Structured sequential lifecycle with formal phase-gate approvals across 7 stages.',
          is_system: true
        },
        {
          id: 'meth-scrum',
          name: 'Scrum / Agile',
          code: 'scrum',
          description: 'Iterative sprint-based lifecycle with recurring documentation cycles across 8 agile stages.',
          is_system: true
        }
      ],
      projects: [
        {
          id: 'proj-bms-01',
          name: 'Enterprise Core Banking Transformation',
          code: 'BMS-2026',
          description: 'Next-generation retail banking ledger, payments event bus, and regulatory governance system.',
          client_name: 'ABC Commercial Bank',
          start_date: '2026-06-01',
          end_date: '2026-12-31',
          type: 'Enterprise Banking Platform',
          priority: 'High',
          methodology_id: 'meth-waterfall',
          current_phase_id: 'ph-bms-3',
          status: 'Active',
          created_at: new Date(Date.now() - 30 * 86400000).toISOString()
        }
      ],
      project_members: [
        { id: 'pm-1', project_id: 'proj-bms-01', user_id: 'usr-pm-01', role_name: 'Project Manager' },
        { id: 'pm-2', project_id: 'proj-bms-01', user_id: 'usr-ba-01', role_name: 'Business Analyst' },
        { id: 'pm-3', project_id: 'proj-bms-01', user_id: 'usr-ta-01', role_name: 'Technical Architect' },
        { id: 'pm-4', project_id: 'proj-bms-01', user_id: 'usr-tl-01', role_name: 'Team Lead' },
        { id: 'pm-5', project_id: 'proj-bms-01', user_id: 'usr-dev-01', role_name: 'Developer' },
        { id: 'pm-6', project_id: 'proj-bms-01', user_id: 'usr-qa-01', role_name: 'Tester / QA' },
        { id: 'pm-7', project_id: 'proj-bms-01', user_id: 'usr-client-01', role_name: 'Client Representative' }
      ],
      phases: [
        { id: 'ph-bms-1', project_id: 'proj-bms-01', name: 'Planning', sequence: 1, status: 'Completed', progress: 100, is_blocked: false, planned_days: 10, actual_days: 8, start_date: '2026-06-01', target_date: '2026-06-10' },
        { id: 'ph-bms-2', project_id: 'proj-bms-01', name: 'Requirements', sequence: 2, status: 'Completed', progress: 100, is_blocked: false, planned_days: 14, actual_days: 16, start_date: '2026-06-11', target_date: '2026-06-28' },
        { id: 'ph-bms-3', project_id: 'proj-bms-01', name: 'Design', sequence: 3, status: 'InProgress', progress: 65, is_blocked: true, block_reason: 'HLD Client Signoff Pending & DB Partitioning Dispute Active.', planned_days: 15, actual_days: 18, start_date: '2026-06-29', target_date: '2026-07-16' },
        { id: 'ph-bms-4', project_id: 'proj-bms-01', name: 'Development', sequence: 4, status: 'Locked', progress: 0, is_blocked: true, block_reason: 'Design Phase Gate Not Yet Approved.', planned_days: 30, actual_days: 0 },
        { id: 'ph-bms-5', project_id: 'proj-bms-01', name: 'Testing', sequence: 5, status: 'Locked', progress: 0, is_blocked: true, planned_days: 20, actual_days: 0 },
        { id: 'ph-bms-6', project_id: 'proj-bms-01', name: 'Deployment', sequence: 6, status: 'Locked', progress: 0, is_blocked: true, planned_days: 10, actual_days: 0 },
        { id: 'ph-bms-7', project_id: 'proj-bms-01', name: 'Maintenance', sequence: 7, status: 'Locked', progress: 0, is_blocked: true, planned_days: 15, actual_days: 0 }
      ],
      artifacts: [
        {
          id: 'art-charter-01',
          project_id: 'proj-bms-01',
          phase_id: 'ph-bms-1',
          artifact_type: 'Charter',
          title: 'Project Charter & Business Objectives',
          description: 'High-level business justification, ROI forecast, and governance boundaries.',
          owner_id: 'usr-pm-01',
          status: 'Published',
          current_version: '1.0',
          blocks_next_phase: true,
          content: '# Project Charter\n\n## 1. Executive Summary\nCore banking transformation for 5M retail accounts.',
          created_at: new Date(Date.now() - 25 * 86400000).toISOString()
        },
        {
          id: 'art-srs-01',
          project_id: 'proj-bms-01',
          phase_id: 'ph-bms-2',
          artifact_type: 'SRS',
          title: 'Software Requirements Specification (SRS)',
          description: 'Comprehensive functional requirements, regulatory compliance, and transaction throughput SLAs.',
          owner_id: 'usr-ba-01',
          status: 'Published',
          current_version: '2.0',
          blocks_next_phase: true,
          content: '# Software Requirements Specification (SRS)\n\n## 1. Functional Scope\nReal-time payments and ISO20022 compliance.\n\n## 2. Non-Functional SLAs\nSub-50ms transaction latency at 15,000 TPS.',
          created_at: new Date(Date.now() - 15 * 86400000).toISOString()
        },
        {
          id: 'art-hld-01',
          project_id: 'proj-bms-01',
          phase_id: 'ph-bms-3',
          artifact_type: 'HLD',
          title: 'High-Level Design (HLD) Specification',
          description: 'Event-driven distributed ledger architecture with Apache Kafka and multi-region failover.',
          owner_id: 'usr-ta-01',
          status: 'Under Review',
          current_version: '1.2',
          blocks_next_phase: true,
          content: '# High-Level Design (HLD)\n\n## 1. System Topology\nMicroservices mesh utilizing event sourcing and CQRS patterns.\n\n## 2. Security\nZero-trust mTLS encryption across all VPC peering links.',
          created_at: new Date(Date.now() - 5 * 86400000).toISOString()
        },
        {
          id: 'art-lld-01',
          project_id: 'proj-bms-01',
          phase_id: 'ph-bms-3',
          artifact_type: 'LLD',
          title: 'Low-Level Design (LLD) & API Contracts',
          description: 'OpenAPI schemas, entity relationship diagrams, database sharding strategies, and worker threads.',
          owner_id: 'usr-tl-01',
          status: 'Draft',
          current_version: '1.0',
          blocks_next_phase: true,
          content: '# Low-Level Design (LLD)\n\n## 1. Data Models\nAccount, Transaction, LedgerEntry, AuditTrail schemas.',
          created_at: new Date(Date.now() - 2 * 86400000).toISOString()
        }
      ],
      artifact_versions: [
        { id: 'v-1', artifact_id: 'art-hld-01', version_number: '1.0', content: '# HLD Initial Draft', change_summary: 'Initial draft', author_id: 'usr-ta-01', created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
        { id: 'v-2', artifact_id: 'art-hld-01', version_number: '1.1', content: '# HLD v1.1', change_summary: 'Added Kafka partitioning specs', author_id: 'usr-ta-01', created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
        { id: 'v-3', artifact_id: 'art-hld-01', version_number: '1.2', content: '# HLD v1.2', change_summary: 'Refined mTLS topology per audit review', author_id: 'usr-ta-01', created_at: new Date(Date.now() - 1 * 86400000).toISOString() }
      ],
      artifact_reviewers: [
        { id: 'rev-1', artifact_id: 'art-hld-01', user_id: 'usr-tl-01', role_name: 'Team Lead', status: 'Reviewed', comments: 'Architecture design verified for development feasibility.', updated_at: new Date().toISOString() },
        { id: 'rev-2', artifact_id: 'art-hld-01', user_id: 'usr-ta-01', role_name: 'Technical Architect', status: 'Reviewed', comments: 'Signoff complete.', updated_at: new Date().toISOString() }
      ],
      artifact_approvers: [
        { id: 'app-1', artifact_id: 'art-hld-01', user_id: 'usr-pm-01', role_name: 'Project Manager', sequence: 1, status: 'Approved', comments: 'Management budget approved.', updated_at: new Date().toISOString() },
        { id: 'app-2', artifact_id: 'art-hld-01', user_id: 'usr-client-01', role_name: 'Client Representative', sequence: 2, status: 'Pending', comments: '', updated_at: new Date().toISOString() }
      ],
      disputes: [
        {
          id: 'disp-001',
          project_id: 'proj-bms-01',
          artifact_id: 'art-hld-01',
          phase_id: 'ph-bms-3',
          title: 'Database Sharding vs Distributed SQL Ledger Disagreement',
          description: 'Technical Architect recommends CockroachDB for multi-region ACID consistency, but Lead DBA proposes PostgreSQL with custom application-level hash sharding due to cost constraints.',
          dispute_type: 'DESIGN_TRADEOFF',
          priority: 'Critical',
          status: 'Voting',
          raised_by: 'usr-ta-01',
          assigned_mediator: 'usr-pm-01',
          created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'disp-002',
          project_id: 'proj-bms-01',
          artifact_id: 'art-srs-01',
          phase_id: 'ph-bms-2',
          title: 'SLA Throughput: 15,000 TPS vs Budget Hardware Constraints',
          description: 'Client product owner requests 15,000 TPS burst throughput in the SRS, whereas Infrastructure team reports current on-prem HSM limits are capped at 8,500 TPS.',
          dispute_type: 'REQUIREMENT_CONFLICT',
          priority: 'High',
          status: 'Under Discussion',
          raised_by: 'usr-ba-01',
          assigned_mediator: 'usr-pm-01',
          created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'disp-003',
          project_id: 'proj-bms-01',
          artifact_id: 'art-charter-01',
          phase_id: 'ph-bms-1',
          title: 'Scope Clarification: Swift ISO20022 Cross-Border Settlement',
          description: 'Dispute over whether Swift MX messaging should be included in MVP Release 1 or deferred to Release 2.',
          dispute_type: 'SCOPE_CREEP',
          priority: 'Medium',
          status: 'Resolved',
          raised_by: 'usr-pm-01',
          assigned_mediator: 'usr-client-01',
          resolution: 'Agreed in Steering Committee meeting to deliver ISO20022 in Phase 2 with separate milestone signoff.',
          resolved_at: new Date(Date.now() - 10 * 86400000).toISOString(),
          created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
          updated_at: new Date(Date.now() - 10 * 86400000).toISOString()
        }
      ],
      dispute_comments: [
        {
          id: 'dc-1',
          dispute_id: 'disp-001',
          user_id: 'usr-ta-01',
          content: 'Distributed SQL guarantees zero data loss during cloud zone failover without complex application dual-writes.',
          is_resolution_proposal: false,
          created_at: new Date(Date.now() - 2 * 86400000).toISOString()
        },
        {
          id: 'dc-2',
          dispute_id: 'disp-001',
          user_id: 'usr-tl-01',
          content: 'Proposal: Use Managed PostgreSQL with Citus extension. It gives us horizontal scaling with standard Postgres tooling and lowers license overhead by 40%.',
          is_resolution_proposal: true,
          created_at: new Date(Date.now() - 1 * 86400000).toISOString()
        }
      ],
      dispute_votes: [
        { id: 'dv-1', dispute_id: 'disp-001', user_id: 'usr-ta-01', vote: 'agree', reason: 'Citus compromise satisfies both architectural SLAs and team skills.', created_at: new Date().toISOString() },
        { id: 'dv-2', dispute_id: 'disp-001', user_id: 'usr-tl-01', vote: 'agree', reason: 'Development team supports this compromise.', created_at: new Date().toISOString() },
        { id: 'dv-3', dispute_id: 'disp-001', user_id: 'usr-pm-01', vote: 'agree', reason: 'Fits project delivery budget.', created_at: new Date().toISOString() }
      ],
      document_collaborators: [],
      document_comments: [
        {
          id: 'dcomm-1',
          artifact_id: 'art-hld-01',
          user_id: 'usr-ta-01',
          content: 'Please verify if Kafka consumer group rebalancing timeout of 3000ms is sufficient for spike workloads.',
          position_start: 12,
          position_end: 45,
          is_resolved: false,
          created_at: new Date().toISOString()
        }
      ],
      document_suggestions: [],
      meetings: [
        {
          id: 'mtg-01',
          project_id: 'proj-bms-01',
          title: 'HLD Architecture Review & Dispute Mediation Session',
          meeting_type: 'Design Review',
          date: '2026-07-02',
          time: '14:00',
          location: 'Conference Room Alpha & MS Teams',
          organizer: 'John Smith (Project Manager)',
          agenda: '1. Resolve Database Sharding vs Distributed SQL Dispute\n2. Review Kafka event bus partitions\n3. Client signoff timeline',
          status: 'Scheduled',
          created_at: new Date().toISOString()
        }
      ],
      meeting_participants: [
        { id: 'mp-1', meeting_id: 'mtg-01', user_id: 'usr-pm-01', role: 'Organizer' },
        { id: 'mp-2', meeting_id: 'mtg-01', user_id: 'usr-ta-01', role: 'Presenter' },
        { id: 'mp-3', meeting_id: 'mtg-01', user_id: 'usr-tl-01', role: 'Reviewer' },
        { id: 'mp-4', meeting_id: 'mtg-01', user_id: 'usr-client-01', role: 'Stakeholder' }
      ],
      decisions: [
        {
          id: 'dec-01',
          project_id: 'proj-bms-01',
          meeting_id: 'mtg-01',
          decision_code: 'DEC-001',
          title: 'Adoption of Event Sourcing with Citus PostgreSQL',
          description: 'The architecture team and project management formally adopt Managed PostgreSQL with Citus for distributed ledger transactions.',
          decision_maker_id: 'usr-pm-01',
          reason: 'Balances 15K TPS horizontal scalability with strict banking audit constraints.',
          status: 'Approved',
          created_at: new Date().toISOString()
        }
      ],
      action_items: [
        {
          id: 'act-01',
          project_id: 'proj-bms-01',
          title: 'Benchmark Citus distributed cluster under 15,000 TPS test load',
          assignee_id: 'usr-dev-01',
          due_date: '2026-07-10',
          status: 'In Progress',
          created_at: new Date().toISOString()
        }
      ],
      traceability_links: [
        { id: 'tr-1', source_artifact_id: 'art-charter-01', target_artifact_id: 'art-srs-01', relationship_type: 'OriginatesFrom', description: 'Business requirements derived from charter' },
        { id: 'tr-2', source_artifact_id: 'art-srs-01', target_artifact_id: 'art-hld-01', relationship_type: 'Satisfies', description: 'Architecture satisfies all functional requirements' }
      ],
      phase_gates: [],
      audit_logs: [
        {
          id: 'aud-01',
          project_id: 'proj-bms-01',
          entity_type: 'Dispute',
          entity_id: 'disp-001',
          action: 'DISPUTE_VOTING_INITIATED',
          user_id: 'usr-pm-01',
          details: 'Voting initiated for dispute "Database Sharding vs Distributed SQL Ledger Disagreement".',
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'aud-02',
          project_id: 'proj-bms-01',
          entity_type: 'Artifact',
          entity_id: 'art-hld-01',
          action: 'REVIEW_APPROVED',
          user_id: 'usr-ta-01',
          details: 'Technical Architect signed off technical review for "High-Level Design (HLD) Specification".',
          created_at: new Date(Date.now() - 7200000).toISOString()
        }
      ],
      notifications: [
        {
          id: 'notif-1',
          user_id: 'usr-pm-01',
          title: 'Dispute Voting in Progress',
          message: 'Voting is currently active on Database Sharding Disagreement. 3 of 4 votes cast.',
          type: 'Dispute',
          is_read: false,
          created_at: new Date().toISOString()
        }
      ]
    };
  };

  let localStore = null;
  const loadStore = () => {
    if (localStore) return localStore;
    try {
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf8');
        localStore = JSON.parse(raw);
      } else {
        localStore = getInitialData();
        saveStore();
      }
    } catch (e) {
      localStore = getInitialData();
    }
    return localStore;
  };

  const saveStore = () => {
    try {
      if (localStore) {
        fs.writeFileSync(DB_PATH, JSON.stringify(localStore, null, 2), 'utf8');
      }
    } catch (e) {
      console.error('Error saving local store:', e.message);
    }
  };

  // Fluent query builder that matches Supabase query API
  class SupabaseMockBuilder {
    constructor(tableName) {
      this.table = tableName;
      this.filters = [];
      this.sortField = null;
      this.sortAsc = true;
      this.isSingle = false;
      this.selectFields = null;
      this.limitCount = null;
      this.dataToInsert = null;
      this.dataToUpdate = null;
      this.isDelete = false;
      this.isUpsert = false;
      this.upsertConflict = null;
    }

    select(fields = '*') {
      this.selectFields = fields;
      return this;
    }

    eq(field, value) {
      this.filters.push(row => String(row[field]) === String(value));
      return this;
    }

    neq(field, value) {
      this.filters.push(row => String(row[field]) !== String(value));
      return this;
    }

    ilike(field, pattern) {
      const cleanPattern = String(pattern).replace(/%/g, '').toLowerCase();
      this.filters.push(row => String(row[field] || '').toLowerCase().includes(cleanPattern));
      return this;
    }

    order(field, { ascending = true } = {}) {
      this.sortField = field;
      this.sortAsc = ascending;
      return this;
    }

    limit(num) {
      this.limitCount = num;
      return this;
    }

    single() {
      this.isSingle = true;
      return this;
    }

    insert(data) {
      this.dataToInsert = data;
      return this;
    }

    update(data) {
      this.dataToUpdate = data;
      return this;
    }

    upsert(data, options = {}) {
      this.isUpsert = true;
      this.dataToInsert = data;
      this.upsertConflict = options.onConflict;
      return this;
    }

    delete() {
      this.isDelete = true;
      return this;
    }

    // Promise execution
    async then(resolve, reject) {
      try {
        const store = loadStore();
        if (!store[this.table]) {
          store[this.table] = [];
        }
        let tableData = store[this.table];

        // 1. INSERT
        if (this.dataToInsert && !this.isUpsert) {
          const items = Array.isArray(this.dataToInsert) ? this.dataToInsert : [this.dataToInsert];
          items.forEach(item => {
            if (!item.id) {
              item.id = `${this.table.slice(0, 4)}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            }
            if (!item.created_at) item.created_at = new Date().toISOString();
            tableData.unshift(item);
          });
          saveStore();
          const result = this.isSingle || !Array.isArray(this.dataToInsert) ? items[0] : items;
          return resolve({ data: result, error: null });
        }

        // 2. UPSERT
        if (this.isUpsert) {
          const item = this.dataToInsert;
          if (this.upsertConflict) {
            const conflictKeys = this.upsertConflict.split(',').map(s => s.trim());
            const idx = tableData.findIndex(row => conflictKeys.every(k => String(row[k]) === String(item[k])));
            if (idx >= 0) {
              tableData[idx] = { ...tableData[idx], ...item, updated_at: new Date().toISOString() };
              saveStore();
              return resolve({ data: tableData[idx], error: null });
            }
          }
          if (!item.id) item.id = `${this.table.slice(0, 4)}-${Date.now()}`;
          tableData.unshift(item);
          saveStore();
          return resolve({ data: item, error: null });
        }

        // 3. UPDATE
        if (this.dataToUpdate) {
          let updatedItem = null;
          tableData = tableData.map(row => {
            const matches = this.filters.every(fn => fn(row));
            if (matches) {
              updatedItem = { ...row, ...this.dataToUpdate, updated_at: new Date().toISOString() };
              return updatedItem;
            }
            return row;
          });
          store[this.table] = tableData;
          saveStore();
          return resolve({ data: this.isSingle ? updatedItem : [updatedItem].filter(Boolean), error: null });
        }

        // 4. DELETE
        if (this.isDelete) {
          const initialLen = tableData.length;
          store[this.table] = tableData.filter(row => !this.filters.every(fn => fn(row)));
          saveStore();
          return resolve({ data: { count: initialLen - store[this.table].length }, error: null });
        }

        // 5. QUERY / SELECT
        let results = tableData.filter(row => this.filters.every(fn => fn(row)));

        if (this.sortField) {
          results.sort((a, b) => {
            const valA = a[this.sortField];
            const valB = b[this.sortField];
            if (valA === valB) return 0;
            if (valA == null) return 1;
            if (valB == null) return -1;
            const cmp = valA > valB ? 1 : -1;
            return this.sortAsc ? cmp : -cmp;
          });
        }

        if (this.limitCount) {
          results = results.slice(0, this.limitCount);
        }

        if (this.isSingle) {
          const singleItem = results.length > 0 ? results[0] : null;
          return resolve({ data: singleItem, error: singleItem ? null : { message: 'Row not found' } });
        }

        return resolve({ data: results, error: null });
      } catch (err) {
        return resolve({ data: null, error: { message: err.message } });
      }
    }
  }

  const createMockClient = () => ({
    from: (tableName) => new SupabaseMockBuilder(tableName),
    isMock: true
  });

  supabase = createMockClient();
  supabaseAdmin = createMockClient();
}

module.exports = {
  supabase,
  supabaseAdmin,
  isLiveSupabase: isConfigured
};
