const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const { connectDB } = require('./config/db');
const authMiddleware = require('./middleware/auth');
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

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Auth Middleware applied to API routes (with fallback for demo ease)
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

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', system: 'SDLC Documentation Governance Platform API', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`  SDLC Governance API running on http://localhost:${PORT}`);
  console.log(`====================================================`);
  await connectDB();
});
