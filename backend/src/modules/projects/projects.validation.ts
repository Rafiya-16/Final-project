import { z } from 'zod';

export const submitProjectSchema = z.object({
  body: z.object({
    title: z.string().min(5).max(200),
    description: z.string().min(20).max(2000),
    domain: z.string().optional(),
    prerequisites: z.string().optional(),
    maxTeamSize: z.number().int().min(2).max(4).optional().default(3),
    expectedOutcome: z.string().optional(),
  }),
});

export const reviewProjectSchema = z.object({
  body: z.object({
    note: z.string().optional(),
  }),
});

export const decideProjectSchema = z.object({
  body: z.object({
    note: z.string().optional(),
  }),
});