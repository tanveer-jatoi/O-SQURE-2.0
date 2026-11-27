import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { AppError } from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  getRefreshCookieOptions,
} from '../services/tokenService.js';
import { recordAuditLog } from '../services/auditService.js';

/**
 * Helper to fetch effective permissions for a user by merging their base role
 * permissions with any explicit customPermissions.
 */
async function resolveUserPermissions(user) {
  const roleDoc = await Role.findOne({ name: user.role }).lean();
  const basePerms = roleDoc?.permissions || [];
  return Array.from(new Set([...basePerms, ...(user.customPermissions || [])]));
}

/**
 * POST /api/v1/auth/login
 * Authenticates a user by email or username + password, enforces brute-force
 * lockout, rotates refresh token, and logs the authentication event.
 */
export const login = catchAsync(async (req, res, next) => {
  const { identifier, password } = req.body;
  const normalized = identifier.toLowerCase();

  const user = await User.findOne({
    $or: [{ email: normalized }, { username: normalized }],
  }).select('+passwordHash +failedLoginAttempts +lockUntil +refreshTokenHash');

  if (!user) {
    await recordAuditLog({
      req,
      action: 'AUTH_LOGIN_FAILED',
      targetEntity: 'User',
      status: 'failure',
      metadata: { reason: 'unknown_identifier', identifier: normalized },
    });
    return next(new AppError('Invalid credentials.', 401, 'INVALID_CREDENTIALS'));
  }

  if (user.status !== 'active') {
    await recordAuditLog({
      req,
      actor: user,
      action: 'AUTH_LOGIN_BLOCKED',
      targetEntity: 'User',
      targetEntityId: user._id,
      status: 'failure',
      metadata: { reason: `account_${user.status}` },
    });
    return next(
      new AppError(
        `Your account is ${user.status}. Please contact an administrator.`,
        403,
        'ACCOUNT_INACTIVE'
      )
    );
  }

  if (user.isCurrentlyLocked()) {
    const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
    await recordAuditLog({
      req,
      actor: user,
      action: 'AUTH_LOGIN_LOCKED',
      targetEntity: 'User',
      targetEntityId: user._id,
      status: 'failure',
      metadata: { minutesLeft },
    });
    return next(
      new AppError(
        `Account temporarily locked due to multiple failed attempts. Try again in ${minutesLeft} minute(s).`,
        423,
        'ACCOUNT_LOCKED'
      )
    );
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    await user.recordFailedLogin();
    await recordAuditLog({
      req,
      actor: user,
      action: 'AUTH_LOGIN_FAILED',
      targetEntity: 'User',
      targetEntityId: user._id,
      status: 'failure',
      metadata: { reason: 'wrong_password', attempts: user.failedLoginAttempts },
    });
    return next(new AppError('Invalid credentials.', 401, 'INVALID_CREDENTIALS'));
  }

  await user.resetLoginAttempts();

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshTokenHash = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  const permissions = await resolveUserPermissions(user);

  res.cookie('refreshToken', refreshToken, getRefreshCookieOptions());

  await recordAuditLog({
    req,
    actor: user,
    action: 'AUTH_LOGIN_SUCCESS',
    targetEntity: 'User',
    targetEntityId: user._id,
    status: 'success',
  });

  return sendSuccess(res, {
    message: 'Login successful.',
    data: {
      accessToken,
      user: {
        ...user.toJSON(),
        permissions,
      },
    },
  });
});

/**
 * POST /api/v1/auth/refresh
 * Issues a fresh Access Token and rotates the Refresh Token cookie after
 * verifying the incoming cookie token against the stored SHA-256 hash.
 */
