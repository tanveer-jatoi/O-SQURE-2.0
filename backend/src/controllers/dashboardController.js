import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * GET /api/v1/dashboard/summary
 * Returns live, role-scoped summary metrics from MongoDB.
 */
export const getDashboardSummary = catchAsync(async (req, res) => {
  const { role } = req.user;

  if (role === 'superadmin' || role === 'admin') {
    const userFilter =
      role === 'admin' ? { role: { $in: ['admin', 'teacher', 'student'] } } : {};

    const [roleCounts, activeCount, totalCount, recentLogs] = await Promise.all([
      User.aggregate([
        { $match: userFilter },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      User.countDocuments({ ...userFilter, status: 'active' }),
      User.countDocuments(userFilter),
      AuditLog.find()
        .populate('actorUserId', 'fullName username role')
        .sort({ timestamp: -1 })
        .limit(8)
        .lean(),
    ]);

    const byRole = { superadmin: 0, admin: 0, teacher: 0, student: 0 };
    roleCounts.forEach((item) => {
      byRole[item._id] = item.count;
    });

    return sendSuccess(res, {
      message: 'Dashboard summary retrieved.',
      data: {
        stats: {
          totalUsers: totalCount,
          activeUsers: activeCount,
          byRole,
          uptimeSeconds: Math.floor(process.uptime()),
        },
        recentAuditLogs: recentLogs,
      },
    });
  }

  // Teacher & Student summaries will expand dynamically as Phases 12-18 models are added
  return sendSuccess(res, {
    message: 'Dashboard summary retrieved.',
    data: {
      stats: {
        role,
        accountStatus: req.user.status,
        lastLogin: req.user.lastLogin,
      },
    },
  });
});
