import { Request, Response, NextFunction } from 'express';
import { Permission, UserRole } from '@prisma/client';

import { ForbiddenError } from '../shared/errors/AppError';
import { temporaryPermissionsService } from '../modules/temporary-permissions/temporary-permissions.service';

interface AuthorizeAccessOptions {
  roles?: UserRole[];
  permissions?: Permission[];
}

export const authorizeAccess = (
  options: AuthorizeAccessOptions
) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new ForbiddenError('Authentication required');
      }

      /*
       * ADMIN already has unrestricted administrative access.
       */
      if (req.user.role === UserRole.ADMIN) {
        next();
        return;
      }

      /*
       * Check normal role-based access.
       */
      if (
        options.roles &&
        options.roles.includes(req.user.role)
      ) {
        next();
        return;
      }

      /*
       * Check temporary permissions.
       *
       * A permission is valid only when:
       *
       * startsAt <= current time
       * expiresAt > current time
       * revokedAt IS NULL
       */
      if (options.permissions) {
        for (const permission of options.permissions) {
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
      }

      throw new ForbiddenError(
        'You do not have permission to perform this action'
      );
    } catch (error) {
      next(error);
    }
  };
};