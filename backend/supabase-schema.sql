-- ============================================================
-- SDLC Documentation Governance Platform — Supabase Schema
-- Complete PostgreSQL schema with RLS, indexes, triggers, seed
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TRIGGER FUNCTION: Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. ORGANIZATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_organizations_updated BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  title TEXT,
  avatar TEXT,
  system_role TEXT DEFAULT 'MEMBER' CHECK (system_role IN ('SUPER_ADMIN', 'ADMIN', 'MEMBER')),
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  is_default_password BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_org ON users(org_id);
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 3. METHODOLOGIES
-- ============================================================
CREATE TABLE IF NOT EXISTS methodologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  is_system BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. METHODOLOGY PHASES
-- ============================================================
CREATE TABLE IF NOT EXISTS methodology_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  methodology_id UUID NOT NULL REFERENCES methodologies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sequence INT NOT NULL,
  description TEXT
);
CREATE INDEX idx_meth_phases_meth ON methodology_phases(methodology_id);

-- ============================================================
-- 5. METHODOLOGY ARTIFACTS
-- ============================================================
CREATE TABLE IF NOT EXISTS methodology_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  methodology_id UUID NOT NULL REFERENCES methodologies(id) ON DELETE CASCADE,
  phase_name TEXT NOT NULL,
  artifact_type TEXT NOT NULL,
  name TEXT NOT NULL,
  owner_role TEXT NOT NULL,
  reviewer_roles JSONB DEFAULT '[]',
  approver_roles JSONB DEFAULT '[]',
  consumer_roles JSONB DEFAULT '[]',
  is_required BOOLEAN DEFAULT true,
  blocks_phase BOOLEAN DEFAULT true,
  template TEXT
);
CREATE INDEX idx_meth_artifacts_meth ON methodology_artifacts(methodology_id);

-- ============================================================
-- 6. PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  client_name TEXT,
  start_date DATE,
  end_date DATE,
  type TEXT,
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  methodology_id UUID REFERENCES methodologies(id),
  current_phase_id UUID,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Paused', 'Archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_projects_org ON projects(org_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 7. PROJECT MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id, role_name)
);
CREATE INDEX idx_pm_project ON project_members(project_id);
CREATE INDEX idx_pm_user ON project_members(user_id);

-- ============================================================
-- 8. PHASES
-- ============================================================
CREATE TABLE IF NOT EXISTS phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sequence INT NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'InProgress', 'Locked', 'Completed')),
  progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  is_blocked BOOLEAN DEFAULT false,
  block_reason TEXT,
  start_date DATE,
  target_date DATE,
  methodology_phase_id UUID REFERENCES methodology_phases(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_phases_project ON phases(project_id);
CREATE TRIGGER trg_phases_updated BEFORE UPDATE ON phases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 9. ARTIFACTS
-- ============================================================
CREATE TABLE IF NOT EXISTS artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  artifact_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES users(id),
  status TEXT DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'Draft', 'Submitted', 'Under Review', 'Changes Requested', 'Approved', 'Published', 'Archived')),
  current_version TEXT DEFAULT '1.0',
  origin TEXT,
  confidentiality TEXT DEFAULT 'Internal' CHECK (confidentiality IN ('Public', 'Internal', 'Restricted')),
  due_date DATE,
  blocks_next_phase BOOLEAN DEFAULT true,
  content TEXT,
  file_name TEXT,
  file_size TEXT,
  file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_artifacts_project ON artifacts(project_id);
CREATE INDEX idx_artifacts_phase ON artifacts(phase_id);
CREATE INDEX idx_artifacts_owner ON artifacts(owner_id);
CREATE INDEX idx_artifacts_status ON artifacts(status);
CREATE TRIGGER trg_artifacts_updated BEFORE UPDATE ON artifacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 10. ARTIFACT VERSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS artifact_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  version_number TEXT NOT NULL,
  content TEXT,
  change_summary TEXT,
  author_id UUID REFERENCES users(id),
  status TEXT,
  file_name TEXT,
  file_size TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_versions_artifact ON artifact_versions(artifact_id);

