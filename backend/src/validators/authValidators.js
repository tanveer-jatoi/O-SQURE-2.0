import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z
    .string({ required_error: 'Email or username is required' })
    .trim()
    .min(3, 'Identifier must be at least 3 characters'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters'),
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: 'Current password is required' })
    .min(1, 'Current password is required'),
  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(8, 'New password must be at least 8 characters')
    .regex(/[A-Z]/, 'New password must include at least one uppercase letter')
    .regex(/[a-z]/, 'New password must include at least one lowercase letter')
    .regex(/[0-9]/, 'New password must include at least one number'),
});
