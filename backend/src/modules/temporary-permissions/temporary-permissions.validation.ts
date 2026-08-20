import { z } from 'zod';

export const createTemporaryPermissionSchema = z.object({
  body: z
    .object({
      userId: z.string().uuid(),

      permission: z.enum([
        'MANAGE_USERS',
        'MANAGE_POOLS',
        'MANAGE_PROJECTS',
        'APPROVE_PROJECTS',
        'REJECT_PROJECTS',
        'PUBLISH_PROJECTS',
        'ASSIGN_SUPERVISORS',
        'MANAGE_TEAMS',
        'VIEW_REPORTS',
      ]),

      startsAt: z.coerce.date(),

      expiresAt: z.coerce.date(),
    })
    .refine(
      (data) => data.startsAt < data.expiresAt,
      {
        message:
          'Start time must be before expiry time',
        path: ['expiresAt'],
      }
    ),
});