-- ============================================================
-- 11. ARTIFACT REVIEWERS
-- ============================================================
CREATE TABLE IF NOT EXISTS artifact_reviewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  role_name TEXT NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Reviewed', 'Changes Requested')),
  comments TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_reviewers_artifact ON artifact_reviewers(artifact_id);
CREATE INDEX idx_reviewers_user ON artifact_reviewers(user_id);
CREATE TRIGGER trg_reviewers_updated BEFORE UPDATE ON artifact_reviewers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 12. ARTIFACT APPROVERS
-- ============================================================
CREATE TABLE IF NOT EXISTS artifact_approvers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  role_name TEXT NOT NULL,
  sequence INT DEFAULT 1,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  comments TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_approvers_artifact ON artifact_approvers(artifact_id);
CREATE INDEX idx_approvers_user ON artifact_approvers(user_id);
CREATE TRIGGER trg_approvers_updated BEFORE UPDATE ON artifact_approvers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 13. MEETINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  meeting_type TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME,
  location TEXT,
  organizer TEXT,
  agenda TEXT,
  minutes TEXT,
  status TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_meetings_project ON meetings(project_id);

-- ============================================================
-- 14. MEETING PARTICIPANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  role TEXT
);
CREATE INDEX idx_mp_meeting ON meeting_participants(meeting_id);

