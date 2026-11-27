import rateLimit from 'express-rate-limit';

/**
 * Strict rate limiter for authentication endpoints (login, refresh, password resets)
 * to defend against credential stuffing and brute-force attacks.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    errorCode: 'AUTH_RATE_LIMIT',
    message: 'Too many authentication attempts. Please wait 15 minutes before retrying.',
  },
});

export const qrScanLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    errorCode: 'SCAN_RATE_LIMIT',
    message: 'Too many QR scan attempts. Please wait a moment.',
  },
});
