import crypto from 'crypto';

/**
 * Generates a readable, collision-resistant business identifier
 * e.g., OSQ-STU-2026-A4F9, OSQ-FAC-2026-8B1C, ADM-2026-3E92
 */
export function generateCode(prefix) {
  const year = new Date().getFullYear();
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${prefix}-${year}-${suffix}`;
}
