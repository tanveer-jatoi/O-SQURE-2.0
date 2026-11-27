import { z } from 'zod';

export const createCourseSchema = z.object({
  courseCode: z.string().trim().min(2).max(20),
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().max(500).optional(),
  totalSemesters: z.coerce.number().int().min(1).max(12),
  durationMonths: z.coerce.number().int().min(1).max(60),
  baseFee: z.coerce.number().min(0),
});

export const createSubjectSchema = z.object({
  subjectCode: z.string().trim().min(2).max(25),
  title: z.string().trim().min(2).max(150),
  courseId: z.string().min(1),
  semester: z.coerce.number().int().min(1),
  creditHours: z.coerce.number().int().min(1).max(10),
  totalMarks: z.coerce.number().int().min(10).default(100),
  passingMarks: z.coerce.number().int().min(1).default(50),
});

export const createClassRoomSchema = z.object({
  roomName: z.string().trim().min(2).max(80),
  roomType: z.enum(['theory_room', 'computer_lab']),
  capacity: z.coerce.number().int().min(5).max(500),
});

export const createBatchSchema = z.object({
  batchCode: z.string().trim().min(2).max(30),
  courseId: z.string().min(1),
  classRoomId: z.string().min(1),
  assignedTeacherId: z.string().min(1),
  startDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Valid startDate is required'),
  expectedEndDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Valid expectedEndDate is required'),
  daysPattern: z.enum(['MWF', 'TTS', 'DAILY', 'WEEKEND']),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM 24-hour format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM 24-hour format'),
});

export const createEnrollmentSchema = z.object({
  studentId: z.string().min(1),
  batchId: z.string().min(1),
});
