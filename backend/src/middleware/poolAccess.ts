import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { ForbiddenError } from '../shared/errors/AppError';

function getRouteParam(req: Request, paramName: string): string {
  const value = req.params[paramName];

  if (typeof value !== 'string' || !value.trim()) {
    throw new ForbiddenError(`Invalid ${paramName}`);
  }

  return value;
}

/**
 * Checks whether the authenticated user has SubAdmin capability
 * for at least one pool.
 *
 * A user can be:
 * - globally SUBADMIN through User.role
 * - FACULTY + SUBADMIN through PoolSubadmin
 */
export async function hasSubadminAccess(userId: string): Promise<boolean> {
  const assignment = await prisma.poolSubadmin.findFirst({
    where: {
      subadminId: userId,
    },
    select: {
      id: true,
    },
  });

  return !!assignment;
}

/**
 * Checks whether the authenticated user has SubAdmin
 * capability for a specific pool.
 *
 * Global SUBADMIN users are allowed.
 *
 * FACULTY users who are also assigned in PoolSubadmin
 * are also allowed.
 */
export async function hasSubadminPoolAccess(
  userId: string,
  userRole: string,
  poolId: string,
): Promise<boolean> {
  if (userRole === 'ADMIN') {
    return true;
  }

  if (userRole === 'SUBADMIN') {
    const assignment = await prisma.poolSubadmin.findUnique({
      where: {
        poolId_subadminId: {
          poolId,
          subadminId: userId,
        },
      },
      select: {
        id: true,
      },
    });

    return !!assignment;
  }

  /**
   * Important:
   *
   * A FACULTY user may also be a SubAdmin.
   *
   * We deliberately do NOT require:
   * req.user.role === 'SUBADMIN'
   *
   * because a dual-role user remains FACULTY
   * in the User table.
   */
  if (userRole === 'FACULTY') {
    const assignment = await prisma.poolSubadmin.findUnique({
      where: {
        poolId_subadminId: {
          poolId,
          subadminId: userId,
        },
      },
      select: {
        id: true,
      },
    });

    return !!assignment;
  }

  return false;
}

/**
 * General pool access.
 *
 * ADMIN:
 *   Allowed everywhere.
 *
 * SUBADMIN:
 *   Only assigned pools.
 *
 * FACULTY:
 *   Only assigned pools through PoolFaculty.
 *
 * STUDENT:
 *   Currently allowed to preserve existing behavior.
 */
export function requirePoolAccess(poolParam = 'poolId') {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.user) {
        throw new ForbiddenError('Authentication required');
      }

      const poolId = getRouteParam(req, poolParam);

      if (
        req.user.role !== 'SUBADMIN' &&
        req.user.role !== 'FACULTY'
      ) {
        return next();
      }

      if (req.user.role === 'SUBADMIN') {
        const assignment = await prisma.poolSubadmin.findUnique({
          where: {
            poolId_subadminId: {
              poolId,
              subadminId: req.user.userId,
            },
          },
          select: {
            id: true,
          },
        });

        if (!assignment) {
          throw new ForbiddenError(
            'You are not assigned to this pool',
          );
        }
      }

      if (req.user.role === 'FACULTY') {
        const assignment = await prisma.poolFaculty.findUnique({
          where: {
            poolId_facultyId: {
              poolId,
              facultyId: req.user.userId,
            },
          },
          select: {
            id: true,
          },
        });

        if (!assignment) {
          throw new ForbiddenError(
            'You are not assigned to this pool',
          );
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Requires SubAdmin capability for the pool.
 *
 * Allows:
 * - ADMIN
 * - normal SUBADMIN assigned to pool
 * - FACULTY assigned to pool as SubAdmin
 */
export function requireSubadminPoolAccess(poolParam = 'poolId') {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.user) {
        throw new ForbiddenError('Authentication required');
      }

      const poolId = getRouteParam(req, poolParam);

      const allowed = await hasSubadminPoolAccess(
        req.user.userId,
        req.user.role,
        poolId,
      );

      if (!allowed) {
        throw new ForbiddenError(
          'You do not have SubAdmin access to this pool',
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Requires SubAdmin capability for at least one pool.
 *
 * This is useful for general SubAdmin pages where
 * there is no poolId in the URL.
 */
export function requireSubadminAccess() {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.user) {
        throw new ForbiddenError('Authentication required');
      }

      const allowed = await hasSubadminAccess(
        req.user.userId,
      );

      if (!allowed) {
        throw new ForbiddenError(
          'SubAdmin access required',
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Requires normal Faculty pool assignment.
 *
 * This remains Faculty-specific.
 *
 * A dual Faculty + SubAdmin user can still use
 * normal Faculty functionality because their
 * User.role remains FACULTY.
 */
export function requireFacultyPoolAccess(poolParam = 'poolId') {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.user) {
        throw new ForbiddenError('Authentication required');
      }

      if (req.user.role !== 'FACULTY') {
        throw new ForbiddenError(
          'Only Faculty can access this resource',
        );
      }

      const poolId = getRouteParam(req, poolParam);

      const assignment = await prisma.poolFaculty.findUnique({
        where: {
          poolId_facultyId: {
            poolId,
            facultyId: req.user.userId,
          },
        },
        select: {
          id: true,
        },
      });

      if (!assignment) {
        throw new ForbiddenError(
          'You are not assigned to this pool',
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}