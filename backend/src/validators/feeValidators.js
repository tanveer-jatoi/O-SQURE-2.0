import { z } from 'zod';

export const createFeeStructureSchema = z.object({
  title: z.string().trim().min(3).max(120),
  courseId: z.string().min(1),
  admissionFee: z.coerce.number().min(0).default(0),
  tuitionFee: z.coerce.number().min(0),
  labFee: z.coerce.number().min(0).default(0),
  examFee: z.coerce.number().min(0).default(0),
  defaultDueDateDay: z.coerce.number().int().min(1).max(28).default(10),
  lateFineAmount: z.coerce.number().min(0).default(500),
});

export const assignStudentFeeSchema = z.object({
  studentId: z.string().min(1),
  feeStructureId: z.string().min(1),
  discountPercentage: z.coerce.number().min(0).max(100).default(0),
  scholarshipAmount: z.coerce.number().min(0).default(0),
});

export const generateVoucherSchema = z.object({
  studentId: z.string().min(1),
  billingMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Use YYYY-MM format (e.g. 2026-11)'),
  description: z.string().trim().min(3).max(200),
  dueDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Valid dueDate is required'),
  includeAdmission: z.boolean().default(false),
  includeExam: z.boolean().default(false),
  lateCharges: z.coerce.number().min(0).default(0),
});

export const applyLateFineSchema = z.object({
  lateCharges: z.coerce.number().min(1, 'Late charge must be greater than 0'),
});
