const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authMiddleware = require('./middleware/auth');

// Route imports
const authRoutes = require('./routes/auth.routes');
const methodologyRoutes = require('./routes/methodology.routes');
const projectRoutes = require('./routes/project.routes');
const artifactRoutes = require('./routes/artifact.routes');
const approvalRoutes = require('./routes/approval.routes');
const meetingRoutes = require('./routes/meeting.routes');
const traceabilityRoutes = require('./routes/traceability.routes');
const phaseGateRoutes = require('./routes/phaseGate.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const auditRoutes = require('./routes/audit.routes');
const disputeRoutes = require('./routes/dispute.routes');
const collaborationRoutes = require('./routes/collaboration.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production' || res.statusCode >= 400) {
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    }
  });
  next();
});

// Health Check (public - no auth)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    system: 'SDLC Documentation Governance Platform API v2.0',
    database: 'Supabase (PostgreSQL)',
    features: ['Collaborative Editing', 'Dispute Resolution', 'Phase-Gate Governance', 'Audit Trail'],
    timestamp: new Date().toISOString()
  });
});

// Auth Middleware — applied to all /api routes (public paths are exempted inside middleware)
app.use('/api', authMiddleware);

// API Route Registration
app.use('/api/auth', authRoutes);
app.use('/api/methodologies', methodologyRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/artifacts', artifactRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/traceability', traceabilityRoutes);
app.use('/api/phase-gates', phaseGateRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/collaboration', collaborationRoutes);

// 404 Handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('API Error:', err.stack || err.message);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  SDLC Governance API v2.0 — Supabase Edition`);
  console.log(`  Running on http://localhost:${PORT}`);
  console.log(`  Database: Supabase PostgreSQL`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`====================================================`);
});
