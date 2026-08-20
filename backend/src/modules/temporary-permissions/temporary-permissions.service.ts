import {
  Permission,
  UserRole,
} from '@prisma/client';

import prisma from '../../config/database';

import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from '../../shared/errors/AppError';

interface CreateTemporaryPermissionInput {
  userId: string;
  permission: Permission;
  startsAt: Date;
  expiresAt: Date;
}

class TemporaryPermissionsService {
  /**
   * Grant a temporary permission to a user.
   */
  async create(
    data: CreateTemporaryPermissionInput,
    adminId: string
  ) {
    const now = new Date();

    // Validate dates
    if (data.startsAt >= data.expiresAt) {
      throw new BadRequestError(
        'Start time must be before expiry time'
      );
    }

    if (data.expiresAt <= now) {
      throw new BadRequestError(
        'Expiry time must be in the future'
      );
    }

    // Find target user
    const targetUser = await prisma.user.findUnique({
      where: {
        id: data.userId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    // Inactive users should not receive access
    if (!targetUser.isActive) {
      throw new BadRequestError(
        'Cannot grant permission to an inactive user'
      );
    }

    // Admin already has all permissions
    if (targetUser.role === UserRole.ADMIN) {
      throw new BadRequestError(
        'Temporary permissions are not required for Admin users'
      );
    }

    // Prevent overlapping permission grants
    const existing =
      await prisma.temporaryPermission.findFirst({
        where: {
          userId: data.userId,
          permission: data.permission,

          revokedAt: null,

          startsAt: {
            lt: data.expiresAt,
          },

          expiresAt: {
            gt: data.startsAt,
          },
        },
      });

    if (existing) {
      throw new ConflictError(
        'An overlapping temporary permission already exists'
      );
    }

    // Create permission
    return prisma.temporaryPermission.create({
      data: {
        userId: data.userId,
        permission: data.permission,
        startsAt: data.startsAt,
        expiresAt: data.expiresAt,
        createdById: adminId,
      },

      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },

        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Get all temporary permissions.
   */
  async listAll() {
    return prisma.temporaryPermission.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },

        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get temporary permissions for one user.
   */
  async listForUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return prisma.temporaryPermission.findMany({
      where: {
        userId,
      },

      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },

        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get currently active permissions for a user.
   *
   * This is the important part responsible for
   * automatic expiration.
   */
  async getActiveForUser(userId: string) {
    const now = new Date();

    return prisma.temporaryPermission.findMany({
      where: {
        userId,

        startsAt: {
          lte: now,
        },

        expiresAt: {
          gt: now,
        },

        revokedAt: null,
      },

      orderBy: {
        expiresAt: 'asc',
      },
    });
  }

  /**
   * Check whether a user currently has a
   * particular temporary permission.
   */
  async hasActivePermission(
    userId: string,
    permission: Permission
  ): Promise<boolean> {
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

    return !!temporaryPermission;
  }

  /**
   * Manually revoke a temporary permission.
   */
  async revoke(id: string) {
    const permission =
      await prisma.temporaryPermission.findUnique({
        where: {
          id,
        },
      });

    if (!permission) {
      throw new NotFoundError(
        'Temporary permission not found'
      );
    }

    if (permission.revokedAt) {
      throw new BadRequestError(
        'Permission has already been revoked'
      );
    }

    return prisma.temporaryPermission.update({
      where: {
        id,
      },

      data: {
        revokedAt: new Date(),
      },
    });
  }
}

export const temporaryPermissionsService =
  new TemporaryPermissionsService();