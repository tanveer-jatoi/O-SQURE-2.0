import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Generates a short-lived JWT Access Token used on API Authorization headers.
 */
export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
    },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpiresIn }
  );
}

/**
 * Generates a long-lived JWT Refresh Token stored inside an HttpOnly cookie.
 */
export function signRefreshToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      tokenType: 'refresh',
    },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiresIn }
  );
}

/**
 * Verifies an Access Token signature and expiry.
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}

/**
 * Verifies a Refresh Token signature and expiry.
 */
export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}

/**
 * Creates a one-way SHA-256 hash of a refresh token before storing it in MongoDB.
 * Even if the database is leaked, raw refresh tokens cannot be reconstructed.
 */
export function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Cookie options for the refresh token HttpOnly cookie.
 */
export function getRefreshCookieOptions() {
  const isProd = env.nodeEnv === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/v1/auth',
  };
}