-- ============================================================
-- 15. DECISIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  meeting_id UUID REFERENCES meetings(id),
  decision_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  decision_maker_id UUID REFERENCES users(id),
  reason TEXT,
  impact TEXT,
  status TEXT DEFAULT 'Approved' CHECK (status IN ('Draft', 'Approved', 'Superseded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_decisions_project ON decisions(project_id);

-- ============================================================
-- 16. ACTION ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  meeting_id UUID REFERENCES meetings(id),
  title TEXT NOT NULL,
  assignee_id UUID REFERENCES users(id),
  due_date DATE,
  status TEXT DEFAULT 'In Progress' CHECK (status IN ('Pending', 'In Progress', 'Completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_actions_project ON action_items(project_id);
CREATE INDEX idx_actions_assignee ON action_items(assignee_id);

-- ============================================================
-- 17. TRACEABILITY LINKS
-- ============================================================
CREATE TABLE IF NOT EXISTS traceability_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  target_artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_artifact_id, target_artifact_id, relationship_type)
);
CREATE INDEX idx_trace_source ON traceability_links(source_artifact_id);
CREATE INDEX idx_trace_target ON traceability_links(target_artifact_id);

-- ============================================================
-- 18. PHASE GATES
-- ============================================================
CREATE TABLE IF NOT EXISTS phase_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  gate_rule TEXT NOT NULL,
  is_satisfied BOOLEAN DEFAULT false,
  block_reason TEXT,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_gates_phase ON phase_gates(phase_id);

-- ============================================================
-- 19. AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  previous_state TEXT,
  new_state TEXT,
  details TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_project ON audit_logs(project_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ============================================================
-- 20. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  link_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notif_user ON notifications(user_id);
CREATE INDEX idx_notif_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- ============================================================
-- 21. DISPUTES
-- ============================================================
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  artifact_id UUID REFERENCES artifacts(id) ON DELETE SET NULL,
  phase_id UUID REFERENCES phases(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  dispute_type TEXT NOT NULL CHECK (dispute_type IN ('REQUIREMENT_CONFLICT','DESIGN_TRADEOFF','APPROVAL_DEADLOCK','SCOPE_CREEP','PRIORITY_CONFLICT','VERSION_CONFLICT','QUALITY_STANDARD')),
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Critical','High','Medium','Low')),
  status TEXT DEFAULT 'Open' CHECK (status IN ('Open','Under Discussion','Voting','Mediation','Resolved','Escalated','Closed')),
  raised_by UUID NOT NULL REFERENCES users(id),
  assigned_mediator UUID REFERENCES users(id),
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  escalated_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_disputes_project ON disputes(project_id);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_raised ON disputes(raised_by);
CREATE TRIGGER trg_disputes_updated BEFORE UPDATE ON disputes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 22. DISPUTE COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS dispute_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES dispute_comments(id) ON DELETE CASCADE,
  is_resolution_proposal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_dc_dispute ON dispute_comments(dispute_id);

-- ============================================================
-- 23. DISPUTE VOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS dispute_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  vote TEXT NOT NULL CHECK (vote IN ('agree','disagree','abstain')),
  comment_id UUID REFERENCES dispute_comments(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dispute_id, user_id)
);
CREATE INDEX idx_dv_dispute ON dispute_votes(dispute_id);

-- ============================================================
-- 24. DOCUMENT COLLABORATORS
-- ============================================================
CREATE TABLE IF NOT EXISTS document_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cursor_position JSONB,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artifact_id, user_id)
);
CREATE INDEX idx_collab_artifact ON document_collaborators(artifact_id);

-- ============================================================
-- 25. DOCUMENT COMMENTS (Inline)
-- ============================================================
CREATE TABLE IF NOT EXISTS document_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  position_start INT,
  position_end INT,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_doccomm_artifact ON document_comments(artifact_id);
CREATE TRIGGER trg_doccomm_updated BEFORE UPDATE ON document_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 26. DOCUMENT SUGGESTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS document_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  original_text TEXT NOT NULL,
  suggested_text TEXT NOT NULL,
  position_start INT,
  position_end INT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_docsug_artifact ON document_suggestions(artifact_id);

-- ============================================================
-- ENABLE RLS (Permissive — auth handled at API level)
-- ============================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE methodologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE methodology_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE methodology_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifact_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifact_reviewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifact_approvers ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE traceability_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_suggestions ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS; these policies allow anon/authenticated access
CREATE POLICY "Allow all for service role" ON organizations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON methodologies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON methodology_phases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON methodology_artifacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON project_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON phases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON artifacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON artifact_versions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON artifact_reviewers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON artifact_approvers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON meetings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON meeting_participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON decisions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON action_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON traceability_links FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON phase_gates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON disputes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON dispute_comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON dispute_votes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON document_collaborators FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON document_comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON document_suggestions FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- SEED DATA: System Methodologies
-- ============================================================

-- Admin user (password: Admin@123 hashed with bcrypt)
INSERT INTO users (id, email, password, name, title, system_role, is_default_password) VALUES
  (gen_random_uuid(), 'admin@sdlcgov.com', '$2a$10$rQEY7GZx0IzAjR5m.Xn6/.u3HB0xC5V1JZ0gZ5r8kx5viNjZkOYW2', 'System Administrator', 'SDLC Platform Admin', 'SUPER_ADMIN', false)
ON CONFLICT (email) DO NOTHING;

-- Waterfall Methodology
INSERT INTO methodologies (id, name, code, description, is_system) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Waterfall', 'waterfall', 'Structured sequential lifecycle with formal phase-gate approvals across 7 stages.', true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO methodology_phases (methodology_id, name, sequence, description) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Planning', 1, 'Project kickoff & feasibility'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Requirements', 2, 'SRS, Use Cases, RTM'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Design', 3, 'HLD, LLD, Database Schema'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Development', 4, 'Technical specs & Release Notes'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Testing', 5, 'Test Strategy, Test Plan & Bug Reports'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Deployment', 6, 'Deployment plan & Operational readiness'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Maintenance', 7, 'Change requests & Impact analysis');

