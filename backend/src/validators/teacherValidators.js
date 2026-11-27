import { z } from 'zod';

const strongPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[0-9]/, 'Password must include a number');

export const createTeacherSchema = z.object({
  username: z.string().trim().min(3).max(40),
  email: z.string().trim().email('Valid email is required'),
  password: strongPassword,
  fullName: z.string().trim().min(2).max(100),
  cnic: z.string().trim().min(5).max(25),
  contactPhone: z.string().trim().min(7).max(20),
  qualification: z.string().trim().min(2).max(150),
  specializations: z.array(z.string().trim()).optional(),
  joiningDate: z.string().optional(),
});

export const updateTeacherSchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
  contactPhone: z.string().trim().min(7).max(20).optional(),
  qualification: z.string().trim().min(2).max(150).optional(),
  specializations: z.array(z.string().trim()).optional(),
  status: z.enum(['active', 'on_leave', 'resigned']).optional(),
});
