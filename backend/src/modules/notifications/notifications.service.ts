import prisma from '../../config/database';
import type { $Enums } from '@prisma/client';
import {
  paginatedResult,
  PaginationParams,
} from '../../shared/utils/pagination';

type NotificationType = $Enums.NotificationType;

export class NotificationsService {
  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    link?: string,
  ) {
    return prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
      },
    });
  }

  async createBulk(
    userIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    link?: string,
  ) {
    return prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type,
        title,
        message,
        link,
      })),
    });
  }

  async getForUser(
    userId: string,
    params: PaginationParams,
  ) {
    const [notifs, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({
        where: { userId },
      }),
    ]);

    return paginatedResult(notifs, total, params);
  }

  async markRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        isRead: true,
      },
    });
  }

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }
}

export const notificationsService = new NotificationsService();