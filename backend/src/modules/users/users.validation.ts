import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email().transform(v => v.toLowerCase().trim()),
    firstName: z.string().min(2).trim(),
    lastName: z.string().min(1).trim(),
    role: z.enum(['STUDENT', 'FACULTY', 'SUBADMIN']),
    department: z.string().min(1).trim(),
    facultyId: z.string().optional().transform(v => v?.trim().toUpperCase()),
    enrollmentNo: z.string().optional().transform(v => v?.trim().toUpperCase()),
    semester: z.number().int().min(1).max(12).optional(),
    section: z.string().optional().transform(v => v?.trim().toUpperCase()),
    designation: z.string().optional(),
    phone: z.string().optional(),
  }).refine(d => !(d.role === 'STUDENT' && !d.enrollmentNo), {
    message: 'Enrollment required for students', path: ['enrollmentNo'],
  }),
});

export const csvRowSchema = z.object({
  name: z.string().min(2).transform(v => v.trim()),
  email: z.string().email().transform(v => v.toLowerCase().trim()),
  enrollment: z.string().transform(v => v?.trim().toUpperCase() || '').optional().default(''),
  role: z.string().transform(v => v.trim().toLowerCase()).pipe(z.enum(['student', 'faculty'])),
  department: z.string().min(1).transform(v => v.trim().toUpperCase()),
}).refine(d => !(d.role === 'student' && (!d.enrollment || d.enrollment === '')), {
  message: 'Enrollment required for students', path: ['enrollment'],
});

export const listUsersSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    role: z.nativeEnum(UserRole).optional(),
    department: z.string().optional(),
    search: z.string().optional(),
    isActive: z.enum(['true', 'false']).optional(),
    sortBy: z.enum(['firstName', 'lastName', 'email', 'createdAt', 'enrollmentNo']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(1).optional(),
    department: z.string().optional(),
    semester: z.number().int().min(1).max(12).optional(),
    section: z.string().optional(),
    designation: z.string().optional(),
    phone: z.string().optional(),
  }),
});