const supabase = require('../config/supabase');
const { error } = require('../utils/apiResponse');

/**
 * Verify a Supabase JWT using auth.getUser().
 * Populates req.user = { sub, email, role, name, status }
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return error(res, 'Missing bearer token', 401);

  try {
    const { data, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !data?.user) return error(res, 'Invalid or expired token', 401);

    const u = data.user;
    const meta = u.user_metadata || {};
    const appMeta = u.app_metadata || {};

    req.user = {
      sub:    u.id,
      email:  u.email,
      role:   appMeta.role  || meta.role  || 'student',
      name:   meta.name     || meta.full_name || u.email,
      status: appMeta.status || meta.status || 'active',
    };
    next();
  } catch (err) {
    return error(res, 'Token verification failed', 401);
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

// Legacy helper — kept for backward compat but no longer signs custom JWTs
function createAuthToken() {
  throw new Error('createAuthToken is deprecated — use Supabase Auth');
}

module.exports = {
  createAuthToken,
  authenticateToken,
  requireAdmin,
  requireManager,
  requireManagerOrAdmin
};
