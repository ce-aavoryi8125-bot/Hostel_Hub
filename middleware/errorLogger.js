const supabase = require('../config/supabase');

// Centralized error logger
async function logError({ level = 'error', source = 'api', message, stack = '', userId = null, req = null }) {
  const ip = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '') : '';
  const endpoint = req ? `${req.method} ${req.originalUrl || req.url}` : '';
  const payload = req && req.body ? req.body : {};

  // Remove sensitive fields before logging
  const safePayload = { ...payload };
  delete safePayload.password;
  delete safePayload.token;
  delete safePayload.refresh_token;

  try {
    await supabase.from('system_error_logs').insert({
      level,
      source,
      message: String(message || 'Unknown error'),
      stack_trace: String(stack || ''),
      user_id: userId,
      ip_address: String(ip),
      endpoint: String(endpoint),
      request_payload: safePayload,
      resolved: false
    });
  } catch (err) {
    console.error('⚠️  Failed to save error log to DB:', err.message);
  }
}

// Centralized audit trail logger
async function logAuditTrail(req, action, entityType = '', entityId = '', entityName = '', details = {}) {
  const userId = req?.user?.sub || null;
  const userName = req?.user?.name || req?.user?.email || 'System';
  const userRole = req?.user?.role || 'system';
  const ip = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '') : '';

  try {
    await supabase.from('audit_trail').insert({
      user_id: userId,
      user_name: String(userName),
      user_role: String(userRole),
      ip_address: String(ip),
      action: String(action),
      entity_type: String(entityType),
      entity_id: String(entityId),
      entity_name: String(entityName),
      details: details || {}
    });
  } catch (err) {
    console.warn('⚠️  Audit log write note:', err.message);
  }
}

module.exports = {
  logError,
  logAuditTrail
};
