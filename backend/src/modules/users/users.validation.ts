import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const createUserSchema = z.object({
  body: z
    .object({
      email: z
        .string()
        .email()
        .transform(v => v.toLowerCase().trim()),

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
        .transform(v =>
          v?.trim().toUpperCase()
        ),

      enrollmentNo: z
        .string()
        .optional()
        .transform(v =>
          v?.trim().toUpperCase()
        ),

      semester: z
        .number()
        .int()
        .min(1)
        .max(12)
        .optional(),

      section: z
        .string()
        .optional()
        .transform(v =>
          v?.trim().toUpperCase()
        ),

      designation: z.string().optional(),

      phone: z.string().optional(),
    })
    .refine(
      d =>
        !(
          d.role === 'STUDENT' &&
          !d.enrollmentNo
        ),
      {
        message:
          'Enrollment required for students',
        path: ['enrollmentNo'],
      }
    ),
});

export const csvRowSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name is required')
      .transform(v => v.trim()),

    email: z
      .string()
      .email('Invalid email')
      .transform(v =>
        v.toLowerCase().trim()
      ),

    id: z
      .string()
      .transform(v =>
        v.trim().toUpperCase()
      ),

    role: z
      .string()
      .transform(v =>
        v.trim().toLowerCase()
      )
      .pipe(
        z.enum([
          'student',
          'faculty',
          'subadmin',
        ])
      ),

    department: z
      .string()
      .min(1, 'Department is required')
      .transform(v =>
        v.trim().toUpperCase()
      ),

    section: z
      .string()
      .optional()
      .default('')
      .transform(v =>
        (v || '').trim().toUpperCase()
      ),
  })
  .refine(
    d => {
      if (
        d.role === 'student' &&
        !d.id
      ) {
        return false;
      }

      return true;
    },
    {
      message:
        'Student enrollment ID is required',
      path: ['id'],
    }
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