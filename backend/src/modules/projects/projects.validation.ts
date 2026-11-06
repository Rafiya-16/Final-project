import { z } from 'zod';

export const submitProjectSchema = z.object({
  body: z.object({
    title: z.string().min(5).max(200),
    description: z.string().min(20).max(2000),
    domain: z.string().optional(),
    prerequisites: z.string().optional(),
    maxTeamSize: z.number().int().min(3).max(4).optional().default(3),
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
export const reviewBatchSchema = z.object({
  body: z.object({
    decisions: z
      .array(
        z.object({
          projectId: z.string().min(1),
          action: z.enum(["LOCK", "HOLD"]),
          note: z.string().max(1000).optional(),
        }),
      )
      .min(1)
      .max(4)
      .superRefine((decisions, ctx) => {
        const holdIndex = decisions.findIndex(
          (decision) => decision.action === "HOLD",
        );

        if (
          holdIndex !== -1 &&
          !decisions[holdIndex].note?.trim()
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "A reason is required for the held project.",
            path: [holdIndex, "note"],
          });
        }
      }),
  }),
});