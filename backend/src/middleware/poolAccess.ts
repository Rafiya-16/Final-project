import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { ForbiddenError } from '../shared/errors/AppError';

function getRouteParam(
  req: Request,
  paramName: string
): string {
  const value = req.params[paramName];

  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    throw new ForbiddenError(
      `Invalid ${paramName}`
    );
  }

  return value;
}

/**
 * Checks whether the user is assigned as SubAdmin
 * to at least one pool.
 *
 * IMPORTANT:
 * A FACULTY user can also be a PoolSubadmin.
 */
export async function hasSubadminAccess(
  userId: string
): Promise<boolean> {
  const assignment =
    await prisma.poolSubadmin.findFirst({
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
 * Checks whether the user has SubAdmin access
 * to a specific pool.
 *
 * ADMIN always has access.
 *
 * SUBADMIN and FACULTY can have SubAdmin access
 * when they are assigned through PoolSubadmin.
 */
export async function hasSubadminPoolAccess(
  userId: string,
  userRole: string,
  poolId: string
): Promise<boolean> {
  if (userRole === 'ADMIN') {
    return true;
  }

  if (
    userRole !== 'SUBADMIN' &&
    userRole !== 'FACULTY'
  ) {
    return false;
  }

  const assignment =
    await prisma.poolSubadmin.findUnique({
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
 * General pool access.
 *
 * ADMIN:
 *   All pools.
 *
 * STUDENT:
 *   Only pools assigned through PoolStudent.
 *
 * SUBADMIN:
 *   Only pools assigned through PoolSubadmin.
 *
 * FACULTY:
 *   PoolFaculty OR PoolSubadmin.
 *
 * This allows a FACULTY user who is also a SubAdmin
 * to access the pool as a SubAdmin.
 */
export function requirePoolAccess(
  poolParam = 'poolId'
) {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        throw new ForbiddenError(
          'Authentication required'
        );
      }

      const poolId =
        getRouteParam(req, poolParam);

      /*
       * ADMIN
       */
      if (req.user.role === 'ADMIN') {
        return next();
      }

      /*
       * STUDENT
       *
       * Students must actually be assigned to the pool.
       */
      if (req.user.role === 'STUDENT') {
        const assignment =
          await prisma.poolStudent.findUnique({
            where: {
              poolId_studentId: {
                poolId,
                studentId: req.user.userId,
              },
            },

            select: {
              id: true,
            },
          });

        if (!assignment) {
          throw new ForbiddenError(
            'You are not assigned to this pool'
          );
        }

        return next();
      }

      /*
       * SUBADMIN
       */
      if (req.user.role === 'SUBADMIN') {
        const assignment =
          await prisma.poolSubadmin.findUnique({
            where: {
              poolId_subadminId: {
                poolId,
                subadminId:
                  req.user.userId,
              },
            },

            select: {
              id: true,
            },
          });

        if (!assignment) {
          throw new ForbiddenError(
            'You are not assigned to this pool'
          );
        }

        return next();
      }

      /*
       * FACULTY
       *
       * Faculty can access a pool if:
       *
       * 1. They are assigned as Faculty, OR
       * 2. They are assigned as SubAdmin.
       *
       * This is critical for the
       * Faculty + SubAdmin use case.
       */
      if (req.user.role === 'FACULTY') {
        const [
          facultyAssignment,
          subadminAssignment,
        ] = await Promise.all([
          prisma.poolFaculty.findUnique({
            where: {
              poolId_facultyId: {
                poolId,
                facultyId:
                  req.user.userId,
              },
            },

            select: {
              id: true,
            },
          }),

          prisma.poolSubadmin.findUnique({
            where: {
              poolId_subadminId: {
                poolId,
                subadminId:
                  req.user.userId,
              },
            },

            select: {
              id: true,
            },
          }),
        ]);

        if (
          !facultyAssignment &&
          !subadminAssignment
        ) {
          throw new ForbiddenError(
            'You are not assigned to this pool'
          );
        }

        return next();
      }

      throw new ForbiddenError(
        'You do not have access to this pool'
      );
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Only users with SubAdmin access to the
 * requested pool.
 *
 * ADMIN is allowed.
 *
 * FACULTY is allowed if they are assigned
 * as PoolSubadmin.
 */
export function requireSubadminPoolAccess(
  poolParam = 'poolId'
) {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        throw new ForbiddenError(
          'Authentication required'
        );
      }

      const poolId =
        getRouteParam(req, poolParam);

      const allowed =
        await hasSubadminPoolAccess(
          req.user.userId,
          req.user.role,
          poolId
        );

      if (!allowed) {
        throw new ForbiddenError(
          'You do not have SubAdmin access to this pool'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Checks whether the user is a SubAdmin
 * of at least one pool.
 *
 * Works for both:
 *   SUBADMIN
 *   FACULTY + PoolSubadmin
 */
export function requireSubadminAccess() {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        throw new ForbiddenError(
          'Authentication required'
        );
      }

      const allowed =
        await hasSubadminAccess(
          req.user.userId
        );

      if (!allowed) {
        throw new ForbiddenError(
          'SubAdmin access required'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Faculty-only pool access.
 *
 * This intentionally checks PoolFaculty only.
 *
 * Do NOT use this middleware for SubAdmin review
 * endpoints, because a Faculty + SubAdmin user must
 * be allowed through those endpoints.
 */
export function requireFacultyPoolAccess(
  poolParam = 'poolId'
) {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        throw new ForbiddenError(
          'Authentication required'
        );
      }

      if (
        req.user.role !== 'FACULTY'
      ) {
        throw new ForbiddenError(
          'Only Faculty can access this resource'
        );
      }

      const poolId =
        getRouteParam(req, poolParam);

      const assignment =
        await prisma.poolFaculty.findUnique({
          where: {
            poolId_facultyId: {
              poolId,
              facultyId:
                req.user.userId,
            },
          },

          select: {
            id: true,
          },
        });

      if (!assignment) {
        throw new ForbiddenError(
          'You are not assigned as Faculty to this pool'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}