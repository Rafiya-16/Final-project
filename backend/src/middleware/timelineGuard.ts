// backend/src/middleware/timelineGuard.ts

import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import {
  ForbiddenError,
  NotFoundError,
} from '../shared/errors/AppError';

type Phase =
  | 'SUBMISSION'
  | 'REVIEW'
  | 'SELECTION'
  | 'IDEA_SUBMISSION'
  | 'TEAM_FORM';

export const timelineGuard = (
  requiredPhase: Phase,
) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ) => {
    try {
      const poolId =
        req.params.poolId as
          | string
          | undefined;

      if (!poolId) {
        return next();
      }

      const pool =
        await prisma.pool.findUnique({
          where: {
            id: poolId,
          },
        });

      if (!pool) {
        throw new NotFoundError(
          'Pool not found',
        );
      }

      const now = new Date();

      let start: Date;
      let end: Date;

      switch (requiredPhase) {
        case 'SUBMISSION':
          start = pool.submissionStart;
          end = pool.submissionEnd;
          break;

        case 'REVIEW':
          start = pool.reviewStart;
          end = pool.reviewEnd;
          break;

        case 'SELECTION':
          start = pool.selectionStart;
          end = pool.selectionEnd;
          break;

        case 'IDEA_SUBMISSION':
          if (
            !pool.ideaSubmissionStart ||
            !pool.ideaSubmissionEnd
          ) {
            throw new ForbiddenError(
              'Student Idea Submission timeline is not configured for this pool.',
            );
          }

          start =
            pool.ideaSubmissionStart;

          end =
            pool.ideaSubmissionEnd;

          break;

        case 'TEAM_FORM':
          start = pool.selectionStart;
          end = pool.teamFreezeDate;
          break;

        default:
          return next();
      }

      if (now < start) {
        throw new ForbiddenError(
          `This phase has not started yet. Starts: ${start.toISOString()}`,
        );
      }

      if (now > end) {
        throw new ForbiddenError(
          `This phase has ended. Ended: ${end.toISOString()}`,
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};