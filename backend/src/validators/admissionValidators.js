import { z } from 'zod';

export const createAdmissionSchema = z.object({
  candidateName: z.string().trim().min(2).max(100),
  fatherName: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  cnicBForm: z.string().trim().min(5).max(25),
  gender: z.enum(['male', 'female', 'other']),
  dob: z.string().refine((val) => !Number.isNaN(Date.parse(val)), 'Valid date of birth is required'),
  contactPhone: z.string().trim().min(7).max(20),
  guardianPhone: z.string().trim().min(7).max(20),
  address: z.string().trim().min(5).max(300),
  interestedCourseName: z.string().trim().min(2).max(120),
  notes: z.string().trim().max(500).optional(),
});

export const updateAdmissionStatusSchema = z.object({
  status: z.enum(['inquiry', 'interview_scheduled', 'approved', 'rejected']),
  notes: z.string().trim().max(500).optional(),
});

export const convertAdmissionSchema = z.object({
  username: z.string().trim().min(3).max(40),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must include an uppercase letter')
    .regex(/[a-z]/, 'Password must include a lowercase letter')
    .regex(/[0-9]/, 'Password must include a number'),
});
