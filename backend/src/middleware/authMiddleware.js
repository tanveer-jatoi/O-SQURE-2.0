import { User } from '../models/User.js';
import { verifyAccessToken } from '../services/tokenService.js';
import { AppError } from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';

/**
 * Authentication middleware ("protect").
 * Extracts the Bearer JWT, validates signature/expiry, verifies the user still
 * exists and is active, and checks if password was changed after token issuance.
 */
export const protect = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Authentication required. Please log in.', 401, 'AUTH_REQUIRED'));
  }

  const decoded = verifyAccessToken(token);

  const user = await User.findById(decoded.sub).select('+passwordChangedAt');
  if (!user) {
    return next(
      new AppError('The account belonging to this token no longer exists.', 401, 'USER_NOT_FOUND')
    );
  }

  if (user.status !== 'active') {
    return next(
      new AppError(
        `Your account is currently ${user.status}. Contact an administrator.`,
        403,
        'ACCOUNT_INACTIVE'
      )
    );
  }

  if (user.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'Your password was recently changed. Please log in again.',
        401,
        'PASSWORD_CHANGED_RELOGIN'
      )
    );
  }

  req.user = user;
  return next();
});

/**
 * Role-Based Access Control (RBAC) middleware.
 * Rejects any authenticated user whose role is not listed in `allowedRoles`.
 */
export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'AUTH_REQUIRED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          'Access denied. You do not have permission to perform this action.',
          403,
          'FORBIDDEN_ROLE'
        )
      );
    }

    return next();
  };
}

/**
 * Resource Ownership Guard.
 * Allows privileged roles (e.g. superadmin, admin) to proceed, or allows the
 * user if req.params[paramName] matches their own user ID.
 */
export function authorizeSelfOrRoles(paramName = 'id', ...bypassRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'AUTH_REQUIRED'));
    }

    if (bypassRoles.includes(req.user.role)) {
      return next();
    }

    const targetId = req.params[paramName];
    if (targetId && targetId === req.user._id.toString()) {
      return next();
    }

    return next(
      new AppError('Access denied. You may only access your own resource.', 403, 'FORBIDDEN_OWNER')
    );
  };
}
