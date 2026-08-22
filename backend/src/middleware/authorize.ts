import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

import { ForbiddenError } from '../shared/errors/AppError';

/**
 * Role-based authorization.
 *
 * Use this middleware when access depends directly
 * on the user's role.
 *
 * Examples:
 *
 * authorize(UserRole.ADMIN)
 * authorize(UserRole.STUDENT)
 * authorize(UserRole.ADMIN, UserRole.SUBADMIN)
 */
export const authorize = (...roles: UserRole[]) => {
  return (
    req: Request,
    _res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      next(new ForbiddenError('Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(
        new ForbiddenError(
          `Access denied. Required: ${roles.join(', ')}`
        )
      );
      return;
    }

    next();
  };
};