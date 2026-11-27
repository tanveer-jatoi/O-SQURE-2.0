import { AuditLog } from '../models/AuditLog.js';

/**
 * Extracts the client IP address safely from Express request headers or socket.
 */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

/**
 * Writes an immutable audit event to MongoDB without interrupting the main flow
 * if an unexpected logging failure occurs.
 */
export async function recordAuditLog({
  req,
  actor = null,
  action,
  targetEntity,
  targetEntityId = null,
  status = 'success',
  metadata = {},
}) {
  try {
    await AuditLog.create({
      actorUserId: actor?._id || req.user?._id || null,
      actorRole: actor?.role || req.user?.role || 'anonymous',
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || 'unknown',
      action,
      targetEntity,
      targetEntityId: targetEntityId ? String(targetEntityId) : null,
      status,
      metadata,
    });
  } catch (err) {
    console.error('[AUDIT LOG ERROR]', err.message);
  }
}
