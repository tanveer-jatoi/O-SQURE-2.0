import { User } from '../models/User.js';
import { AppError } from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { recordAuditLog } from '../services/auditService.js';

/**
 * GET /api/v1/users
 * Super Admin sees all accounts. Admin sees operational accounts (teacher, student, admin).
 */
export const listUsers = catchAsync(async (req, res) => {
  const { role, status, search, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (status) filter.status = status;

  // Admin cannot inspect or tamper with Super Admin accounts
  if (req.user.role === 'admin' && !role) {
    filter.role = { $in: ['admin', 'teacher', 'student'] };
  }

  if (search) {
    const regex = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ fullName: regex }, { email: regex }, { username: regex }];
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    User.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    message: 'Users retrieved successfully.',
    data: { users },
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * POST /api/v1/users
 * Creates a new user account. Enforces strict privilege boundary:
 * Only Super Admin can create Super Admin or Admin accounts.
 */
export const createUser = catchAsync(async (req, res, next) => {
  const { username, email, fullName, password, role, status } = req.body;

  if (['superadmin', 'admin'].includes(role) && req.user.role !== 'superadmin') {
    return next(
      new AppError(
        'Only a Super Admin can create Admin or Super Admin accounts.',
        403,
        'PRIVILEGE_ESCALATION_BLOCKED'
      )
    );
  }

  const newUser = await User.create({
    username,
    email,
    fullName,
    passwordHash: password,
    role,
    status: status || 'active',
    createdBy: req.user._id,
  });

  await recordAuditLog({
    req,
    action: 'USER_CREATED',
    targetEntity: 'User',
    targetEntityId: newUser._id,
    metadata: { createdRole: role, username: newUser.username },
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'User account created successfully.',
    data: { user: newUser },
  });
});

/**
 * GET /api/v1/users/:id
 * Accessible by Super Admin, Admin, or the owning user themselves.
 */
export const getUserById = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError('User not found.', 404, 'USER_NOT_FOUND'));
  }

  if (user.role === 'superadmin' && req.user.role !== 'superadmin') {
    return next(new AppError('Access denied.', 403, 'FORBIDDEN_ROLE'));
  }

  return sendSuccess(res, {
    message: 'User retrieved successfully.',
    data: { user },
  });
});

/**
 * PATCH /api/v1/users/:id/status
 * Activates, deactivates, or suspends a user account.
 */
export const updateUserStatus = catchAsync(async (req, res, next) => {
  const targetUser = await User.findById(req.params.id);
  if (!targetUser) {
    return next(new AppError('User not found.', 404, 'USER_NOT_FOUND'));
  }

  if (targetUser._id.equals(req.user._id)) {
    return next(new AppError('You cannot change your own account status.', 400, 'SELF_LOCK_DENIED'));
  }

  if (['superadmin', 'admin'].includes(targetUser.role) && req.user.role !== 'superadmin') {
    return next(
      new AppError(
        'Only Super Admin can change the status of Admin or Super Admin accounts.',
        403,
        'FORBIDDEN_ROLE'
      )
    );
  }

  const previousStatus = targetUser.status;
  targetUser.status = req.body.status;
  if (req.body.status !== 'active') {
    targetUser.refreshTokenHash = null; // Immediately revoke active sessions
  }
  await targetUser.save({ validateBeforeSave: false });

  await recordAuditLog({
    req,
    action: 'USER_STATUS_UPDATED',
    targetEntity: 'User',
    targetEntityId: targetUser._id,
    metadata: { previousStatus, newStatus: req.body.status },
  });

  return sendSuccess(res, {
    message: `User status updated to ${targetUser.status}.`,
    data: { user: targetUser },
  });
});
