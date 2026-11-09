import { z } from 'zod';

export const submitOnboardingSchema = z.object({
  fullName: z.string().min(2).max(100),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD'),
  address: z.string().min(5).max(255),
  nationalIdNumber: z.string().min(4).max(30),
  employmentStatus: z.enum(['EMPLOYED', 'SELF_EMPLOYED', 'STUDENT', 'RETIRED', 'UNEMPLOYED']),
  annualIncome: z.string().min(1),
  sourceOfFunds: z.string().min(2),
}).strict();

export const reviewOnboardingSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  notes: z.string().min(3, 'Review notes / rejection justification must be provided').max(500),
}).strict();
