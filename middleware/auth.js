const jwt = require('jsonwebtoken');
const { error } = require('../utils/apiResponse');

const JWT_SECRET = process.env.JWT_SECRET || 'hostel-hub-secret';

function createAuthToken(subject, extra = {}) {
  return jwt.sign({ sub: subject, ...extra }, JWT_SECRET, { expiresIn: '7d' });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  if (!token) return error(res, 'Missing bearer token', 401);
  
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return error(res, 'Invalid token', 401);
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
  if (!req.user || (req.user.role !== 'manager' && req.user.role !== 'admin')) return error(res, 'Manager or Admin access only', 403);
  next();
}

module.exports = {
  createAuthToken,
  authenticateToken,
  requireAdmin,
  requireManager,
  requireManagerOrAdmin
};
