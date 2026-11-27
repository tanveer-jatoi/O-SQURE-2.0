import { z } from 'zod';

export const createTimetableSlotSchema = z.object({
  batchId: z.string().min(1),
  courseId: z.string().min(1),
  subjectId: z.string().min(1),
  teacherId: z.string().min(1),
  classRoomId: z.string().min(1),
  dayOfWeek: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM'),
});

export const createAnnouncementSchema = z.object({
  title: z.string().trim().min(3).max(150),
  content: z.string().trim().min(5).max(2000),
  targetRole: z.enum(['all', 'teachers', 'students', 'batch_specific']).default('all'),
  targetBatchId: z.string().optional().nullable(),
  isPinned: z.boolean().default(false),
});

export const createMaterialSchema = z.object({
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().max(500).optional(),
  batchId: z.string().min(1),
  subjectId: z.string().min(1),
  resourceUrl: z.string().trim().url('Provide a valid resource URL (https://...)'),
  resourceType: z.enum(['pdf', 'slides', 'link', 'code']).default('pdf'),
});

export const updateSettingsSchema = z.object({
  campusName: z.string().trim().min(2).max(150).optional(),
  campusPhone: z.string().trim().max(40).optional(),
  campusEmail: z.string().trim().email().optional(),
  defaultLateThresholdMinutes: z.coerce.number().int().min(0).max(60).optional(),
  defaultLateFineAmount: z.coerce.number().min(0).optional(),
  attendanceQrRotationSeconds: z.coerce.number().int().min(10).max(60).optional(),
});
