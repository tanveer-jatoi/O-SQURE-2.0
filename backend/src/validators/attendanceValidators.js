import { z } from 'zod';

export const createAttendanceSessionSchema = z.object({
  batchId: z.string().min(1, 'Batch is required'),
  durationMinutes: z.coerce.number().int().min(5).max(180).default(15),
  lateThresholdMinutes: z.coerce.number().int().min(0).max(60).default(15),
});

export const scanQrSchema = z.object({
  token: z.string({ required_error: 'QR token is required' }).min(10, 'Invalid QR token'),
});

export const manualCorrectionSchema = z.object({
  status: z.enum(['present', 'absent', 'late', 'excused']),
  reason: z.string().trim().min(3, 'Correction reason is required').max(300),
});
