import { Request, Response, NextFunction } from 'express';

import { verifyAccessToken } from '../shared/utils/token';
import { UnauthorizedError } from '../shared/errors/AppError';

import prisma from '../config/database';

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    console.log(
      '[AUTH] Authorization header:',
      authHeader
        ? 'Bearer token received'
        : 'NO TOKEN'
    );

    if (
      !authHeader ||
      !authHeader.startsWith('Bearer ')
    ) {
      throw new UnauthorizedError(
        'Access token required'
      );
    }

    const token = authHeader
      .substring(7)
      .trim();

    if (!token) {
      throw new UnauthorizedError(
        'Access token required'
      );
    }

    const payload =
      verifyAccessToken(token);

    console.log(
      '[AUTH] JWT payload:',
      {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      }
    );

    if (!payload.userId) {
      throw new UnauthorizedError(
        'Invalid access token'
      );
    }

    /*
     * Get the CURRENT user from database.
     *
     * This prevents an old JWT role from causing
     * permission problems.
     */
    const user =
      await prisma.user.findUnique({
        where: {
          id: payload.userId,
        },

        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
        },
      });

    if (!user) {
      throw new UnauthorizedError(
        'User not found'
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedError(
        'User account is inactive'
      );
    }

    /*
     * Set current database role.
     */
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    console.log(
      '[AUTH] Authenticated user:',
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      }
    );

    next();
  } catch (error: any) {
    console.error(
      '[AUTH] Authentication error:',
      error
    );

    if (
      error?.name ===
      'TokenExpiredError'
    ) {
      next(
        new UnauthorizedError(
          'Token expired'
        )
      );

      return;
    }

    if (
      error?.name ===
      'JsonWebTokenError'
    ) {
      next(
        new UnauthorizedError(
          'Invalid token'
        )
      );

      return;
    }

    next(error);
  }
};