import { Request, Response, NextFunction } from 'express';
import { Permission, UserRole } from '@prisma/client';

import { ForbiddenError } from '../shared/errors/AppError';
import prisma from '../config/database';

/**
 * Existing role-based authorization.
 *
 * Example:
 * authorize(UserRole.ADMIN)
 */
export const authorize = (...roles: UserRole[]) => {
  return (
    req: Request,
    _res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      throw new ForbiddenError(
        'Authentication required'
      );
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Access denied. Required: ${roles.join(', ')}`
      );
    }

    next();
  };
};

/**
 * Permission-based authorization.
 *
 * A user is allowed if:
 *
 * 1. They are an ADMIN
 * 2. Their role has the required permission
 * 3. They have an active temporary permission
 *
 * Temporary permission is active only when:
 *
 * startsAt <= current time
 * expiresAt > current time
 * revokedAt IS NULL
 */
export const authorizePermission = (
  permission: Permission
) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new ForbiddenError(
          'Authentication required'
        );
      }

      const userId = req.user.userId;
      const role = req.user.role;

      /**
       * ADMIN has every permission.
       */
      if (role === UserRole.ADMIN) {
        next();
        return;
      }

         // Define permanent permissions for each role.
        //These are the permissions that users have
       // without temporary delegation.
       
      const rolePermissions: Record<
        UserRole,
        Permission[]
      > = {
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

      // First check permanent role permission.
       
      if (
        rolePermissions[role]?.includes(permission)
      ) {
        next();
        return;
      }

      // Check temporary permission.
      
      const now = new Date();

      const temporaryPermission =
        await prisma.temporaryPermission.findFirst({
          where: {
            userId,
            permission,

            startsAt: {
              lte: now,
            },

            expiresAt: {
              gt: now,
            },

            revokedAt: null,
          },
        });

      // No active temporary permission.
      if (!temporaryPermission) {
        throw new ForbiddenError(
          `Access denied. Required permission: ${permission}`
        );
      }

     // Permission is currently active.
       
      next();
    } catch (error) {
      next(error);
    }
  };
};