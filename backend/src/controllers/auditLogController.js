import { AuditLog } from '../models/AuditLog.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * GET /api/v1/audit-logs
 * Returns paginated security and operational audit records for Super Admin & Admin.
 */
export const listAuditLogs = catchAsync(async (req, res) => {
  const { action, actorRole, status, page = 1, limit = 30 } = req.query;

  const filter = {};
  if (action) filter.action = String(action).toUpperCase();
  if (actorRole) filter.actorRole = actorRole;
  if (status) filter.status = status;

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 30));
  const skip = (pageNum - 1) * limitNum;

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('actorUserId', 'fullName username email role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    message: 'Audit logs retrieved.',
    data: { logs },
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});
