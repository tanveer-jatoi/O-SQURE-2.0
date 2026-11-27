/**
 * Sends a uniform JSON success response across all O-Square 2.0 API endpoints.
 */
export function sendSuccess(res, { statusCode = 200, message = 'Success', data = null, meta = null } = {}) {
  const payload = {
    success: true,
    message,
    data,
  };

  if (meta) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
}
