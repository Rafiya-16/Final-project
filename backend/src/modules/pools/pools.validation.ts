import { z } from 'zod';

export const createPoolSchema = z.object({
  body: z
    .object({
      name: z.string().min(3),

      academicYear: z.string().min(4),

      semester: z.string().min(1),

      department: z.string().optional(),

      // Faculty submission period
      submissionStart: z.string().datetime(),

      submissionEnd: z.string().datetime(),

      // SubAdmin review period
      reviewStart: z.string().datetime(),

      reviewEnd: z.string().datetime(),

      // Admin decision deadline
      decisionDeadline: z.string().datetime(),

      // Student project selection period
      selectionStart: z.string().datetime(),

      selectionEnd: z.string().datetime(),

      // Student idea submission period
      ideaSubmissionStart: z.string().datetime(),

      ideaSubmissionEnd: z.string().datetime(),

      // Team freeze
      teamFreezeDate: z.string().datetime(),

      minTeamSize: z
        .number()
        .int()
        .min(2)
        .max(5)
        .optional()
        .default(3),

      defaultMaxTeamSize: z
        .number()
        .int()
        .min(2)
        .max(5)
        .optional()
        .default(3),

      allowStudentIdeas: z
        .boolean()
        .optional()
        .default(true),

      subadminIds: z
        .array(z.string().uuid())
        .min(1, 'At least 1 subadmin'),

      facultyIds: z
        .array(z.string().uuid())
        .min(1, 'At least 1 faculty'),

      studentIds: z
        .array(z.string().uuid())
        .min(1, 'At least 1 student'),
    })

    // Faculty submission
    .refine(
      (d) =>
        new Date(d.submissionStart) <
        new Date(d.submissionEnd),
      {
        message:
          'submissionStart must be before submissionEnd',
        path: ['submissionEnd'],
      },
    )

    // Faculty submission must finish before review
    .refine(
      (d) =>
        new Date(d.submissionEnd) <=
        new Date(d.reviewStart),
      {
        message:
          'submissionEnd must be before/equal reviewStart',
        path: ['reviewStart'],
      },
    )

    // Review must finish before admin decision deadline
    .refine(
      (d) =>
        new Date(d.reviewEnd) <=
        new Date(d.decisionDeadline),
      {
        message:
          'reviewEnd must be before decisionDeadline',
        path: ['decisionDeadline'],
      },
    )

    // Student project selection
    .refine(
      (d) =>
        new Date(d.selectionStart) <
        new Date(d.selectionEnd),
      {
        message:
          'selectionStart must be before selectionEnd',
        path: ['selectionEnd'],
      },
    )

    // Selection must finish before team freeze
    .refine(
      (d) =>
        new Date(d.selectionEnd) <=
        new Date(d.teamFreezeDate),
      {
        message:
          'selectionEnd must be before teamFreezeDate',
        path: ['teamFreezeDate'],
      },
    )

    // Student idea submission
    .refine(
      (d) =>
        new Date(d.ideaSubmissionStart) <
        new Date(d.ideaSubmissionEnd),
      {
        message:
          'ideaSubmissionStart must be before ideaSubmissionEnd',
        path: ['ideaSubmissionEnd'],
      },
    )

    // Idea submission must finish before team freeze
    .refine(
      (d) =>
        new Date(d.ideaSubmissionEnd) <=
        new Date(d.teamFreezeDate),
      {
        message:
          'ideaSubmissionEnd must be before teamFreezeDate',
        path: ['teamFreezeDate'],
      },
    ),
});

export const updatePoolSchema = z.object({
  body: z.object({
    name: z.string().min(3).optional(),

    submissionStart: z.string().datetime().optional(),

    submissionEnd: z.string().datetime().optional(),

    reviewStart: z.string().datetime().optional(),

    reviewEnd: z.string().datetime().optional(),

    decisionDeadline: z.string().datetime().optional(),

    selectionStart: z.string().datetime().optional(),

    selectionEnd: z.string().datetime().optional(),

    ideaSubmissionStart: z
      .string()
      .datetime()
      .optional(),

    ideaSubmissionEnd: z
      .string()
      .datetime()
      .optional(),

    teamFreezeDate: z.string().datetime().optional(),

    minTeamSize: z
      .number()
      .int()
      .min(2)
      .max(5)
      .optional(),

    defaultMaxTeamSize: z
      .number()
      .int()
      .min(2)
      .max(5)
      .optional(),

    allowStudentIdeas: z.boolean().optional(),
  }),
});

export const assignUsersSchema = z.object({
  body: z.object({
    subadminIds: z
      .array(z.string().uuid())
      .optional(),

    facultyIds: z
      .array(z.string().uuid())
      .optional(),

    studentIds: z
      .array(z.string().uuid())
      .optional(),
  }),
});