INSERT INTO methodology_artifacts (methodology_id, phase_name, artifact_type, name, owner_role, reviewer_roles, approver_roles, consumer_roles, is_required, blocks_phase) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Planning', 'ProjectPlan', 'Project Management Plan', 'Project Manager', '["Technical Architect"]', '["Client Representative"]', '["Team Lead"]', true, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Planning', 'Charter', 'Project Charter', 'Project Manager', '["Business Analyst"]', '["Client Representative"]', '["Team Lead"]', true, false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Planning', 'RiskRegister', 'Risk Register & Mitigation Matrix', 'Project Manager', '["Technical Architect"]', '["Project Manager"]', '["Team Lead"]', true, false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Planning', 'Feasibility', 'Feasibility Study', 'Business Analyst', '["Technical Architect"]', '["Project Manager"]', '["Team Lead"]', false, false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Requirements', 'SRS', 'Software Requirements Specification (SRS)', 'Business Analyst', '["Technical Architect","Team Lead"]', '["Project Manager","Client Representative"]', '["Developer","Tester / QA"]', true, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Requirements', 'BRD', 'Business Requirements Document (BRD)', 'Business Analyst', '["Project Manager"]', '["Client Representative"]', '["Technical Architect"]', true, false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Requirements', 'RTM', 'Requirement Traceability Matrix (RTM)', 'Business Analyst', '["Tester / QA"]', '["Project Manager"]', '["Developer"]', true, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Requirements', 'UseCases', 'Use Cases & User Scenarios', 'Business Analyst', '["Team Lead"]', '["Project Manager"]', '["Developer","Tester / QA"]', false, false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Design', 'HLD', 'High-Level Design (HLD)', 'Technical Architect', '["Team Lead"]', '["Project Manager","Client Representative"]', '["Developer","Tester / QA"]', true, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Design', 'LLD', 'Low-Level Design (LLD)', 'Team Lead', '["Technical Architect"]', '["Team Lead"]', '["Developer"]', true, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Design', 'DatabaseDesign', 'Database Schema & Architecture', 'Database Administrator', '["Technical Architect"]', '["Technical Architect"]', '["Developer"]', true, false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Design', 'UIUXDesign', 'UI/UX Design Spec & Wireframes', 'UI/UX Designer', '["Business Analyst"]', '["Project Manager"]', '["Developer"]', false, false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Development', 'TechnicalDoc', 'Technical Architecture Spec', 'Developer', '["Technical Architect"]', '["Team Lead"]', '["Tester / QA"]', true, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Development', 'APIDoc', 'API Spec (OpenAPI/Swagger)', 'Developer', '["Technical Architect"]', '["Team Lead"]', '["Developer","Tester / QA"]', true, false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Development', 'ProgressReport', 'Development Progress Report', 'Team Lead', '["Project Manager"]', '["Project Manager"]', '["Client Representative"]', false, false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Development', 'IntegrationNotes', 'Integration Notes', 'Developer', '["Team Lead"]', '["Team Lead"]', '["Tester / QA"]', false, false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Testing', 'TestPlan', 'System Test Plan & Strategy', 'Tester / QA', '["Team Lead"]', '["Project Manager"]', '["Developer","Business Analyst"]', true, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Testing', 'TestCases', 'Test Cases & Automation Suite', 'Tester / QA', '["Team Lead"]', '["Team Lead"]', '["Developer"]', true, false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Testing', 'BugReport', 'Bug & Defect Report', 'Tester / QA', '["Team Lead"]', '["Team Lead"]', '["Developer"]', true, false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Testing', 'TestSummary', 'Test Summary & QA Signoff', 'Tester / QA', '["Project Manager"]', '["Project Manager"]', '["Client Representative"]', true, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Deployment', 'DeploymentPlan', 'Deployment & Rollout Runbook', 'Technical Architect', '["Team Lead"]', '["Project Manager"]', '["Developer"]', true, true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Deployment', 'ReleaseNotes', 'Deployment Release Notes', 'Team Lead', '["Project Manager"]', '["Client Representative"]', '["Client Representative"]', true, false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Deployment', 'UserManual', 'User Manual & Admin Guide', 'Business Analyst', '["Team Lead"]', '["Project Manager"]', '["Client Representative"]', false, false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Maintenance', 'ChangeRequest', 'Change Request (CR)', 'Business Analyst', '["Technical Architect"]', '["Project Manager"]', '["Team Lead"]', false, false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Maintenance', 'IncidentReport', 'Incident & Post-Mortem Report', 'Team Lead', '["Project Manager"]', '["Project Manager"]', '["Client Representative"]', false, false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Maintenance', 'ChangeImpact', 'Change Impact Analysis', 'Technical Architect', '["Team Lead"]', '["Project Manager"]', '["Developer"]', false, false),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Maintenance', 'MaintenanceReport', 'Maintenance & SLA Report', 'Team Lead', '["Project Manager"]', '["Project Manager"]', '["Client Representative"]', false, false);

