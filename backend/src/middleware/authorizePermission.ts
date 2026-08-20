import { Request, Response, NextFunction } from 'express';
import { Permission } from '@prisma/client';

import { ForbiddenError } from '../shared/errors/AppError';
import { temporaryPermissionsService } from '../modules/temporary-permissions/temporary-permissions.service';

export const authorizePermission = (...permissions: Permission[]) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new ForbiddenError('Authentication required');
      }

      // Admin automatically has every permission
      if (req.user.role === 'ADMIN') {
        next();
        return;
      }

      // Check whether the user has any of the required
      // temporary permissions right now.
      for (const permission of permissions) {
        const hasPermission =
          await temporaryPermissionsService.hasActivePermission(
            req.user.userId,
            permission
          );

        if (hasPermission) {
          next();
          return;
        }
      }

      throw new ForbiddenError(
        `Access denied. Required permission: ${permissions.join(', ')}`
      );
    } catch (error) {
      next(error);
    }
  };
};