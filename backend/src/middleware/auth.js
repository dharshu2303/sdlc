const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sdlc_governance_jwt_secret_2026_change_in_production';

// Paths that don't require authentication
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/health'
];

const authMiddleware = (req, res, next) => {
  // Allow public paths
  const fullPath = req.baseUrl + req.path;
  if (PUBLIC_PATHS.some(p => fullPath.startsWith(p))) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please provide a valid Bearer token.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Authentication token is missing.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      systemRole: decoded.systemRole
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Authentication token has expired. Please login again.' });
    }
    return res.status(401).json({ error: 'Invalid authentication token.' });
  }
};

// Role-based authorization middleware factory
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    
    const userRoles = [req.user.role, req.user.systemRole].filter(Boolean);
    const hasRole = roles.some(r => userRoles.includes(r));
    
    if (!hasRole) {
      return res.status(403).json({ error: `Access denied. Required role: ${roles.join(' or ')}` });
    }
    next();
  };
};

module.exports = authMiddleware;
module.exports.requireRole = requireRole;
module.exports.JWT_SECRET = JWT_SECRET;
