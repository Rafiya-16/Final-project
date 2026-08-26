import prisma from '../../config/database';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from '../../shared/errors/AppError';
import { logger } from '../../shared/utils/logger';

export class IdeasService {
  async submitIdea(
    poolId: string,
    studentId: string,
    data: {
      title: string;
      description: string;
      domain?: string;
      preferredSupervisorId?: string;
    }
  ) {
    const pool = await prisma.pool.findUnique({
      where: { id: poolId },
    });

    if (!pool) {
      throw new NotFoundError('Pool not found');
    }

    if (!pool.allowStudentIdeas) {
      throw new BadRequestError(
        'Student ideas not allowed in this pool'
      );
    }

    if (
      !['SELECTION_OPEN', 'TEAMS_FORMING'].includes(
        pool.status
      )
    ) {
      throw new BadRequestError(
        'Idea submission not open'
      );
    }

    // Check student has a team
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

    // Check team doesn't already have a project
    const team = await prisma.team.findUnique({
      where: {
        id: membership.teamId,
      },
    });

    if (team?.projectId) {
      throw new BadRequestError(
        'Your team already has a project'
      );
    }

    // Check no existing pending idea from this student
    const existing = await prisma.studentIdea.findFirst({
      where: {
        poolId,
        studentId,
        status: {
          in: ['SUBMITTED', 'UNDER_REVIEW'],
        },
      },
    });

    if (existing) {
      throw new BadRequestError(
        'You already have a pending idea'
      );
    }

    /*
     * Validate preferred supervisor if the student selected one.
     */
    if (data.preferredSupervisorId) {
      const supervisor = await prisma.user.findUnique({
        where: {
          id: data.preferredSupervisorId,
        },
      });

      if (!supervisor) {
        throw new NotFoundError(
          'Preferred supervisor not found'
        );
      }

      if (supervisor.role !== 'FACULTY') {
        throw new BadRequestError(
          'Selected supervisor must be a faculty member'
        );
      }

      /*
       * Make sure the selected faculty is assigned
       * to this pool.
       */
      const poolFaculty =
        await prisma.poolFaculty.findFirst({
          where: {
            poolId,
            facultyId: data.preferredSupervisorId,
          },
        });

      if (!poolFaculty) {
        throw new BadRequestError(
          'Selected supervisor is not assigned to this pool'
        );
      }
    }

    return prisma.studentIdea.create({
      data: {
        poolId,
        studentId,
        title: data.title,
        description: data.description,
        domain: data.domain,
        preferredSupervisorId:
          data.preferredSupervisorId,
        status: 'SUBMITTED',
      },
      include: {
        preferredSupervisor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            facultyId: true,
          },
        },
      },
    });
  }

  async approveIdea(
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

    if (
      idea.status !== 'SUBMITTED' &&
      idea.status !== 'UNDER_REVIEW'
    ) {
      throw new BadRequestError(
        'Idea not pending'
      );
    }

    // Find student's team
    const membership =
      await prisma.teamMember.findFirst({
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
        'Student no longer in a team'
      );
    }

    const team = await prisma.team.findUnique({
      where: {
        id: membership.teamId,
      },
    });

    if (team?.projectId) {
      throw new BadRequestError(
        'Team already has a project'
      );
    }

    const pool = await prisma.pool.findUnique({
      where: {
        id: idea.poolId,
      },
    });

    if (!pool) {
      throw new NotFoundError('Pool not found');
    }

    /*
     * Create project from idea and assign it to team.
     */
    await prisma.$transaction(async (tx) => {
      /*
       * Keep the original behaviour:
       * the project created from a student idea is
       * initially associated with the ADMIN user.
       */
      const admin = await tx.user.findFirst({
        where: {
          role: 'ADMIN',
        },
      });

      if (!admin) {
        throw new NotFoundError(
          'Admin user not found'
        );
      }

      const project = await tx.project.create({
        data: {
          poolId: idea.poolId,
          facultyId: admin.id,
          title: idea.title,
          description: idea.description,
          domain: idea.domain,
          maxTeamSize:
            pool.defaultMaxTeamSize || 3,
          status: 'APPROVED',
        },
      });

      await tx.team.update({
        where: {
          id: membership!.teamId,
        },
        data: {
          projectId: project.id,
        },
      });

      await tx.studentIdea.update({
        where: {
          id: ideaId,
        },
        data: {
          status: 'APPROVED',
          adminFeedback,
          assignedTeamId: membership!.teamId,
        },
      });
    });

    logger.info(
      `Student idea approved: ${idea.title} (${ideaId})`
    );

    return {
      message:
        'Idea approved and assigned to team',
    };
  }

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

    return prisma.studentIdea.update({
      where: {
        id: ideaId,
      },
      data: {
        status: 'REJECTED',
        adminFeedback,
      },
    });
  }

  async getIdeasByPool(poolId: string) {
    const pool = await prisma.pool.findUnique({
      where: {
        id: poolId,
      },
    });

    if (!pool) {
      throw new NotFoundError('Pool not found');
    }

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

        preferredSupervisor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            facultyId: true,
            designation: true,
            department: true,
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
        preferredSupervisor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            facultyId: true,
            designation: true,
            department: true,
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
}

export const ideasService = new IdeasService();