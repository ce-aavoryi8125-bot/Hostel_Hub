const { error } = require('../utils/apiResponse');

const isProduction = process.env.NODE_ENV === 'production';

const errorHandler = (err, req, res, next) => {
  const errMsg = err?.message || (typeof err === 'string' ? err : JSON.stringify(err));
  if (err?.stack) {
    console.error('🔥 Error:', err.stack);
  } else {
    console.error('🔥 Error:', errMsg, '| Path:', req?.path);
  }

  let message = errMsg || 'Server error';
  let statusCode = err.statusCode || 500;

  // Supabase unique constraint violation (PostgreSQL error code 23505)
  if (err.code === '23505') {
    message = 'A record with this information already exists.';
    statusCode = 409;
  }

  // Sanitize 500 errors in production to avoid leaking database internals or stack traces
  if (isProduction && statusCode === 500) {
    message = 'An internal server error occurred. Please try again later.';
  }

  error(res, message, statusCode);
};

// Async wrapper to avoid try/catch in routes
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { errorHandler, asyncHandler };
