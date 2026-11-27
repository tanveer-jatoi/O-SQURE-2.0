import crypto from 'crypto';
import QRCode from 'qrcode';

const EPHEMERAL_TTL_SECONDS = 30;

/**
 * Generates a cryptographically strong per-session HMAC secret.
 */
export function generateSessionSecret() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Builds a short-lived HMAC-SHA256 signed token (valid for 30 seconds)
 * and renders it as a PNG data URL for the teacher's screen.
 */
export async function createEphemeralQrPayload(sessionId, sessionSecret) {
  const nowSec = Math.floor(Date.now() / 1000);
  const payloadObj = {
    sid: String(sessionId),
    nonce: crypto.randomBytes(6).toString('hex'),
    exp: nowSec + EPHEMERAL_TTL_SECONDS,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', sessionSecret)
    .update(payloadB64)
    .digest('hex');

  const token = `${payloadB64}.${signature}`;
  const qrDataUrl = await QRCode.toDataURL(token, {
    width: 320,
    margin: 2,
    errorCorrectionLevel: 'M',
  });

  return {
    token,
    qrDataUrl,
    expiresAtUnix: payloadObj.exp,
    ttlSeconds: EPHEMERAL_TTL_SECONDS,
  };
}

/**
 * Extracts the sessionId from a token before signature verification so the
 * server can load the matching sessionSecret from MongoDB.
 */
export function parseQrTokenUnverified(token) {
  if (typeof token !== 'string' || !token.includes('.')) {
    return null;
  }
  const [payloadB64, signature] = token.split('.');
  if (!payloadB64 || !signature) return null;

  try {
    const json = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload = JSON.parse(json);
    if (!payload?.sid || !payload?.exp) return null;
    return { payloadB64, signature, payload };
  } catch {
    return null;
  }
}

/**
 * Verifies the HMAC-SHA256 signature (constant-time) and 30-second expiry.
 */
export function verifyQrTokenSignature(parsed, sessionSecret) {
  const expectedSig = crypto
    .createHmac('sha256', sessionSecret)
    .update(parsed.payloadB64)
    .digest('hex');

  const actualBuf = Buffer.from(parsed.signature, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');

  if (actualBuf.length !== expectedBuf.length) {
    return { valid: false, reason: 'INVALID_SIGNATURE' };
  }

  if (!crypto.timingSafeEqual(actualBuf, expectedBuf)) {
    return { valid: false, reason: 'INVALID_SIGNATURE' };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (parsed.payload.exp < nowSec) {
    return { valid: false, reason: 'QR_TOKEN_EXPIRED' };
  }

  return { valid: true };
}
