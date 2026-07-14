const { error } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  console.error('🔥 Error:', err.stack);

  let message = err.message || 'Server error';
  let statusCode = err.statusCode || 500;

  // Mongoose duplicate key
  if (err.code === 11000) {
    message = 'Duplicate field value entered';
    statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const values = Object.values(err.errors).map(val => val.message);
    message = values.join(', ');
    statusCode = 400;
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    message = `Resource not found with id of ${err.value}`;
    statusCode = 404;
  }

  error(res, message, statusCode);
};

// Async wrapper to avoid try/catch blocks in routes
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { errorHandler, asyncHandler };