export const refreshSession = catchAsync(async (req, res, next) => {
  const incomingToken = req.cookies?.refreshToken;
  if (!incomingToken) {
    return next(new AppError('Refresh token missing. Please log in.', 401, 'REFRESH_MISSING'));
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(incomingToken);
  } catch {
    return next(
      new AppError('Invalid or expired refresh token. Please log in.', 401, 'REFRESH_INVALID')
    );
  }

  if (decoded.tokenType !== 'refresh') {
    return next(new AppError('Invalid token type.', 401, 'INVALID_TOKEN_TYPE'));
  }

  const user = await User.findById(decoded.sub).select('+refreshTokenHash');
  if (!user || user.status !== 'active') {
    return next(new AppError('User not found or inactive.', 401, 'USER_UNAVAILABLE'));
  }

  const incomingHash = hashToken(incomingToken);
  if (!user.refreshTokenHash || user.refreshTokenHash !== incomingHash) {
    // Possible token reuse detected: revoke stored refresh token immediately
    user.refreshTokenHash = null;
    await user.save({ validateBeforeSave: false });

    await recordAuditLog({
      req,
      actor: user,
      action: 'AUTH_REFRESH_REUSE_DETECTED',
      targetEntity: 'User',
      targetEntityId: user._id,
      status: 'failure',
    });

    return next(
      new AppError('Session compromised or revoked. Please log in again.', 401, 'TOKEN_REVOKED')
    );
  }

  // Rotate refresh token
  const newAccessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);
  user.refreshTokenHash = hashToken(newRefreshToken);
  await user.save({ validateBeforeSave: false });

  res.cookie('refreshToken', newRefreshToken, getRefreshCookieOptions());

  return sendSuccess(res, {
    message: 'Session refreshed.',
    data: { accessToken: newAccessToken },
  });
});

/**
 * POST /api/v1/auth/logout
 * Clears the stored refresh token hash and expires the browser cookie.
 */
export const logout = catchAsync(async (req, res) => {
  const incomingToken = req.cookies?.refreshToken;
  let user = req.user || null;

  if (!user && incomingToken) {
    try {
      const decoded = verifyRefreshToken(incomingToken);
      user = await User.findById(decoded.sub);
    } catch {
      // Ignore invalid token on logout
    }
  }

  if (user) {
    user.refreshTokenHash = null;
    await user.save({ validateBeforeSave: false });
    await recordAuditLog({
      req,
      actor: user,
      action: 'AUTH_LOGOUT',
      targetEntity: 'User',
      targetEntityId: user._id,
      status: 'success',
    });
  }

  res.clearCookie('refreshToken', {
    ...getRefreshCookieOptions(),
    maxAge: undefined,
  });

  return sendSuccess(res, {
    message: 'Logged out successfully.',
    data: null,
  });
});

/**
 * GET /api/v1/auth/me
 * Returns the authenticated user's profile and resolved RBAC permissions.
 */
export const getMe = catchAsync(async (req, res) => {
  const permissions = await resolveUserPermissions(req.user);
  return sendSuccess(res, {
    message: 'Authenticated user retrieved.',
    data: {
      user: {
        ...req.user.toJSON(),
        permissions,
      },
    },
  });
});

/**
 * PATCH /api/v1/auth/change-password
 * Verifies current password, updates password hash, invalidates prior tokens,
 * and rotates the user's active session.
 */
export const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+passwordHash +refreshTokenHash');
  const isCurrentValid = await user.comparePassword(currentPassword);

  if (!isCurrentValid) {
    return next(
      new AppError('Current password is incorrect.', 401, 'INCORRECT_CURRENT_PASSWORD')
    );
  }

  user.passwordHash = newPassword; // Pre-save hook hashes this automatically
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshTokenHash = hashToken(refreshToken);

  await user.save();

  res.cookie('refreshToken', refreshToken, getRefreshCookieOptions());

  await recordAuditLog({
    req,
    actor: user,
    action: 'AUTH_PASSWORD_CHANGED',
    targetEntity: 'User',
    targetEntityId: user._id,
    status: 'success',
  });

  return sendSuccess(res, {
    message: 'Password updated successfully.',
    data: { accessToken },
  });
});
