import { z } from 'zod';

export const createUserSchema = z.object({
  username: z
    .string({ required_error: 'Username is required' })
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(40, 'Username cannot exceed 40 characters')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username can only contain letters, numbers, dots, underscores, or hyphens'),
  email: z.string({ required_error: 'Email is required' }).trim().email('Valid email is required'),
  fullName: z.string({ required_error: 'Full name is required' }).trim().min(2).max(100),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must include an uppercase letter')
    .regex(/[a-z]/, 'Password must include a lowercase letter')
    .regex(/[0-9]/, 'Password must include a number'),
  role: z.enum(['superadmin', 'admin', 'teacher', 'student']),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended']),
});
