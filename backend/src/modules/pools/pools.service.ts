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

type TimelineData = {
  submissionStart: Date;
  submissionEnd: Date;
  reviewStart: Date;
  reviewEnd: Date;
  decisionDeadline: Date;
  selectionStart: Date;
  selectionEnd: Date;
  ideaSubmissionStart: Date;
  ideaSubmissionEnd: Date;
  teamFreezeDate: Date;
};

const TIMELINE_DATE_FIELDS = [
  'submissionStart',
  'submissionEnd',
  'reviewStart',
  'reviewEnd',
  'decisionDeadline',
  'selectionStart',
  'selectionEnd',
  'ideaSubmissionStart',
  'ideaSubmissionEnd',
  'teamFreezeDate',
] as const;

type TimelineField =
  (typeof TIMELINE_DATE_FIELDS)[number];

/**
 * Add calendar days to a Date.
 */
function addDays(
  date: Date,
  days: number,
): Date {
  const result = new Date(date);
  result.setDate(
    result.getDate() + days,
  );
  return result;
}

function toValidDate(
  value: unknown,
  fieldName: string,
): Date {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new BadRequestError(
        `${fieldName} is not a valid date`,
      );
    }

    return value;
  }

  if (
    typeof value !== 'string' &&
    typeof value !== 'number'
  ) {
    throw new BadRequestError(
      `${fieldName} is required`,
    );
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestError(
      `${fieldName} is not a valid date`,
    );
  }

  return date;
}

/**
 * Builds a complete timeline.
 */
function buildTimeline(
  data: any,
): TimelineData {
  const submissionStart =
    toValidDate(
      data.submissionStart,
      'Faculty Project Submission Start',
    );

  const submissionEnd =
    data.submissionEnd
      ? toValidDate(
          data.submissionEnd,
          'Faculty Project Submission End',
        )
      : addDays(
          submissionStart,
          9,
        );

  const reviewStart =
    data.reviewStart
      ? toValidDate(
          data.reviewStart,
          'PQAC Review Start',
        )
      : new Date(
          submissionStart,
        );

  const reviewEnd =
    data.reviewEnd
      ? toValidDate(
          data.reviewEnd,
          'PQAC Review End',
        )
      : addDays(
          submissionEnd,
          2,
        );

  const decisionDeadline =
    data.decisionDeadline
      ? toValidDate(
          data.decisionDeadline,
          'Admin Decision Deadline',
        )
      : addDays(
          reviewEnd,
          3,
        );

  const selectionStart =
    data.selectionStart
      ? toValidDate(
          data.selectionStart,
          'Student Project Selection Start',
        )
      : addDays(
          reviewEnd,
          1,
        );

  const selectionEnd =
    data.selectionEnd
      ? toValidDate(
          data.selectionEnd,
          'Student Project Selection End',
        )
      : addDays(
          selectionStart,
          9,
        );

  const ideaSubmissionStart =
    data.ideaSubmissionStart
      ? toValidDate(
          data.ideaSubmissionStart,
          'Student Idea Submission Start',
        )
      : addDays(
          selectionEnd,
          1,
        );

  const ideaSubmissionEnd =
    data.ideaSubmissionEnd
      ? toValidDate(
          data.ideaSubmissionEnd,
          'Student Idea Submission End',
        )
      : addDays(
          ideaSubmissionStart,
          3,
        );

  const teamFreezeDate =
    data.teamFreezeDate
      ? toValidDate(
          data.teamFreezeDate,
          'Team Freeze',
        )
      : addDays(
          ideaSubmissionEnd,
          5,
        );

  return {
    submissionStart,
    submissionEnd,
    reviewStart,
    reviewEnd,
    decisionDeadline,
    selectionStart,
    selectionEnd,
    ideaSubmissionStart,
    ideaSubmissionEnd,
    teamFreezeDate,
  };
}

/**
 * Validates the final timeline.
 */
