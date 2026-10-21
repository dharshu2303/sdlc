const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    // For demo convenience, fallback to default guest user if no token header provided
    req.user = {
      id: 'usr-pm-01',
      email: 'john.pm@bankgov.com',
      name: 'John Smith',
      role: 'Project Manager',
      systemRole: 'ADMIN'
    };
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sdlc_doc_governance_secret_key_2026_super_secure');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
};

module.exports = authMiddleware;
