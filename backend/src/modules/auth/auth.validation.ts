import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    identifier: z
      .string()
      .trim()
      .min(1, 'Email, enrollment number, or faculty ID is required'),

    password: z
      .string()
      .min(1, 'Password is required'),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(1, 'Current password required'),
    newPassword: z
      .string()
      .min(8, 'Min 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/,
        'Must contain uppercase, lowercase, number, special char'
      ),
  }),
});