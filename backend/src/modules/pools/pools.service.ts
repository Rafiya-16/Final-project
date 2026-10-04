// backend/src/modules/pools/pools.service.ts

import prisma from '../../config/database';
import { PoolStatus } from '@prisma/client';
import {
  BadRequestError,
  NotFoundError,
} from '../../shared/errors/AppError';
import {
  paginatedResult,
  PaginationParams,
} from '../../shared/utils/pagination';
import { logger } from '../../shared/utils/logger';
import { auditService } from '../audit/audit.service';
import { notificationsService } from '../notifications/notifications.service';
import {
  notifySubadminAccessGranted,
  notifySubadminAccessRevoked,
} from '../notifications/notification.triggers';

export class PoolsService {

  private async validatePoolUsers(
    subadminIds: string[] = [],
    facultyIds: string[] = [],
    studentIds: string[] = [],
  ) {
    const allIds = [
      ...new Set([
        ...subadminIds,
        ...facultyIds,
        ...studentIds,
      ]),
    ];

    if (allIds.length === 0) {
      return;
    }

    const users = await prisma.user.findMany({
      where: {
        id: {
          in: allIds,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    const userMap = new Map(
      users.map((user) => [user.id, user]),
    );

    const missingIds = allIds.filter(
      (id) => !userMap.has(id),
    );

    if (missingIds.length > 0) {
      throw new BadRequestError(
        `One or more selected users do not exist: ${missingIds.join(', ')}`,
      );
    }

    const inactiveUsers = users.filter(
      (user) => !user.isActive,
    );

    if (inactiveUsers.length > 0) {
      const names = inactiveUsers
        .map(
          (user) =>
            `${user.firstName} ${user.lastName}`,
        )
        .join(', ');

      throw new BadRequestError(
        `Cannot assign inactive users to a pool: ${names}`,
      );
    }

    const invalidSubadmins = subadminIds
      .map((id) => userMap.get(id))
      .filter(
        (user) =>
          user &&
          user.role !== 'SUBADMIN' &&
          user.role !== 'FACULTY',
      );

    if (invalidSubadmins.length > 0) {
      const names = invalidSubadmins
        .map(
          (user) =>
            `${user!.firstName} ${user!.lastName}`,
        )
        .join(', ');

      throw new BadRequestError(
        `SubAdmin assignment is allowed only for SUBADMIN or FACULTY users. Invalid users: ${names}`,
      );
    }

    const invalidFaculty = facultyIds
      .map((id) => userMap.get(id))
      .filter(
        (user) =>
          user &&
          user.role !== 'FACULTY',
      );

    if (invalidFaculty.length > 0) {
      const names = invalidFaculty
        .map(
          (user) =>
            `${user!.firstName} ${user!.lastName}`,
        )
        .join(', ');

      throw new BadRequestError(
        `Faculty assignment is allowed only for FACULTY users. Invalid users: ${names}`,
      );
    }

    const invalidStudents = studentIds
      .map((id) => userMap.get(id))
      .filter(
        (user) =>
          user &&
          user.role !== 'STUDENT',
      );

    if (invalidStudents.length > 0) {
      const names = invalidStudents
        .map(
          (user) =>
            `${user!.firstName} ${user!.lastName}`,
        )
        .join(', ');

      throw new BadRequestError(
        `Student assignment is allowed only for STUDENT users. Invalid users: ${names}`,
      );
    }
  }

  /**
   * Create a new pool
   */
  async createPool(data: any, adminId: string) {
    const subadminIds = [
      ...new Set<string>(data.subadminIds ?? []),
    ];

    const facultyIds = [
      ...new Set<string>(data.facultyIds ?? []),
    ];

    const studentIds = [
      ...new Set<string>(data.studentIds ?? []),
    ];

    await this.validatePoolUsers(
      subadminIds,
      facultyIds,
      studentIds,
    );

    const pool = await prisma.pool.create({
      data: {
        name: data.name,
        academicYear: data.academicYear,
        semester: data.semester,
        department: data.department,
        status: 'DRAFT',

        submissionStart: new Date(data.submissionStart),
        submissionEnd: new Date(data.submissionEnd),
        reviewStart: new Date(data.reviewStart),
        reviewEnd: new Date(data.reviewEnd),
        decisionDeadline: new Date(data.decisionDeadline),
        selectionStart: new Date(data.selectionStart),
        selectionEnd: new Date(data.selectionEnd),
        teamFreezeDate: new Date(data.teamFreezeDate),

        minTeamSize: data.minTeamSize ?? 3,
        defaultMaxTeamSize:
          data.defaultMaxTeamSize ?? 3,
        allowStudentIdeas:
          data.allowStudentIdeas ?? true,

        createdById: adminId,

        subadmins: {
          create: subadminIds.map((id: string) => ({
            subadminId: id,
          })),
        },

        faculty: {
          create: facultyIds.map((id: string) => ({
            facultyId: id,
          })),
        },

        students: {
          create: studentIds.map((id: string) => ({
            studentId: id,
          })),
        },
      },

      include: {
        subadmins: {
          include: {
            subadmin: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },

        faculty: {
          include: {
            faculty: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },

        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    // Notify initially assigned SubAdmins.
if (subadminIds.length > 0) {
  await Promise.all(
    subadminIds.map((subadminId) =>
      notifySubadminAccessGranted(
        pool.id,
        subadminId,
      ).catch((error) => {
        logger.error(
          `Failed to send SubAdmin grant notification for ${subadminId}`,
          error,
        );
      }),
    ),
  );
}

    logger.info(
      `Pool created: ${pool.name} (${pool.id})`,
    );

    auditService
      .log(
        adminId,
        'CREATE_POOL',
        'Pool',
        pool.id,
      )
      .catch(() => {});

    return pool;
  }

  async listPools(
  userId: string,
  userRole: string,
  params: PaginationParams,
  scope: 'faculty' | 'subadmin' | 'student' | 'all' = 'all',
) {
  let where: any = {};

  
  if (userRole === 'ADMIN') {
    where = {};
  }

  else if (userRole === 'SUBADMIN') {
    where = {
      subadmins: {
        some: {
          subadminId: userId,
        },
      },
    };
  }

  else if (userRole === 'FACULTY') {
   
    if (scope === 'subadmin') {
      where = {
        subadmins: {
          some: {
            subadminId: userId,
          },
        },
      };
    }

    else {
      where = {
        faculty: {
          some: {
            facultyId: userId,
          },
        },
      };
    }
  }

  /*
   * ---------------------------------------------------------
   * STUDENT
   * ---------------------------------------------------------
   */
  else if (userRole === 'STUDENT') {
    where = {
      students: {
        some: {
          studentId: userId,
        },
      },
    };
  }

  const skip =
    (params.page - 1) * params.limit;

  const [pools, total] =
    await Promise.all([
      prisma.pool.findMany({
        where,

        skip,
        take: params.limit,

        orderBy: {
          createdAt: 'desc',
        },

        include: {
          _count: {
            select: {
              faculty: true,
              students: true,
              projects: true,
              teams: true,
            },
          },

          creator: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),

      prisma.pool.count({
        where,
      }),
    ]);

  return paginatedResult(
    pools,
    total,
    params,
  );
}

  /**
   * Get a single pool by ID
   */
  async getPoolById(poolId: string) {
    const pool =
      await prisma.pool.findUnique({
        where: {
          id: poolId,
        },

        include: {
          subadmins: {
            include: {
              subadmin: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },

          faculty: {
            include: {
              faculty: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  designation: true,
                },
              },
            },
          },

          _count: {
            select: {
              students: true,
              projects: true,
              teams: true,
            },
          },

          creator: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

    if (!pool) {
      throw new NotFoundError(
        'Pool not found',
      );
    }

    return pool;
  }

  /**
   * Update a pool
   */
  async updatePool(
    poolId: string,
    data: any,
  ) {
    const pool =
      await prisma.pool.findUnique({
        where: {
          id: poolId,
        },
      });

    if (!pool) {
      throw new NotFoundError(
        'Pool not found',
      );
    }

    if (pool.status !== 'DRAFT') {
      throw new BadRequestError(
        `Can only edit DRAFT pools. Current: ${pool.status}`,
      );
    }

    const updateData: any = {};

    const dateFields = [
      'submissionStart',
      'submissionEnd',
      'reviewStart',
      'reviewEnd',
      'decisionDeadline',
      'selectionStart',
      'selectionEnd',
      'teamFreezeDate',
    ];

    for (const [key, value] of Object.entries(
      data,
    )) {
      if (value === undefined) {
        continue;
      }

      if (dateFields.includes(key)) {
        updateData[key] = new Date(
          value as string,
        );
      } else {
        updateData[key] = value;
      }
    }

    return prisma.pool.update({
      where: {
        id: poolId,
      },
      data: updateData,
    });
  }

  /**
   * Activate a pool
   */
  async activatePool(poolId: string) {
    const pool =
      await prisma.pool.findUnique({
        where: {
          id: poolId,
        },

        include: {
          _count: {
            select: {
              subadmins: true,
              faculty: true,
              students: true,
            },
          },
        },
      });

    if (!pool) {
      throw new NotFoundError(
        'Pool not found',
      );
    }

    if (pool.status !== 'DRAFT') {
      throw new BadRequestError(
        'Only DRAFT pools can be activated',
      );
    }

    if (pool._count.subadmins === 0) {
      throw new BadRequestError(
        'Assign at least 1 subadmin',
      );
    }

    if (pool._count.faculty === 0) {
      throw new BadRequestError(
        'Assign at least 1 faculty',
      );
    }

    if (pool._count.students === 0) {
      throw new BadRequestError(
        'Assign at least 1 student',
      );
    }

    const updated =
      await prisma.pool.update({
        where: {
          id: poolId,
        },

        data: {
          status: 'SUBMISSION_OPEN',
        },
      });

    auditService
      .log(
        'system',
        'ACTIVATE_POOL',
        'Pool',
        poolId,
      )
      .catch(() => {});

    const facultyAssignments =
      await prisma.poolFaculty.findMany({
        where: {
          poolId,
        },

        select: {
          facultyId: true,
        },
      });

    if (facultyAssignments.length > 0) {
      notificationsService
        .createBulk(
          facultyAssignments.map(
            (faculty) =>
              faculty.facultyId,
          ),
          'SUBMISSION_REMINDER',
          'Submissions Open',
          `Pool "${updated.name}" is now open for proposal submissions.`,
          `/pools/${poolId}`,
        )
        .catch(() => {});
    }

    return updated;
  }

  /**
   * Advance the pool to the next phase
   */
  async advancePhase(poolId: string) {
    const pool =
      await prisma.pool.findUnique({
        where: {
          id: poolId,
        },
      });

    if (!pool) {
      throw new NotFoundError(
        'Pool not found',
      );
    }

    const transitions: Record<
      string,
      PoolStatus
    > = {
      SUBMISSION_OPEN:
        'UNDER_REVIEW',
      UNDER_REVIEW:
        'DECISION_PENDING',
      DECISION_PENDING:
        'SELECTION_OPEN',
      SELECTION_OPEN:
        'TEAMS_FORMING',
      TEAMS_FORMING:
        'FROZEN',
    };

    const nextStatus =
      transitions[pool.status];

    if (!nextStatus) {
      throw new BadRequestError(
        `Cannot advance from ${pool.status}`,
      );
    }

    if (nextStatus === 'FROZEN') {
      await prisma.team.updateMany({
        where: {
          poolId,
          status: {
            not: 'DISSOLVED',
          },
        },

        data: {
          isFrozen: true,
          status: 'FROZEN',
        },
      });
    }

    const updated =
      await prisma.pool.update({
        where: {
          id: poolId,
        },

        data: {
          status: nextStatus,
        },
      });

    auditService
      .log(
        'system',
        'ADVANCE_PHASE',
        'Pool',
        poolId,
        pool.status,
        nextStatus,
      )
      .catch(() => {});

    if (nextStatus === 'UNDER_REVIEW') {
      const subadmins =
        await prisma.poolSubadmin.findMany({
          where: {
            poolId,
          },

          select: {
            subadminId: true,
          },
        });

      if (subadmins.length > 0) {
        notificationsService
          .createBulk(
            subadmins.map(
              (subadmin) =>
                subadmin.subadminId,
            ),
            'GENERAL',
            'Review Phase Started',
            `Pool "${updated.name}" is now in review. Faculty proposals are ready for your review.`,
            `/pools/${poolId}`,
          )
          .catch(() => {});
      }
    }

    if (nextStatus === 'SELECTION_OPEN') {
      const students =
        await prisma.poolStudent.findMany({
          where: {
            poolId,
          },

          select: {
            studentId: true,
          },
        });

      if (students.length > 0) {
        notificationsService
          .createBulk(
            students.map(
              (student) =>
                student.studentId,
            ),
            'GENERAL',
            'Project Selection Open',
            `Pool "${updated.name}" is now open for project selection. Browse approved projects and form your team!`,
            '/projects',
          )
          .catch(() => {});
      }
    }

    return updated;
  }

  /**
   * Freeze a pool and all active teams
   */
  async freezePool(poolId: string) {
    const pool =
      await prisma.pool.findUnique({
        where: {
          id: poolId,
        },
      });

    if (!pool) {
      throw new NotFoundError(
        'Pool not found',
      );
    }

    await prisma.team.updateMany({
      where: {
        poolId,
        status: {
          not: 'DISSOLVED',
        },
      },

      data: {
        isFrozen: true,
        status: 'FROZEN',
      },
    });

    return prisma.pool.update({
      where: {
        id: poolId,
      },

      data: {
        status: 'FROZEN',
      },
    });
  }

  /**
   * Archive a pool
   */
  async archivePool(poolId: string) {
    const pool =
      await prisma.pool.findUnique({
        where: {
          id: poolId,
        },
      });

    if (!pool) {
      throw new NotFoundError(
        'Pool not found',
      );
    }

    return prisma.pool.update({
      where: {
        id: poolId,
      },

      data: {
        status: 'ARCHIVED',
      },
    });
  }

 async assignUsers(
  poolId: string,
  data: any,
) {
  const pool =
    await prisma.pool.findUnique({
      where: {
        id: poolId,
      },
    });

  if (!pool) {
    throw new NotFoundError(
      'Pool not found',
    );
  }

  const subadminIds = [
    ...new Set<string>(
      data.subadminIds ?? [],
    ),
  ];

  const facultyIds = [
    ...new Set<string>(
      data.facultyIds ?? [],
    ),
  ];

  const studentIds = [
    ...new Set<string>(
      data.studentIds ?? [],
    ),
  ];

  await this.validatePoolUsers(
    subadminIds,
    facultyIds,
    studentIds,
  );

  const existingSubadminAssignments =
    subadminIds.length > 0
      ? await prisma.poolSubadmin.findMany({
          where: {
            poolId,
            subadminId: {
              in: subadminIds,
            },
          },
          select: {
            subadminId: true,
          },
        })
      : [];

  const existingSubadminIds = new Set(
    existingSubadminAssignments.map(
      (assignment) =>
        assignment.subadminId,
    ),
  );

  const newlyAssignedSubadminIds =
    subadminIds.filter(
      (subadminId) =>
        !existingSubadminIds.has(
          subadminId,
        ),
    );

  if (subadminIds.length > 0) {
    for (const subadminId of subadminIds) {
      await prisma.poolSubadmin.upsert({
        where: {
          poolId_subadminId: {
            poolId,
            subadminId,
          },
        },

        create: {
          poolId,
          subadminId,
        },

        update: {},
      });
    }
  }

  if (facultyIds.length > 0) {
    for (const facultyId of facultyIds) {
      await prisma.poolFaculty.upsert({
        where: {
          poolId_facultyId: {
            poolId,
            facultyId,
          },
        },

        create: {
          poolId,
          facultyId,
        },

        update: {},
      });
    }
  }

  if (studentIds.length > 0) {
    for (const studentId of studentIds) {
      await prisma.poolStudent.upsert({
        where: {
          poolId_studentId: {
            poolId,
            studentId,
          },
        },

        create: {
          poolId,
          studentId,
        },

        update: {},
      });
    }
  }

  if (
    newlyAssignedSubadminIds.length > 0
  ) {
    await Promise.all(
      newlyAssignedSubadminIds.map(
        (subadminId) =>
          notifySubadminAccessGranted(
            poolId,
            subadminId,
          ).catch((error) => {
            logger.error(
              `Failed to send SubAdmin grant notification for ${subadminId}`,
              error,
            );
          }),
      ),
    );
  }

  return this.getPoolById(poolId);
}

async removeFaculty(poolId: string, facultyId: string) {
  const pool = await prisma.pool.findUnique({
    where: {
      id: poolId,
    },
  });

  if (!pool) {
    throw new NotFoundError('Pool not found');
  }

  const assignment = await prisma.poolFaculty.findUnique({
    where: {
      poolId_facultyId: {
        poolId,
        facultyId,
      },
    },
  });

  if (!assignment) {
    throw new NotFoundError(
      'Faculty is not assigned to this pool',
    );
  }

  await prisma.poolFaculty.delete({
    where: {
      poolId_facultyId: {
        poolId,
        facultyId,
      },
    },
  });

  return this.getPoolById(poolId);
}

async removeSubadmin(
  poolId: string,
  subadminId: string,
) {
  const pool =
    await prisma.pool.findUnique({
      where: {
        id: poolId,
      },
      select: {
        id: true,
        name: true,
      },
    });

  if (!pool) {
    throw new NotFoundError(
      'Pool not found',
    );
  }

  const assignment =
    await prisma.poolSubadmin.findUnique({
      where: {
        poolId_subadminId: {
          poolId,
          subadminId,
        },
      },
    });

  if (!assignment) {
    throw new NotFoundError(
      'SubAdmin is not assigned to this pool',
    );
  }

  /*
   * Delete the actual capability assignment first.
   */
  await prisma.poolSubadmin.delete({
    where: {
      poolId_subadminId: {
        poolId,
        subadminId,
      },
    },
  });

  await notifySubadminAccessRevoked(
    poolId,
    subadminId,
    pool.name,
  ).catch((error) => {
    logger.error(
      `Failed to send SubAdmin revoke notification for ${subadminId}`,
      error,
    );
  });

  return this.getPoolById(poolId);
}
  /**
   * Get statistics for a pool
   */
  async getPoolStats(poolId: string) {
    const pool =
      await prisma.pool.findUnique({
        where: {
          id: poolId,
        },
      });

    if (!pool) {
      throw new NotFoundError(
        'Pool not found',
      );
    }

    const [
      facultyCount,
      studentCount,
      projectCount,
      approvedCount,
      teamCount,
      unassigned,
    ] = await Promise.all([
      prisma.poolFaculty.count({
        where: {
          poolId,
        },
      }),

      prisma.poolStudent.count({
        where: {
          poolId,
        },
      }),

      prisma.project.count({
        where: {
          poolId,
        },
      }),

      prisma.project.count({
        where: {
          poolId,
          status: 'APPROVED',
        },
      }),

      prisma.team.count({
        where: {
          poolId,
          status: {
            not: 'DISSOLVED',
          },
        },
      }),

      prisma.poolStudent.count({
        where: {
          poolId,

          student: {
            teamMemberships: {
              none: {
                team: {
                  poolId,
                },

                status: 'ACTIVE',
              },
            },
          },
        },
      }),
    ]);

    return {
      poolId,
      status: pool.status,
      facultyCount,
      studentCount,
      projectCount,
      approvedCount,
      teamCount,
      unassignedStudents:
        unassigned,
    };
  }
}

export const poolsService =
  new PoolsService();