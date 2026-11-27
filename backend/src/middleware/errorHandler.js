import { AppError } from '../utils/appError.js';
import { env } from '../config/env.js';

function handleCastErrorDB(err) {
  return new AppError(`Invalid ${err.path}: ${err.value}`, 400, 'INVALID_IDENTIFIER');
}

function handleDuplicateFieldsDB(err) {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  return new AppError(
    `A record with that ${field} already exists.`,
    409,
    'DUPLICATE_RESOURCE'
  );
}

function handleValidationErrorDB(err) {
  const details = Object.values(err.errors).map((el) => ({
    field: el.path,
    message: el.message,
  }));
  return new AppError('Input validation failed.', 400, 'VALIDATION_ERROR', details);
}

/**
 * Global Express error-handling middleware.
 * Normalizes Mongoose/JWT/operational errors and hides internal stacks in production.
 */
export function globalErrorHandler(err, req, res, next) {
  let error = err;

  if (!(error instanceof AppError)) {
    if (err.name === 'CastError') {
      error = handleCastErrorDB(err);
    } else if (err.code === 11000) {
      error = handleDuplicateFieldsDB(err);
    } else if (err.name === 'ValidationError') {
      error = handleValidationErrorDB(err);
    } else if (err.name === 'JsonWebTokenError') {
      error = new AppError('Invalid authentication token.', 401, 'INVALID_TOKEN');
    } else if (err.name === 'TokenExpiredError') {
      error = new AppError('Your session has expired. Please log in again.', 401, 'TOKEN_EXPIRED');
    } else {
      error = new AppError(
        err.message || 'An unexpected server error occurred.',
        err.statusCode || 500,
        'INTERNAL_SERVER_ERROR'
      );
      error.isOperational = false;
    }
  }

  const statusCode = error.statusCode || 500;

  if (env.nodeEnv === 'development') {
    return res.status(statusCode).json({
      success: false,
      status: error.status,
      errorCode: error.errorCode,
      message: error.message,
      details: error.details || undefined,
      stack: err.stack,
    });
  }

  // Production: never leak internal programming errors
  if (error.isOperational) {
    return res.status(statusCode).json({
      success: false,
      status: error.status,
      errorCode: error.errorCode,
      message: error.message,
      details: error.details || undefined,
    });
  }

  console.error('[CRITICAL ERROR]', err);
  return res.status(500).json({
    success: false,
    status: 'error',
    errorCode: 'INTERNAL_SERVER_ERROR',
    message: 'Something went wrong. Please contact the system administrator.',
  });
}