function validateTimeline(
  timeline: TimelineData,
): void {
  const {
    submissionStart,
    submissionEnd,
    reviewStart,
    reviewEnd,
    decisionDeadline,
    selectionStart,
    selectionEnd,
    ideaSubmissionStart,
    ideaSubmissionEnd,
    teamFreezeDate,
  } = timeline;

  if (!(submissionStart < submissionEnd)) {
    throw new BadRequestError(
      'Faculty Project Submission End must be after Submission Start.',
    );
  }

  if (!(reviewStart < reviewEnd)) {
    throw new BadRequestError(
      'PQAC Review End must be after Review Start.',
    );
  }

  if (reviewStart < submissionStart) {
    throw new BadRequestError(
      'PQAC Review Start cannot be before Faculty Project Submission Start.',
    );
  }

  if (reviewEnd < submissionEnd) {
    throw new BadRequestError(
      'PQAC Review End cannot be before Faculty Project Submission End.',
    );
  }

  if (decisionDeadline < reviewEnd) {
    throw new BadRequestError(
      'Admin Decision Deadline cannot be before PQAC Review End.',
    );
  }

  if (!(selectionStart < selectionEnd)) {
    throw new BadRequestError(
      'Student Project Selection End must be after Selection Start.',
    );
  }

  if (selectionStart <= reviewEnd) {
    throw new BadRequestError(
      'Student Project Selection must start after PQAC Review has ended.',
    );
  }

  if (ideaSubmissionStart <= selectionEnd) {
    throw new BadRequestError(
      'Student Idea Submission must start after Student Project Selection has ended.',
    );
  }

  if (!(ideaSubmissionStart < ideaSubmissionEnd)) {
    throw new BadRequestError(
      'Student Idea Submission End must be after Idea Submission Start.',
    );
  }

  if (teamFreezeDate <= ideaSubmissionEnd) {
    throw new BadRequestError(
      'Team Freeze must be after Student Idea Submission End.',
    );
  }
}

/**
 * Convert a timeline into Prisma-compatible data.
 */
function timelineToPrismaData(
  timeline: TimelineData,
) {
  return {
    submissionStart:
      timeline.submissionStart,

    submissionEnd:
      timeline.submissionEnd,

    reviewStart:
      timeline.reviewStart,

    reviewEnd:
      timeline.reviewEnd,

    decisionDeadline:
      timeline.decisionDeadline,

    selectionStart:
      timeline.selectionStart,

    selectionEnd:
      timeline.selectionEnd,

    ideaSubmissionStart:
      timeline.ideaSubmissionStart,

    ideaSubmissionEnd:
      timeline.ideaSubmissionEnd,

    teamFreezeDate:
      timeline.teamFreezeDate,
  };
}

function sortFacultyAlphabetically<
  T extends {
    id: string;
    firstName: string | null;
    lastName: string | null;
  },