-- Scrum / Agile Methodology
INSERT INTO methodologies (id, name, code, description, is_system) VALUES
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Scrum / Agile', 'scrum', 'Iterative sprint-based lifecycle with recurring documentation cycles across 8 agile stages.', true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO methodology_phases (methodology_id, name, sequence, description) VALUES
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Initiation / Planning', 1, 'Define project vision and scope'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Requirements / Backlog', 2, 'Gather and prioritize requirements'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Sprint Planning', 3, 'Plan the upcoming iteration'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Sprint Execution', 4, 'Build the product increment'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Testing', 5, 'Validate the increment'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Sprint Review', 6, 'Review completed work with stakeholders'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Retrospective', 7, 'Improve the team process'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Release / Deployment', 8, 'Release the increment');

INSERT INTO methodology_artifacts (methodology_id, phase_name, artifact_type, name, owner_role, reviewer_roles, approver_roles, consumer_roles, is_required, blocks_phase) VALUES
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Initiation / Planning', 'Vision', 'Product Vision', 'Project Manager', '["Client Representative"]', '["Client Representative"]', '["Developer","Team Lead"]', true, true),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Initiation / Planning', 'Roadmap', 'Product Roadmap', 'Project Manager', '["Client Representative"]', '["Client Representative"]', '["Developer","Business Analyst"]', true, true),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Requirements / Backlog', 'Backlog', 'Product Backlog', 'Business Analyst', '["Project Manager"]', '["Client Representative"]', '["Developer"]', true, true),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Requirements / Backlog', 'UserStory', 'User Stories & Acceptance Criteria', 'Business Analyst', '["Project Manager"]', '["Project Manager"]', '["Developer","Tester / QA"]', true, true),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Sprint Planning', 'SprintGoal', 'Sprint Goal', 'Project Manager', '["Team Lead"]', '["Project Manager"]', '["Developer"]', true, true),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Sprint Planning', 'SprintBacklog', 'Sprint Backlog', 'Team Lead', '["Project Manager"]', '["Team Lead"]', '["Developer"]', true, true),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Sprint Execution', 'Design', 'Design Docs & Wireframes', 'UI/UX Designer', '["Technical Architect"]', '["Team Lead"]', '["Developer"]', true, true),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Sprint Execution', 'Technical', 'Technical Docs', 'Developer', '["Technical Architect"]', '["Team Lead"]', '["Tester / QA"]', true, true),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Testing', 'TestCases', 'Test Cases', 'Tester / QA', '["Team Lead"]', '["Team Lead"]', '["Developer"]', true, true),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Testing', 'BugReport', 'Bug Reports', 'Tester / QA', '["Team Lead"]', '["Team Lead"]', '["Developer"]', true, true),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Testing', 'TestSummary', 'Test Results', 'Tester / QA', '["Project Manager"]', '["Project Manager"]', '["Client Representative"]', true, true),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Sprint Review', 'ReviewNotes', 'Sprint Review Notes', 'Project Manager', '["Client Representative"]', '["Client Representative"]', '["Developer"]', true, true),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Sprint Review', 'Feedback', 'Stakeholder Feedback', 'Project Manager', '["Client Representative"]', '["Client Representative"]', '["Business Analyst"]', true, true),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Retrospective', 'RetroNotes', 'Retrospective Notes', 'Project Manager', '["Team Lead"]', '["Project Manager"]', '["Developer"]', true, true),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Retrospective', 'ActionPlan', 'Improvement Action Items', 'Team Lead', '["Project Manager"]', '["Project Manager"]', '["Developer"]', true, true),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Release / Deployment', 'ReleaseNotes', 'Release Notes', 'Project Manager', '["Client Representative"]', '["Client Representative"]', '["Developer","Client Representative"]', true, true),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Release / Deployment', 'DeploymentPlan', 'Deployment Record', 'Technical Architect', '["Project Manager"]', '["Project Manager"]', '["Developer"]', true, true);

-- Default organization
INSERT INTO organizations (name, code) VALUES ('SDLC Governance Corp', 'SDLC-GOV') ON CONFLICT (code) DO NOTHING;
