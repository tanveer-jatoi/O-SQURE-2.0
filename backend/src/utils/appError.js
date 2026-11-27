/**
 * Represents a predictable, operational application error (e.g., 400 Bad Request,
 * 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict).
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