>(
  faculty: T[],
): T[] {
  return [...faculty].sort(
    (a, b) => {
      const nameA =
        `${a.firstName ?? ''} ${
          a.lastName ?? ''
        }`
          .trim()
          .toLocaleLowerCase();

      const nameB =
        `${b.firstName ?? ''} ${
          b.lastName ?? ''
        }`
          .trim()
          .toLocaleLowerCase();

      const comparison =
        nameA.localeCompare(
          nameB,
        );

      if (comparison !== 0) {
        return comparison;
      }

      return a.id.localeCompare(
        b.id,
      );
    },
  );
}

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

    const users =
      await prisma.user.findMany({
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
      users.map((user) => [
        user.id,
        user,
      ]),
    );

    const missingIds =
      allIds.filter(
        (id) => !userMap.has(id),
      );

    if (missingIds.length > 0) {
      throw new BadRequestError(
        `One or more selected users do not exist: ${missingIds.join(', ')}`,
      );
    }

    const inactiveUsers =
      users.filter(
        (user) => !user.isActive,
      );

    if (inactiveUsers.length > 0) {
      const names =
        inactiveUsers
          .map(
            (user) =>
              `${user.firstName} ${user.lastName}`,
          )
          .join(', ');

      throw new BadRequestError(
        `Cannot assign inactive users to a pool: ${names}`,
      );
    }

    const invalidSubadmins =
      subadminIds
        .map((id) =>
          userMap.get(id),
        )
        .filter(
          (user) =>
            user &&
            user.role !==
              'SUBADMIN' &&
            user.role !==
              'FACULTY',
        );

    if (
      invalidSubadmins.length >
      0
    ) {
      const names =
        invalidSubadmins
          .map(
            (user) =>
              `${user!.firstName} ${user!.lastName}`,
          )
          .join(', ');

      throw new BadRequestError(
        `SubAdmin assignment is allowed only for SUBADMIN or FACULTY users. Invalid users: ${names}`,
      );
    }

    const invalidFaculty =
      facultyIds
        .map((id) =>
          userMap.get(id),
        )
        .filter(
          (user) =>
            user &&
            user.role !==
              'FACULTY',
        );

    if (
      invalidFaculty.length >
      0
    ) {
      const names =
        invalidFaculty
          .map(
            (user) =>
              `${user!.firstName} ${user!.lastName}`,
          )
          .join(', ');

      throw new BadRequestError(
        `Faculty assignment is allowed only for FACULTY users. Invalid users: ${names}`,
      );
    }

    const invalidStudents =
      studentIds
        .map((id) =>
          userMap.get(id),
        )
        .filter(
          (user) =>
            user &&
            user.role !==
              'STUDENT',
        );

    if (
      invalidStudents.length >
      0
    ) {
      const names =
        invalidStudents
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

  async createPool(
    data: any,
    adminId: string,
  ) {
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

    const timeline =
      buildTimeline(data);

    validateTimeline(
      timeline,
    );

    /**
     * Fetch faculty names so the initial
     * allocation order can be alphabetical.
     */
    const facultyUsers =
      facultyIds.length > 0
        ? await prisma.user.findMany({
            where: {
              id: {
                in: facultyIds,
              },
            },
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          })
        : [];

    const sortedFaculty =
      sortFacultyAlphabetically(
        facultyUsers,
      );

    const pool =
      await prisma.pool.create({
        data: {
          name: data.name,
          academicYear:
            data.academicYear,
          semester: data.semester,
          department:
            data.department,
          status: 'DRAFT',

          ...timelineToPrismaData(
            timeline,
          ),

          minTeamSize:
            data.minTeamSize ?? 3,

          defaultMaxTeamSize:
            data.defaultMaxTeamSize ??
            3,

          allowStudentIdeas:
            data.allowStudentIdeas ??
            true,

          createdById:
            adminId,

          subadmins: {
            create:
              subadminIds.map(
                (
                  id: string,
                ) => ({
                  subadminId:
                    id,
                }),
              ),
          },

          faculty: {
            create:
              sortedFaculty.map(
                (
                  faculty,
                  index,
                ) => ({
                  facultyId:
                    faculty.id,

                  allocationOrder:
                    index + 1,
                }),
              ),
          },

          students: {
            create:
              studentIds.map(
                (
                  id: string,
                ) => ({
                  studentId:
                    id,
                }),
              ),
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
            orderBy: {
              allocationOrder:
                'asc',
            },
          },

          _count: {
            select: {
              students: true,
            },
          },
        },
      });

    if (subadminIds.length > 0) {
      await Promise.all(
        subadminIds.map(
          (subadminId) =>
            notifySubadminAccessGranted(
              pool.id,
              subadminId,
            ).catch(
              (error) => {
                logger.error(
                  `Failed to send SubAdmin grant notification for ${subadminId}`,
                  error,
                );
              },
            ),
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
    scope:
      | 'faculty'
      | 'subadmin'
      | 'student'
      | 'all' = 'all',
  ) {
    let where: any = {};

    if (userRole === 'ADMIN') {
      where = {};
    } else if (userRole === 'SUBADMIN') {
      where = {
        subadmins: {
          some: {
            subadminId: userId,
          },
        },
      };
    } else if (userRole === 'FACULTY') {
      if (scope === 'subadmin') {
        where = {
          subadmins: {
            some: {
              subadminId: userId,
            },
          },
        };
      } else if (scope === 'faculty') {
        where = {
          faculty: {
            some: {
              facultyId: userId,
            },
          },
        };
      } else {
        where = {
          OR: [
            {
              faculty: {
                some: {
                  facultyId: userId,
                },
              },
            },
            {
              subadmins: {
                some: {
                  subadminId: userId,
                },
              },
            },
          ],
        };
      }
    } else if (userRole === 'STUDENT') {
      where = {
        students: {
          some: {
            studentId: userId,
          },
        },
      };
    }

    const skip = (params.page - 1) * params.limit;

    const [pools, total] = await Promise.all([
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

    return paginatedResult(pools, total, params);
  }
  /**
   * Get a single pool by ID.
   */
  async getPoolById(
  poolId: string,
) {
  await this.syncPoolPhase(poolId);

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
          orderBy: {
            allocationOrder: 'asc',
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
   * Update a pool.
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

    const currentTimeline:
      TimelineData = {
      submissionStart:
        pool.submissionStart,

      submissionEnd:
        pool.submissionEnd,

      reviewStart:
        pool.reviewStart,

      reviewEnd:
        pool.reviewEnd,

      decisionDeadline:
        pool.decisionDeadline,

      selectionStart:
        pool.selectionStart,

      selectionEnd:
        pool.selectionEnd,

      ideaSubmissionStart:
        pool.ideaSubmissionStart ??
        addDays(
          pool.selectionEnd,
          1,
        ),

      ideaSubmissionEnd:
        pool.ideaSubmissionEnd ??
        addDays(
          pool.selectionEnd,
          4,
        ),

      teamFreezeDate:
        pool.teamFreezeDate,
    };

    const mergedTimelineInput:
      any = {
      ...currentTimeline,
      ...data,
    };

    const timeline =
      buildTimeline(
        mergedTimelineInput,
      );

    validateTimeline(
      timeline,
    );

    const updateData: any =
      {};

    for (const [
      key,
      value,
    ] of Object.entries(
      data,
    )) {
      if (
        value ===
        undefined
      ) {
        continue;
      }

      if (
        !TIMELINE_DATE_FIELDS.includes(
          key as TimelineField,
        )
      ) {
        updateData[key] =
          value;
      }
    }

    Object.assign(
      updateData,
      timelineToPrismaData(
        timeline,
      ),
    );

    return prisma.pool.update({
      where: {
        id: poolId,
      },

      data: updateData,
    });
  }
  private getPoolPhaseFromTimeline(
    pool: {
      status: PoolStatus;
      submissionStart: Date;
      submissionEnd: Date;    
      reviewStart: Date;
      reviewEnd: Date;
      selectionStart: Date;
      selectionEnd: Date;
      ideaSubmissionStart: Date | null;
      ideaSubmissionEnd: Date | null;
      teamFreezeDate: Date;
    },
    now = new Date(),
  ): PoolStatus {
    if (pool.status === 'ARCHIVED') {
      return 'ARCHIVED';
    }

    if (now < pool.submissionStart) {
      return 'DRAFT';
    }

     if (now < pool.submissionEnd) {
    return 'SUBMISSION_OPEN';
  }

    if (now < pool.reviewEnd) {
      return 'UNDER_REVIEW';
    }

    if (now < pool.selectionStart) {
      return 'DECISION_PENDING';
    }

    if (now < pool.selectionEnd) {
      return 'SELECTION_OPEN';
    }

    if (
      pool.ideaSubmissionStart &&
      pool.ideaSubmissionEnd
    ) {
      if (now < pool.ideaSubmissionStart) {
        return 'TEAMS_FORMING';
      }

      if (now < pool.ideaSubmissionEnd) {
        return 'IDEA_SUBMISSION';
      }
    }

    if (now < pool.teamFreezeDate) {
      return 'TEAMS_FORMING';
    }

    return 'FROZEN';
  }

  private async transitionPoolPhase(
  poolId: string,
  nextStatus: PoolStatus,
  previousStatus: PoolStatus,
  auditAction:
    | 'ACTIVATE_POOL'
    | 'ADVANCE_PHASE'
    | 'SYNC_PHASE' = 'SYNC_PHASE',
) {
  if (previousStatus === nextStatus) {
    return prisma.pool.findUnique({
      where: {
        id: poolId,
      },
    });
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

  const updated = await prisma.pool.update({
    where: {
      id: poolId,
    },
    data: {
      status: nextStatus,
    },
  });

  if (auditAction !== 'SYNC_PHASE') {
    const systemUser = await prisma.user.findFirst({
      where: {
        role: 'ADMIN',
      },
      select: {
        id: true,
      },
    });

    if (systemUser) {
      await auditService.log(
        systemUser.id,
        auditAction,
        'Pool',
        poolId,
        previousStatus,
        nextStatus,
      );
    }
  }

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
          `Pool "${updated!.name}" is now in review. Faculty proposals are ready for your review.`,
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
          `Project selection is now open for pool "${updated!.name}".`,
          `/pools/${poolId}`,
        )
        .catch(() => {});
    }
  }

  return updated;
}

  async syncPoolPhase(
    poolId: string,
    now = new Date(),
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

    if (
      pool.status ===
        'ARCHIVED'
    ) {
      return pool;
    }

    const expectedStatus =
      this.getPoolPhaseFromTimeline(
        pool,
        now,
      );

    if (
      expectedStatus ===
      pool.status
    ) {
      return pool;
    }

    return this.transitionPoolPhase(
      poolId,
      expectedStatus,
      pool.status,
      'SYNC_PHASE',
    );
  }

    async activatePool(
    poolId: string,
  ) {
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

    if (
      pool._count.subadmins === 0
    ) {
      throw new BadRequestError(
        'Assign at least 1 subadmin',
      );
    }

    if (
      pool._count.faculty === 0
    ) {
      throw new BadRequestError(
        'Assign at least 1 faculty',
      );
    }

    if (
      pool._count.students === 0
    ) {
      throw new BadRequestError(
        'Assign at least 1 student',
      );
    }

    const expectedStatus =
      this.getPoolPhaseFromTimeline(
        pool,
        new Date(),
      );

    const updated =
      await this.transitionPoolPhase(
        poolId,
        expectedStatus,
        pool.status,
        'ACTIVATE_POOL',
      );

    const facultyAssignments =
      await prisma.poolFaculty.findMany({
        where: {
          poolId,
        },
        select: {
          facultyId: true,
        },
      });

    if (
      facultyAssignments.length > 0 &&
      expectedStatus ===
        'SUBMISSION_OPEN'
    ) {
      notificationsService
        .createBulk(
          facultyAssignments.map(
            (faculty) =>
              faculty.facultyId,
          ),
          'SUBMISSION_REMINDER',
          'Submissions Open',
          `Pool "${pool.name}" is now open for proposal submissions.`,
          `/pools/${poolId}`,
        )
        .catch(() => {});
    }

    return updated;
  }

  /**
   * Advance the pool to the next phase.
   */
    async advancePhase(
    poolId: string,
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

    const transitions: Partial<
      Record<PoolStatus, PoolStatus>
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
        'IDEA_SUBMISSION',

      IDEA_SUBMISSION:
        'TEAMS_FORMING',
    };

    const nextStatus =
      transitions[pool.status];

    if (!nextStatus) {
      throw new BadRequestError(
        `Cannot advance from ${pool.status}`,
      );
    }

    return this.transitionPoolPhase(
      poolId,
      nextStatus,
      pool.status,
      'ADVANCE_PHASE',
    );
  }

  /**
   * Freeze a pool and all active teams.
   */
  async freezePool(
    poolId: string,
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
   * Archive a pool.
   */
  async archivePool(
    poolId: string,
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
        ? await prisma.poolSubadmin.findMany(
            {
              where: {
                poolId,
                subadminId: {
                  in: subadminIds,
                },
              },

              select: {
                subadminId:
                  true,
              },
            },
          )
        : [];

    const existingSubadminIds =
      new Set(
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

    /**
     * SubAdmin assignments.
     */
    if (
      subadminIds.length >
      0
    ) {
      for (const subadminId of subadminIds) {
        await prisma.poolSubadmin.upsert(
          {
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
          },
        );
      }
    }

    if (
      facultyIds.length >
      0
    ) {
      const existingFacultyAssignments =
        await prisma.poolFaculty.findMany(
          {
            where: {
              poolId,
            },

            select: {
              facultyId:
                true,
              allocationOrder:
                true,
            },

            orderBy: {
              allocationOrder:
                'desc',
            },
          },
        );

      let nextAllocationOrder =
        existingFacultyAssignments
          .map(
            (assignment) =>
              assignment.allocationOrder,
          )
          .filter(
            (
              order,
            ): order is number =>
              order !== null,
          )
          .reduce(
            (
              maximum,
              order,
            ) =>
              Math.max(
                maximum,
                order,
              ),
            0,
          ) + 1;

      const existingFacultyIds =
        new Set(
          existingFacultyAssignments.map(
            (assignment) =>
              assignment.facultyId,
          ),
        );

      for (const facultyId of facultyIds) {
        /**
         * Existing faculty:
         * keep their current allocationOrder.
         */
        if (
          existingFacultyIds.has(
            facultyId,
          )
        ) {
          continue;
        }

        await prisma.poolFaculty.create(
          {
            data: {
              poolId,
              facultyId,
              allocationOrder:
                nextAllocationOrder,
            },
          },
        );

        nextAllocationOrder++;
      }
    }

    /**
     * Student assignments.
     */
    if (
      studentIds.length >
      0
    ) {
      for (const studentId of studentIds) {
        await prisma.poolStudent.upsert(
          {
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
          },
        );
      }
    }

    if (
      newlyAssignedSubadminIds.length >
      0
    ) {
      await Promise.all(
        newlyAssignedSubadminIds.map(
          (subadminId) =>
            notifySubadminAccessGranted(
              poolId,
              subadminId,
            ).catch(
              (error) => {
                logger.error(
                  `Failed to send SubAdmin grant notification for ${subadminId}`,
                  error,
                );
              },
            ),
        ),
      );
    }

    return this.getPoolById(
      poolId,
    );
  }

  async removeFaculty(
    poolId: string,
    facultyId: string,
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

    const assignment =
      await prisma.poolFaculty.findUnique(
        {
          where: {
            poolId_facultyId: {
              poolId,
              facultyId,
            },
          },
        },
      );

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

    return this.getPoolById(
      poolId,
    );
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
      await prisma.poolSubadmin.findUnique(
        {
          where: {
            poolId_subadminId: {
              poolId,
              subadminId,
            },
          },
        },
      );

    if (!assignment) {
      throw new NotFoundError(
        'SubAdmin is not assigned to this pool',
      );
    }

    await prisma.poolSubadmin.delete(
      {
        where: {
          poolId_subadminId: {
            poolId,
            subadminId,
          },
        },
      },
    );

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

    return this.getPoolById(
      poolId,
    );
  }

  /**
   * Get statistics for a pool.
   */
  async getPoolStats(
    poolId: string,
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