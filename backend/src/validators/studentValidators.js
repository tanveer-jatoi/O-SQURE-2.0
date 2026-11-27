import { z } from 'zod';

const strongPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[0-9]/, 'Password must include a number');

export const createStudentSchema = z.object({
  username: z.string().trim().min(3).max(40),
  email: z.string().trim().email('Valid email is required'),
  password: strongPassword,
  fullName: z.string().trim().min(2).max(100),
  fatherName: z.string().trim().min(2).max(100),
  cnicBForm: z.string().trim().min(5).max(25),
  gender: z.enum(['male', 'female', 'other']),
  dob: z.string().refine((val) => !Number.isNaN(Date.parse(val)), 'Valid date of birth is required'),
  contactPhone: z.string().trim().min(7).max(20),
  guardianPhone: z.string().trim().min(7).max(20),
  address: z.string().trim().min(5).max(300),
});

export const updateStudentSchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
  fatherName: z.string().trim().min(2).max(100).optional(),
  contactPhone: z.string().trim().min(7).max(20).optional(),
  guardianPhone: z.string().trim().min(7).max(20).optional(),
  address: z.string().trim().min(5).max(300).optional(),
  academicStatus: z.enum(['active', 'graduated', 'dropped', 'suspended']).optional(),
});
