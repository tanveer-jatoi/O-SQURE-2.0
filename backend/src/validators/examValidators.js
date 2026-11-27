import { z } from 'zod';

export const createExamSchema = z.object({
  title: z.string().trim().min(3).max(150),
  courseId: z.string().min(1),
  term: z.enum(['quiz', 'midterm', 'final', 'project']),
  startDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Valid startDate required'),
  endDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Valid endDate required'),
});

export const addExamSubjectSchema = z.object({
  subjectId: z.string().min(1),
  examDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Valid examDate required'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM 24-hour format'),
  totalMarks: z.coerce.number().int().min(10).max(500).default(100),
  passingMarks: z.coerce.number().int().min(1).max(500).default(50),
});

export const publishExamSchema = z.object({
  isPublished: z.boolean(),
});

export const enterMarksSchema = z.object({
  examSubjectId: z.string().min(1),
  batchId: z.string().min(1),
  entries: z
    .array(
      z.object({
        studentId: z.string().min(1),
        marksObtained: z.coerce.number().min(0).default(0),
        isAbsent: z.boolean().default(false),
      })
    )
    .min(1, 'At least one student mark entry is required'),
});
