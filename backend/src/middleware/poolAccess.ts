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

      if (
        req.user.role === 'ADMIN' ||
        req.user.role === 'STUDENT'
      ) {
        return next();
      }

      if (
        req.user.role === 'SUBADMIN'
      ) {
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

      if (
        req.user.role === 'FACULTY'
      ) {
        const [facultyAssignment, subadminAssignment] =
          await Promise.all([
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