import { Request, Response, NextFunction } from 'express';
import { Permission, UserRole } from '@prisma/client';

import { ForbiddenError } from '../shared/errors/AppError';
import { temporaryPermissionsService } from '../modules/temporary-permissions/temporary-permissions.service';

interface AuthorizeAccessOptions {
  roles?: UserRole[];
  permissions?: Permission[];
}

/**
 * Permanent permissions assigned to each role.
 *
 * Temporary permissions are additional permissions
 * granted by an ADMIN for a limited period.
 */
const rolePermissions: Record<UserRole, Permission[]> = {
  ADMIN: [
    Permission.MANAGE_USERS,
    Permission.MANAGE_POOLS,
    Permission.MANAGE_PROJECTS,
    Permission.APPROVE_PROJECTS,
    Permission.REJECT_PROJECTS,
    Permission.PUBLISH_PROJECTS,
    Permission.ASSIGN_SUPERVISORS,
    Permission.MANAGE_TEAMS,
    Permission.VIEW_REPORTS,
  ],

  SUBADMIN: [
    Permission.MANAGE_PROJECTS,
    Permission.APPROVE_PROJECTS,
    Permission.REJECT_PROJECTS,
    Permission.PUBLISH_PROJECTS,
    Permission.ASSIGN_SUPERVISORS,
    Permission.MANAGE_TEAMS,
    Permission.VIEW_REPORTS,
  ],

  FACULTY: [
    Permission.MANAGE_TEAMS,
  ],

  STUDENT: [],
};

/**
 * Permission-based authorization.
 *
 * A user is allowed when:
 *
 * 1. They are ADMIN
 * 2. Their role has the required permanent permission
 * 3. They have an active temporary permission
 * 4. Their role is explicitly allowed through options.roles
 *
 * Temporary permissions are valid only when:
 *
 * startsAt <= current time
 * expiresAt > current time
 * revokedAt IS NULL
 */
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

      const userRole = req.user.role;
      const userId = req.user.userId;

      /**
       * ADMIN has unrestricted administrative access.
       */
      if (userRole === UserRole.ADMIN) {
        next();
        return;
      }

      /**
       * Explicit role-based access.
       *
       * Example:
       *
       * authorizeAccess({
       *   roles: [UserRole.SUBADMIN]
       * })
       */
      if (
        options.roles &&
        options.roles.includes(userRole)
      ) {
        next();
        return;
      }

      /**
       * Permission-based access.
       */
      if (options.permissions) {
        for (const permission of options.permissions) {
          /**
           * Check permanent role permission.
           */
          if (
            rolePermissions[userRole]?.includes(permission)
          ) {
            next();
            return;
          }

          /**
           * Check active temporary permission.
           */
          const hasTemporaryPermission =
            await temporaryPermissionsService.hasActivePermission(
              userId,
              permission
            );

          if (hasTemporaryPermission) {
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