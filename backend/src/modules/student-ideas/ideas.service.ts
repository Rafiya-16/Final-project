import prisma from '../../config/database';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError, } from '../../shared/errors/AppError';
import { Prisma } from '@prisma/client';
import { logger } from '../../shared/utils/logger';
import { notificationsService } from '../notifications/notifications.service';
import { similarityService } from '../projects/similarity/similarity.service';

const MAX_SUPERVISOR_CAPACITY = 4;
const REQUIRED_SUPERVISOR_PREFERENCES = 3;

type IdeaInput = {
  title: string;
  description: string;
  domain?: string;
  supervisorIds: string[];
};

export class IdeasService {
 
  async getAvailableSupervisors(poolId: string) {
    const pool = await prisma.pool.findUnique({
      where: { id: poolId },
    });

    if (!pool) {
      throw new NotFoundError('Pool not found');
    }

    const facultyAssignments = await prisma.poolFaculty.findMany({
      where: {
        poolId,
        faculty: {
          role: 'FACULTY',
          isActive: true,
        },
      },
      include: {
        faculty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            facultyId: true,
            designation: true,
          },
        },
      },
      orderBy: {
        assignedAt: 'asc',
      },
    });

    const result = [];

    for (const assignment of facultyAssignments) {
      const facultyId = assignment.facultyId;

      const [approvedProjectCount, assignedIdeaCount] = await Promise.all([
        prisma.project.count({
          where: {
            poolId,
            facultyId,
            status: 'APPROVED',
          },
        }),

        prisma.studentIdea.count({
          where: {
            poolId,
            supervisorId: facultyId,
            status: {
              not: 'REJECTED',
            },
          },
        }),
      ]);

      const capacityUsed = approvedProjectCount + assignedIdeaCount;
      const remainingCapacity = Math.max(
        0,
        MAX_SUPERVISOR_CAPACITY - capacityUsed
      );

      if (remainingCapacity > 0) {
        result.push({
          ...assignment.faculty,
          approvedProjectCount,
          assignedIdeaCount,
          capacityUsed,
          remainingCapacity,
        });
      }
    }

    return result;
  }

  async submitIdea(
    poolId: string,
    studentId: string,
    data: IdeaInput
  ) {
    const pool = await prisma.pool.findUnique({
      where: { id: poolId },
    });

    if (!pool) {
      throw new NotFoundError('Pool not found');
    }

    if (!pool.allowStudentIdeas) {
      throw new BadRequestError(
        'Student ideas are not allowed in this pool'
      );
    }

    if (!['SELECTION_OPEN', 'TEAMS_FORMING'].includes(pool.status)) {
      throw new BadRequestError('Idea submission is not open');
    }

    if (!data.title?.trim()) {
      throw new BadRequestError('Idea title is required');
    }

    if (!data.description?.trim()) {
      throw new BadRequestError('Idea description is required');
    }

    if (
      !Array.isArray(data.supervisorIds) ||
      data.supervisorIds.length !== REQUIRED_SUPERVISOR_PREFERENCES
    ) {
      throw new BadRequestError(
        'Exactly 3 supervisor preferences are required'
      );
    }

    const uniqueSupervisorIds = [...new Set(data.supervisorIds)];

    if (
      uniqueSupervisorIds.length !== REQUIRED_SUPERVISOR_PREFERENCES
    ) {
      throw new BadRequestError(
        'Supervisor preferences must be 3 different faculty members'
      );
    }

    const membership = await prisma.teamMember.findFirst({
      where: {
        studentId,
        status: 'ACTIVE',
        team: {
          poolId,
        },
      },
    });

    if (!membership) {
      throw new BadRequestError(
        'You must be in a team to submit an idea'
      );
    }

    const team = await prisma.team.findUnique({
      where: { id: membership.teamId },
    });

    if (team?.projectId) {
      throw new BadRequestError(
        'Your team already has a project'
      );
    }

    const existing = await prisma.studentIdea.findFirst({
      where: {
        poolId,
        studentId,
        status: {
          in: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'],
        },
      },
    });

    if (existing) {
      throw new BadRequestError(
        'You already have an active idea in this pool'
      );
    }

    /*
     * Validate that all 3 faculty members:
     * 1. exist
     * 2. are FACULTY
     * 3. are assigned to this pool
     * 4. still have capacity
     */
    const availableSupervisors =
      await this.getAvailableSupervisors(poolId);

    const availableIds = new Set(
      availableSupervisors.map((faculty) => faculty.id)
    );

    for (const supervisorId of uniqueSupervisorIds) {
      if (!availableIds.has(supervisorId)) {
        throw new BadRequestError(
          'One or more selected supervisors are unavailable or have reached capacity'
        );
      }
    }

const existingProjects = await prisma.project.findMany({
  where: {
    poolId,
    status: {
      not: 'REJECTED',
    },
  },
  select: {
    id: true,
    title: true,
    description: true,
    domain: true,
  },
});

const similarityResult = similarityService.checkSimilarity(
  {
    title: data.title.trim(),
    description: data.description.trim(),
    domain: data.domain?.trim() || undefined,
  },
  existingProjects
);

if (similarityResult.action === 'BLOCK') {
  throw new ConflictError(
    `Idea cannot be submitted because it is too similar to an existing project (${similarityResult.highestSimilarity}%)`
  );
}

    const idea = await prisma.$transaction(async (tx) => {
      const createdIdea = await tx.studentIdea.create({
        data: {
          poolId,
          studentId,
          title: data.title.trim(),
          description: data.description.trim(),
          domain: data.domain?.trim() || null,
          status: 'SUBMITTED',
          similarityStatus: similarityResult.action,
          similarityScore: similarityResult.highestSimilarity,
          similarityCheckedAt: new Date(),
        },
      });

      await tx.supervisorPreference.createMany({
  data: uniqueSupervisorIds.map((facultyId, index) => ({
    studentIdeaId: createdIdea.id,
    facultyId,
    preferenceOrder: index + 1,
    responseStatus: 'PENDING',
  })),
});

      return createdIdea;
    });

    await notificationsService.create(
      studentId,
      'IDEA_SUBMITTED',
      'Idea Submitted',
      `Your idea "${idea.title}" has been submitted for admin review.`,
      '/ideas'
    );

    logger.info(
      `Student idea submitted: ${idea.title} (${idea.id})`
    );

    return this.getIdeaWithDetails(idea.id);
  }

  async approveIdea(
    ideaId: string,
    adminFeedback?: string
  ) {
    const idea = await prisma.studentIdea.findUnique({
      where: { id: ideaId },
      include: {
        supervisorPreferences: {
          include: {
            faculty: true,
          },
          orderBy: {
            preferenceOrder: 'asc',
          },
        },
      },
    });

    if (!idea) {
      throw new NotFoundError('Idea not found');
    }

    if (
      idea.status !== 'SUBMITTED' &&
      idea.status !== 'UNDER_REVIEW'
    ) {
      throw new BadRequestError('Idea is not pending admin approval');
    }

    if (idea.supervisorPreferences.length !== 3) {
      throw new BadRequestError(
        'This idea does not have exactly 3 supervisor preferences'
      );
    }

    const membership = await prisma.teamMember.findFirst({
      where: {
        studentId: idea.studentId,
        status: 'ACTIVE',
        team: {
          poolId: idea.poolId,
        },
      },
    });

    if (!membership) {
      throw new BadRequestError(
        'Student is no longer in a team'
      );
    }

    const team = await prisma.team.findUnique({
      where: { id: membership.teamId },
    });

    if (team?.projectId) {
      throw new BadRequestError(
        'Student team already has a project'
      );
    }

    const updatedIdea = await prisma.$transaction(
      async (tx) => {
        const result = await tx.studentIdea.update({
          where: {
            id: ideaId,
          },
          data: {
            status: 'APPROVED',
            adminFeedback: adminFeedback?.trim() || null,
          },
          include: {
            supervisorPreferences: {
              include: {
                faculty: true,
              },
              orderBy: {
                preferenceOrder: 'asc',
              },
            },
          },
        });

        await tx.supervisorPreference.updateMany({
          where: {
           studentIdeaId: ideaId,
          },
          data: {
            responseStatus: 'PENDING',
            respondedAt: null,
            responseNote: null,
          },
        });

        return result;
      }
    );

    /*
     * Notify student.
     */
    await notificationsService.create(
      idea.studentId,
      'IDEA_APPROVED',
      'Idea Approved',
      `Your idea "${idea.title}" has been approved. Your 3 selected supervisors can now respond.`,
      '/ideas'
    );

    /*
     * Notify all 3 supervisors.
     */
    for (const preference of idea.supervisorPreferences) {
      await notificationsService.create(
        preference.facultyId,
        'SUPERVISION_REQUEST',
        'New Supervision Request',
        `You have received a supervision request for the student idea "${idea.title}" (Preference ${preference.preferenceOrder}).`,
        '/supervision-requests'
      );
    }

    logger.info(
      `Student idea approved and supervision requests opened: ${ideaId}`
    );

    return this.getIdeaWithDetails(updatedIdea.id);
  }

  /**
   * Faculty supervision requests.
   */
  async getSupervisionRequests(
  poolId: string,
  facultyId: string
) {
  const poolFaculty = await prisma.poolFaculty.findUnique({
    where: {
      poolId_facultyId: {
        poolId,
        facultyId,
      },
    },
  });

  if (!poolFaculty) {
    throw new ForbiddenError(
      'You are not assigned to this pool'
    );
  }

  return prisma.supervisorPreference.findMany({
    where: {
      facultyId,
      responseStatus: 'PENDING',
      studentIdea: {
        poolId,
        status: 'APPROVED',
        supervisorId: null,
      },
    },
    include: {
      studentIdea: {
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              enrollmentNo: true,
            },
          },
          supervisor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              facultyId: true,
              designation: true,
            },
          },
          supervisorPreferences: {
            orderBy: {
              preferenceOrder: 'asc',
            },
            include: {
              faculty: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  facultyId: true,
                  designation: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
}

  async acceptSupervision(
  ideaId: string,
  facultyId: string,
  responseNote?: string
) {
  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const preference =
          await tx.supervisorPreference.findUnique({
            where: {
              studentIdeaId_facultyId: {
                studentIdeaId: ideaId,
                facultyId,
              },
            },
            include: {
              studentIdea: true,
            },
          });

        if (!preference) {
          throw new ForbiddenError(
            'You do not have a supervision request for this idea'
          );
        }

        if (preference.responseStatus !== 'PENDING') {
          throw new BadRequestError(
            'This supervision request is no longer pending'
          );
        }

        const idea = await tx.studentIdea.findUnique({
          where: {
            id: ideaId,
          },
        });

        if (!idea) {
          throw new NotFoundError('Idea not found');
        }

        if (idea.status !== 'APPROVED') {
          throw new BadRequestError(
            'This idea is not available for supervisor assignment'
          );
        }

        if (idea.supervisorId) {
          throw new ConflictError(
            'Supervisor already assigned.'
          );
        }

        const approvedProjectCount =
          await tx.project.count({
            where: {
              poolId: idea.poolId,
              facultyId,
              status: 'APPROVED',
            },
          });

        const assignedIdeaCount =
          await tx.studentIdea.count({
            where: {
              poolId: idea.poolId,
              supervisorId: facultyId,
              status: {
                not: 'REJECTED',
              },
            },
          });

        if (
          approvedProjectCount + assignedIdeaCount >=
          MAX_SUPERVISOR_CAPACITY
        ) {
          throw new ConflictError(
            'You have reached the maximum supervisor capacity of 4 projects.'
          );
        }

        const updatedIdea =
          await tx.studentIdea.update({
            where: {
              id: ideaId,
            },
            data: {
              supervisorId: facultyId,
            },
            include: {
              student: true,
              supervisorPreferences: {
                include: {
                  faculty: true,
                },
              },
            },
          });

        await tx.supervisorPreference.update({
          where: {
            id: preference.id,
          },
          data: {
            responseStatus: 'ACCEPTED',
            respondedAt: new Date(),
            responseNote:
              responseNote?.trim() || null,
          },
        });

        await tx.supervisorPreference.updateMany({
          where: {
            studentIdeaId: ideaId,
            facultyId: {
              not: facultyId,
            },
            responseStatus: 'PENDING',
          },
          data: {
            responseStatus: 'CLOSED',
            respondedAt: new Date(),
            responseNote:
              'Supervisor already assigned.',
          },
        });

        return updatedIdea;
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    await notificationsService.create(
      result.studentId,
      'SUPERVISOR_ASSIGNED',
      'Supervisor Assigned',
      `Your idea "${result.title}" has been accepted by a supervisor.`,
      '/ideas'
    );

    await notificationsService.create(
      facultyId,
      'SUPERVISION_ACCEPTED',
      'Supervision Accepted',
      `You are now assigned as supervisor for "${result.title}".`,
      '/supervision-requests'
    );

    const closedPreferences =
      result.supervisorPreferences.filter(
        (preference) =>
          preference.facultyId !== facultyId
      );

    for (const preference of closedPreferences) {
      await notificationsService.create(
        preference.facultyId,
        'GENERAL',
        'Supervisor Already Assigned',
        `The supervision request for "${result.title}" is now closed because another supervisor accepted it first.`,
        '/supervision-requests'
      );
    }

    logger.info(
      `Supervisor assigned: ${facultyId} -> ${ideaId}`
    );

    return this.getIdeaWithDetails(ideaId);
  } catch (error: any) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2034'
    ) {
      throw new ConflictError(
        'Supervisor assignment changed while you were accepting the request. Please refresh and try again.'
      );
    }

    throw error;
  }
}

 async rejectSupervision(
  ideaId: string,
  facultyId: string,
  responseNote?: string
) {
  const result = await prisma.$transaction(
    async (tx) => {
      const preference =
        await tx.supervisorPreference.findUnique({
          where: {
            studentIdeaId_facultyId: {
              studentIdeaId: ideaId,
              facultyId,
            },
          },
          include: {
            studentIdea: true,
          },
        });

      if (!preference) {
        throw new ForbiddenError(
          'You do not have a supervision request for this idea'
        );
      }

      if (preference.responseStatus !== 'PENDING') {
        throw new BadRequestError(
          'This supervision request is no longer pending'
        );
      }

      if (preference.studentIdea.supervisorId) {
        throw new ConflictError(
          'Supervisor already assigned.'
        );
      }

      await tx.supervisorPreference.update({
        where: {
          id: preference.id,
        },
        data: {
          responseStatus: 'REJECTED',
          respondedAt: new Date(),
          responseNote:
            responseNote?.trim() || null,
        },
      });

      const remainingPending =
        await tx.supervisorPreference.count({
          where: {
            studentIdeaId: ideaId,
            responseStatus: 'PENDING',
          },
        });

      let requiresAdminAssignment = false;

      if (remainingPending === 0) {
        requiresAdminAssignment = true;

        await tx.studentIdea.update({
          where: {
            id: ideaId,
          },
          data: {
            status: 'UNDER_REVIEW',
          },
        });
      }

      return {
        idea: preference.studentIdea,
        requiresAdminAssignment,
      };
    }
  );

  await notificationsService.create(
    result.idea.studentId,
    'SUPERVISION_REJECTED',
    'Supervisor Response',
    `A supervisor has declined your idea "${result.idea.title}".`,
    '/ideas'
  );

  if (result.requiresAdminAssignment) {
    await notificationsService.create(
      result.idea.studentId,
      'GENERAL',
      'Supervisor Assignment Pending',
      `All three selected supervisors declined your idea "${result.idea.title}". An administrator must now assign a supervisor.`,
      '/ideas'
    );

    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    await notificationsService.createBulk(
      admins.map((admin) => admin.id),
      'GENERAL',
      'Manual Supervisor Assignment Required',
      `All three supervisors rejected "${result.idea.title}". Manual supervisor assignment is required.`,
      '/admin/review-ideas'
    );
  }

  logger.info(
    `Supervisor rejected idea: ${facultyId} -> ${ideaId}`
  );

  return this.getIdeaWithDetails(ideaId);
}


  async assignSupervisor(
    ideaId: string,
    supervisorId: string
  ) {
    const result = await prisma.$transaction(
      async (tx) => {
        const idea = await tx.studentIdea.findUnique({
          where: {
            id: ideaId,
          },
        });

        if (!idea) {
          throw new NotFoundError('Idea not found');
        }

        if (idea.supervisorId) {
          throw new ConflictError(
            'Supervisor already assigned.'
          );
        }

        if (idea.status !== 'UNDER_REVIEW') {
          throw new BadRequestError(
            'Manual supervisor assignment is only available after all three preferred supervisors reject the idea'
          );
        }

        const poolFaculty =
          await tx.poolFaculty.findUnique({
            where: {
              poolId_facultyId: {
                poolId: idea.poolId,
                facultyId: supervisorId,
              },
            },
          });

        if (!poolFaculty) {
          throw new BadRequestError(
            'Selected supervisor is not assigned to this pool'
          );
        }

        const faculty = await tx.user.findUnique({
          where: {
            id: supervisorId,
          },
        });

        if (!faculty || faculty.role !== 'FACULTY') {
          throw new BadRequestError(
            'Selected supervisor is not a valid faculty member'
          );
        }

        const approvedProjectCount =
          await tx.project.count({
            where: {
              poolId: idea.poolId,
              facultyId: supervisorId,
              status: 'APPROVED',
            },
          });

        const assignedIdeaCount =
          await tx.studentIdea.count({
            where: {
              poolId: idea.poolId,
              supervisorId,
              status: {
                not: 'REJECTED',
              },
            },
          });

        if (
          approvedProjectCount + assignedIdeaCount >=
          MAX_SUPERVISOR_CAPACITY
        ) {
          throw new ConflictError(
            'Selected supervisor has reached the maximum capacity of 4 projects.'
          );
        }

        const updatedIdea =
          await tx.studentIdea.update({
            where: {
              id: ideaId,
            },
            data: {
              supervisorId,
              status: 'APPROVED',
            },
            include: {
              student: true,
              supervisor: true,
            },
          });

        return updatedIdea;
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    await notificationsService.create(
      result.studentId,
      'SUPERVISOR_ASSIGNED',
      'Supervisor Assigned',
      `A supervisor has been assigned to your idea "${result.title}".`,
      '/ideas'
    );

    await notificationsService.create(
      supervisorId,
      'SUPERVISION_ACCEPTED',
      'Supervisor Assignment',
      `You have been assigned as supervisor for "${result.title}" by the administrator.`,
      '/supervision-requests'
    );

    logger.info(
      `Admin manually assigned supervisor ${supervisorId} to idea ${ideaId}`
    );

    return this.getIdeaWithDetails(ideaId);
  }

  /**
   * Admin rejects an idea.
   *
   * No Project is created.
   * Any existing supervisor requests are closed.
   */
  async rejectIdea(
    ideaId: string,
    adminFeedback?: string
  ) {
    const idea = await prisma.studentIdea.findUnique({
      where: {
        id: ideaId,
      },
    });

    if (!idea) {
      throw new NotFoundError('Idea not found');
    }

    if (idea.supervisorId) {
      throw new BadRequestError(
        'This idea already has a supervisor and cannot be rejected from this stage'
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {
        await tx.supervisorPreference.updateMany({
          where: {
            studentIdeaId: ideaId,
            responseStatus: 'PENDING',
          },
          data: {
            responseStatus: 'CLOSED',
            respondedAt: new Date(),
            responseNote: 'Idea rejected by administrator.',
          },
        });

        return tx.studentIdea.update({
          where: {
            id: ideaId,
          },
          data: {
            status: 'REJECTED',
            adminFeedback:
              adminFeedback?.trim() || null,
          },
        });
      }
    );

    await notificationsService.create(
      result.studentId,
      'IDEA_REJECTED',
      'Idea Rejected',
      `Your idea "${result.title}" has been rejected${adminFeedback ? `: ${adminFeedback}` : '.'}`,
      '/ideas'
    );

    return result;
  }

  async getIdeasByPool(poolId: string) {
    return prisma.studentIdea.findMany({
      where: {
        poolId,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            enrollmentNo: true,
          },
        },
        assignedTeam: {
          select: {
            id: true,
            name: true,
          },
        },
        supervisor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            facultyId: true,
            designation: true,
          },
        },
        supervisorPreferences: {
          orderBy: {
            preferenceOrder: 'asc',
          },
          include: {
            faculty: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                facultyId: true,
                designation: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getMyIdeas(
    poolId: string,
    studentId: string
  ) {
    return prisma.studentIdea.findMany({
      where: {
        poolId,
        studentId,
      },
      include: {
        supervisor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            facultyId: true,
            designation: true,
          },
        },
        supervisorPreferences: {
          orderBy: {
            preferenceOrder: 'asc',
          },
          include: {
            faculty: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                facultyId: true,
                designation: true,
              },
            },
          },
        },
        assignedTeam: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  private async getIdeaWithDetails(
    ideaId: string
  ) {
    return prisma.studentIdea.findUnique({
      where: {
        id: ideaId,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            enrollmentNo: true,
          },
        },
        supervisor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            facultyId: true,
            designation: true,
          },
        },
        supervisorPreferences: {
          orderBy: {
            preferenceOrder: 'asc',
          },
          include: {
            faculty: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                facultyId: true,
                designation: true,
              },
            },
          },
        },
        assignedTeam: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}

export const ideasService = new IdeasService();