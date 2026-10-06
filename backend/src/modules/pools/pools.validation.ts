// backend/src/modules/pools/pools.validation.ts

import { z } from 'zod';

const optionalDateTime = z
  .string()
  .datetime()
  .optional();

const timelineFields = {
  submissionStart: z.string().datetime(),

  // All other dates are optional because the backend can calculate them.
  submissionEnd: optionalDateTime,
  reviewStart: optionalDateTime,
  reviewEnd: optionalDateTime,
  decisionDeadline: optionalDateTime,
  selectionStart: optionalDateTime,
  selectionEnd: optionalDateTime,
  ideaSubmissionStart: optionalDateTime,
  ideaSubmissionEnd: optionalDateTime,
  teamFreezeDate: optionalDateTime,
};

export const createPoolSchema = z.object({
  body: z.object({
    name: z.string().min(3),

    academicYear: z.string().min(4),

    semester: z.string().min(1),

    department: z.string().optional(),

    ...timelineFields,

    minTeamSize: z
      .number()
      .int()
      .min(2)
      .max(4)
      .optional()
      .default(3),

    defaultMaxTeamSize: z
      .number()
      .int()
      .min(2)
      .max(4)
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
  }),
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

    ideaSubmissionStart: z.string().datetime().optional(),
    ideaSubmissionEnd: z.string().datetime().optional(),

    teamFreezeDate: z.string().datetime().optional(),

    minTeamSize: z
      .number()
      .int()
      .min(2)
      .max(4)
      .optional(),

    defaultMaxTeamSize: z
      .number()
      .int()
      .min(2)
      .max(4)
      .optional(),

    allowStudentIdeas: z
      .boolean()
      .optional(),
  }),
});

export const assignUsersSchema = z.object({
  body: z.object({
    subadminIds: z
      .array(z.string().uuid())
      .optional()
      .default([]),

    facultyIds: z
      .array(z.string().uuid())
      .optional()
      .default([]),

    studentIds: z
      .array(z.string().uuid())
      .optional()
      .default([]),
  }),
});