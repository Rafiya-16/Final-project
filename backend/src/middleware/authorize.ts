import {
  Request,
  Response,
  NextFunction,
} from 'express';

import { UserRole } from '@prisma/client';

import {
  ForbiddenError,
} from '../shared/errors/AppError';

export const authorize =
  (...roles: UserRole[]) =>
  (
    req: Request,
    _res: Response,
    next: NextFunction
  ): void => {
    console.log(
      '[AUTHORIZE]',
      {
        userId: req.user?.userId,
        email: req.user?.email,
        actualRole: req.user?.role,
        allowedRoles: roles,
        path: req.originalUrl,
      }
    );

    if (!req.user) {
      throw new ForbiddenError(
        'Authentication required'
      );
    }

    if (
      !roles.includes(req.user.role)
    ) {
      throw new ForbiddenError(
        `Access denied. Your role is ${req.user.role}. Required: ${roles.join(', ')}`
      );
    }

    next();
  };