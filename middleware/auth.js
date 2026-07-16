const jwt = require('jsonwebtoken');
const { error } = require('../utils/apiResponse');

const JWT_SECRET = process.env.JWT_SECRET || 'hostel-hub-secret-key-2024';

/**
 * Creates a signed JWT for the given user.
 * @param {string} subject  - user UUID
 * @param {object} extra    - additional claims (role, name, email…)
 */
function createAuthToken(subject, extra = {}) {
  return jwt.sign({ sub: subject, ...extra }, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verifies the custom JWT issued by our /api/login and /api/signup endpoints.
 * req.user shape: { sub, email, role, name }
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) return error(res, 'Missing bearer token', 401);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      sub:   decoded.sub,
      email: decoded.email,
      role:  decoded.role  || 'student',
      name:  decoded.name  || ''
    };
    next();
  } catch (err) {
    return error(res, 'Invalid or expired token', 401);
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return error(res, 'Admin access only', 403);
  next();
}

function requireManager(req, res, next) {
  if (!req.user || req.user.role !== 'manager') return error(res, 'Manager access only', 403);
  next();
}

function requireManagerOrAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'manager' && req.user.role !== 'admin')) {
    return error(res, 'Manager or Admin access only', 403);
  }
  next();
}

module.exports = {
  createAuthToken,
  authenticateToken,
  requireAdmin,
  requireManager,
  requireManagerOrAdmin
};
