import { z } from 'zod';
import { UserRole } from '@prisma/client';

const sessionSchema = z
  .string()
  .trim()
  .min(1, 'Academic session is required');

export const createUserSchema = z.object({
  body: z
    .object({
      email: z
        .string()
        .email()
        .transform((v) => v.toLowerCase().trim()),

      firstName: z
        .string()
        .min(2)
        .trim(),

      lastName: z
        .string()
        .min(1)
        .trim(),

      role: z.enum([
        'STUDENT',
        'FACULTY',
        'SUBADMIN',
      ]),

      department: z
        .string()
        .min(1)
        .trim(),

      facultyId: z
        .string()
        .optional()
        .transform((v) => v?.trim().toUpperCase()),

      enrollmentNo: z
        .string()
        .optional()
        .transform((v) => v?.trim().toUpperCase()),

      session: z
        .string()
        .optional()
        .transform((v) => v?.trim()),

      semester: z
        .number()
        .int()
        .min(1)
        .max(12)
        .optional(),

      section: z
        .string()
        .optional()
        .transform((v) => v?.trim().toUpperCase()),

      designation: z.string().optional(),

      phone: z.string().optional(),
    })
    .refine(
      (d) => d.role !== 'STUDENT' || Boolean(d.enrollmentNo),
      {
        message: 'Enrollment required for students',
        path: ['enrollmentNo'],
      },
    )
    .refine(
      (d) => d.role !== 'STUDENT' || Boolean(d.session),
      {
        message: 'Academic session is required for students',
        path: ['session'],
      },
    ),
});

export const csvRowSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name is required')
      .transform((v) => v.trim()),

    email: z
      .string()
      .email('Invalid email')
      .transform((v) => v.toLowerCase().trim()),

    id: z
      .string()
      .transform((v) => v.trim().toUpperCase()),

    role: z
      .string()
      .transform((v) => v.trim().toLowerCase())
      .pipe(
        z.enum([
          'student',
          'faculty',
          'subadmin',
        ]),
      ),

    department: z
      .string()
      .min(1, 'Department is required')
      .transform((v) => v.trim().toUpperCase()),

    session: z
      .string()
      .optional()
      .default('')
      .transform((v) => (v || '').trim()),

    section: z
      .string()
      .optional()
      .default('')
      .transform((v) => (v || '').trim().toUpperCase()),

    phone: z
      .string()
      .optional()
      .default('')
      .transform((v) => (v || '').trim()),
  })
  .refine(
    (d) => d.role !== 'student' || Boolean(d.id),
    {
      message: 'Student enrollment ID is required',
      path: ['id'],
    },
  )
  .refine(
    (d) => d.role !== 'student' || Boolean(d.session),
    {
      message: 'Academic session is required for students',
      path: ['session'],
    },
  );

export const listUsersSchema = z.object({
  query: z.object({
    page: z.string().optional(),

    limit: z.string().optional(),

    role: z
      .nativeEnum(UserRole)
      .optional(),

    department: z
      .string()
      .optional(),

    search: z
      .string()
      .optional(),

    isActive: z
      .enum(['true', 'false'])
      .optional(),

    sortBy: z
      .enum([
        'firstName',
        'lastName',
        'email',
        'createdAt',
        'enrollmentNo',
      ])
      .optional(),

    sortOrder: z
      .enum(['asc', 'desc'])
      .optional(),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    firstName: z
      .string()
      .min(2)
      .optional(),

    lastName: z
      .string()
      .min(1)
      .optional(),

    department: z
      .string()
      .optional(),

    session: sessionSchema.optional(),

    semester: z
      .number()
      .int()
      .min(1)
      .max(12)
      .optional(),

    section: z
      .string()
      .optional(),

    designation: z
      .string()
      .optional(),

    phone: z
      .string()
      .optional(),
  }),
});
