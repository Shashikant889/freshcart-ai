const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'freshcart-ai-secret-key-2025';
const JWT_EXPIRES = '7d';

/**
 * Required authentication middleware
 */
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

/**
 * Optional authentication — sets req.user if token present, continues either way
 */
function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      // Invalid token — continue without user
    }
  }
  next();
}

/**
 * Admin-only middleware (must be chained after requireAuth)
 */
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

module.exports = { requireAuth, optionalAuth, requireAdmin, generateToken, JWT_SECRET };
