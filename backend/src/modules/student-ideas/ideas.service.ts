import prisma from '../../config/database';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../shared/errors/AppError';
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
  /**
   * Returns faculty members assigned to this pool who still
   * have supervisor capacity available.
   *
   * Capacity is:
   *
   *   approved projects already owned by faculty
   *   +
   *   supervisor-assigned ideas whose team does not yet have a project
   *
   * Once an idea's team has a project, that idea is not counted
   * separately because the project itself already consumes capacity.
   */
  async getAvailableSupervisors(poolId: string) {
    const pool = await prisma.pool.findUnique({
      where: {
        id: poolId,
      },
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

      const [approvedProjectCount, assignedIdeaCount] =
        await Promise.all([
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
              assignedTeam: {
                projectId: null,
              },
            },
          }),
        ]);

      const capacityUsed =
        approvedProjectCount + assignedIdeaCount;

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

  /**
   * Submit a student idea.
   *
   * The student's current team is stored on StudentIdea.
   * No project is created here.
   * No projectCode is assigned here.
   */
  async submitIdea(
    poolId: string,
    studentId: string,
    data: IdeaInput
  ) {
    const pool = await prisma.pool.findUnique({
      where: {
        id: poolId,
      },
    });

    if (!pool) {
      throw new NotFoundError('Pool not found');
    }

    if (!pool.allowStudentIdeas) {
      throw new BadRequestError(
        'Student ideas are not allowed in this pool'
      );
    }

    if (
      !['SELECTION_OPEN', 'TEAMS_FORMING'].includes(
        pool.status
      )
    ) {
      throw new BadRequestError(
        'Idea submission is not open'
      );
    }

    if (!data.title?.trim()) {
      throw new BadRequestError(
        'Idea title is required'
      );
    }

    if (!data.description?.trim()) {
      throw new BadRequestError(
        'Idea description is required'
      );
    }

    if (
      !Array.isArray(data.supervisorIds) ||
      data.supervisorIds.length !==
        REQUIRED_SUPERVISOR_PREFERENCES
    ) {
      throw new BadRequestError(
        'Exactly 3 supervisor preferences are required'
      );
    }

    const uniqueSupervisorIds = [
      ...new Set(data.supervisorIds),
    ];

    if (
      uniqueSupervisorIds.length !==
      REQUIRED_SUPERVISOR_PREFERENCES
    ) {
      throw new BadRequestError(
        'Supervisor preferences must be 3 different faculty members'
      );
    }

    /**
     * Find the student's active team in this pool.
     */
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
      where: {
        id: membership.teamId,
      },
    });

    if (!team) {
      throw new NotFoundError(
        'Your team could not be found'
      );
    }

    if (team.projectId) {
      throw new BadRequestError(
        'Your team already has a project'
      );
    }

    /**
     * Prevent multiple active ideas from the same student
     * in the same pool.
     */
    const existing = await prisma.studentIdea.findFirst({
      where: {
        poolId,
        studentId,
        status: {
          in: [
            'SUBMITTED',
            'UNDER_REVIEW',
            'APPROVED',
          ],
        },
      },
    });

    if (existing) {
      throw new BadRequestError(
        'You already have an active idea in this pool'
      );
    }

    /**
     * Validate all three selected supervisors.
     */
    const availableSupervisors =
      await this.getAvailableSupervisors(poolId);

    const availableIds = new Set(
      availableSupervisors.map(
        (faculty) => faculty.id
      )
    );

    for (const supervisorId of uniqueSupervisorIds) {
      if (!availableIds.has(supervisorId)) {
        throw new BadRequestError(
          'One or more selected supervisors are unavailable or have reached capacity'
        );
      }
    }

    /**
     * Similarity detection against existing projects.
     *
     * Rejected projects are ignored.
     */
    const existingProjects =
      await prisma.project.findMany({
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

    const similarityResult =
      similarityService.checkSimilarity(
        {
          title: data.title.trim(),
          description: data.description.trim(),
          domain:
            data.domain?.trim() || undefined,
        },
        existingProjects
      );

    if (similarityResult.action === 'BLOCK') {
      throw new ConflictError(
        `Idea cannot be submitted because it is too similar to an existing project (${similarityResult.highestSimilarity}%)`
      );
    }

    /**
     * Create the idea and exactly three supervisor preferences.
     *
     * assignedTeamId is saved at submission time so that
     * approval does not need to rediscover the student's team.
     */
    const idea = await prisma.$transaction(
      async (tx) => {
        const createdIdea =
          await tx.studentIdea.create({
            data: {
              poolId,
              studentId,
              title: data.title.trim(),
              description: data.description.trim(),
              domain:
                data.domain?.trim() || null,
              status: 'SUBMITTED',
              assignedTeamId: membership.teamId,
              supervisorId: null,
              similarityStatus:
                similarityResult.action,
              similarityScore:
                similarityResult.highestSimilarity,
              similarityCheckedAt: new Date(),
            },
          });

        await tx.supervisorPreference.createMany({
          data: uniqueSupervisorIds.map(
            (facultyId, index) => ({
              studentIdeaId: createdIdea.id,
              facultyId,
              preferenceOrder: index + 1,
              responseStatus: 'PENDING',
            })
          ),
        });

        return createdIdea;
      }
    );

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

  /**
   * Admin approves the idea.
   *
   * Approval:
   * 1. Marks StudentIdea APPROVED
   * 2. Creates the Project
   * 3. Associates the Project with the student's team
   * 4. Does NOT assign projectCode
   * 5. Opens the three supervisor requests
   *
   * The nightly project-code job is responsible for projectCode.
   */
  async approveIdea(
    ideaId: string,
    adminFeedback?: string
  ) {
    const idea = await prisma.studentIdea.findUnique({
      where: {
        id: ideaId,
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
        assignedTeam: true,
      },
    });

    if (!idea) {
      throw new NotFoundError('Idea not found');
    }

    if (
      idea.status !== 'SUBMITTED'
    ) {
      throw new BadRequestError(
        'Idea is not pending admin approval'
      );
    }

    if (
      idea.supervisorPreferences.length !==
      REQUIRED_SUPERVISOR_PREFERENCES
    ) {
      throw new BadRequestError(
        'This idea does not have exactly 3 supervisor preferences'
      );
    }

    if (!idea.assignedTeamId) {
      throw new BadRequestError(
        'This idea is not associated with a team'
      );
    }

    /**
     * The project requires a facultyId in the current schema.
     * Until a real supervisor accepts, the admin is used only
     * as the temporary project owner.
     *
     * Once a supervisor accepts or the admin manually assigns
     * one, Project.facultyId is immediately changed to the
     * actual supervisor.
     */
    const admin = await prisma.user.findFirst({
      where: {
        role: 'ADMIN',
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!admin) {
      throw new NotFoundError(
        'No active administrator found'
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const team = await tx.team.findUnique({
          where: {
            id: idea.assignedTeamId!,
          },
        });

        if (!team) {
          throw new NotFoundError(
            'Assigned team not found'
          );
        }

        if (team.projectId) {
          throw new ConflictError(
            'Student team already has a project'
          );
        }

       

        const updatedIdea =
          await tx.studentIdea.update({
            where: {
              id: ideaId,
            },
            data: {
              status: 'APPROVED',
              adminFeedback:
                adminFeedback?.trim() || null,
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

        /**
         * Create project WITHOUT projectCode.
         *
         * The nightly project-code service will assign it.
         */
        const poolConfig = await tx.pool.findUnique({
  where: {
    id: idea.poolId,
  },
  select: {
    defaultMaxTeamSize: true,
  },
});

if (!poolConfig) {
  throw new NotFoundError('Pool not found');
}

const project = await tx.project.create({
  data: {
    poolId: idea.poolId,
    facultyId: admin.id,
    title: idea.title,
    description: idea.description,
    domain: idea.domain,
    maxTeamSize: poolConfig.defaultMaxTeamSize,
    status: 'APPROVED',
  },
});

        /**
         * Assign the project to the exact team captured
         * when the student submitted the idea.
         */
        await tx.team.update({
          where: {
            id: team.id,
          },
          data: {
            projectId: project.id,
          },
        });

        /**
         * Reset supervisor request states so all three
         * requests can respond after approval.
         */
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

        return {
          idea: updatedIdea,
          project,
        };
      }
    );

    await notificationsService.create(
      idea.studentId,
      'IDEA_APPROVED',
      'Idea Approved',
      `Your idea "${idea.title}" has been approved. Your 3 selected supervisors can now respond.`,
      '/ideas'
    );

    /**
     * Notify all three selected supervisors.
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
      `Student idea approved and project created: ${ideaId} -> ${result.project.id}`
    );

    return this.getIdeaWithDetails(result.idea.id);
  }

  /**
   * Faculty supervision requests.
   */
  async getSupervisionRequests(
    poolId: string,
    facultyId: string
  ) {
    const poolFaculty =
      await prisma.poolFaculty.findUnique({
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

  /**
   * Faculty accepts supervision.
   */
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

          if (
            preference.responseStatus !== 'PENDING'
          ) {
            throw new BadRequestError(
              'This supervision request is no longer pending'
            );
          }

          const idea =
            await tx.studentIdea.findUnique({
              where: {
                id: ideaId,
              },
            });

          if (!idea) {
            throw new NotFoundError(
              'Idea not found'
            );
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

          /**
           * Count only actual capacity usage.
           *
           * Projects already owned by the faculty count.
           * Supervisor-assigned ideas without a project also
           * count. Once the team has a project, the idea is
           * not counted a second time.
           */
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
                assignedTeam: {
                  projectId: null,
                },
              },
            });

          if (
            approvedProjectCount +
              assignedIdeaCount >=
            MAX_SUPERVISOR_CAPACITY
          ) {
            throw new ConflictError(
              'You have reached the maximum supervisor capacity of 4 projects.'
            );
          }

          /**
           * Assign supervisor to idea.
           */
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

          /**
           * Transfer actual project ownership from the
           * temporary admin owner to the real supervisor.
           */
          if (idea.assignedTeamId) {
            const team = await tx.team.findUnique({
              where: {
                id: idea.assignedTeamId,
              },
              select: {
                projectId: true,
              },
            });

            if (team?.projectId) {
              await tx.project.update({
                where: {
                  id: team.projectId,
                },
                data: {
                  facultyId,
                },
              });
            }
          }

          /**
           * Mark this request accepted.
           */
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

          /**
           * Close the other two requests.
           */
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
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      ) {
        throw new ConflictError(
          'Supervisor assignment changed while you were accepting the request. Please refresh and try again.'
        );
      }

      throw error;
    }
  }

  /**
   * Faculty rejects a supervision request.
   */
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

        if (
          preference.responseStatus !== 'PENDING'
        ) {
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

  /**
   * Admin manually assigns a supervisor after all
   * three preferred supervisors have rejected the request.
   */
  async assignSupervisor(
    ideaId: string,
    supervisorId: string
  ) {
    const result = await prisma.$transaction(
      async (tx) => {
        const idea =
          await tx.studentIdea.findUnique({
            where: {
              id: ideaId,
            },
          });

        if (!idea) {
          throw new NotFoundError(
            'Idea not found'
          );
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

        const faculty =
          await tx.user.findUnique({
            where: {
              id: supervisorId,
            },
          });

        if (
          !faculty ||
          faculty.role !== 'FACULTY' ||
          !faculty.isActive
        ) {
          throw new BadRequestError(
            'Selected supervisor is not a valid active faculty member'
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
              assignedTeam: {
                projectId: null,
              },
            },
          });

        if (
          approvedProjectCount +
            assignedIdeaCount >=
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

        /**
         * Transfer project ownership to the manually
         * assigned supervisor.
         */
        if (idea.assignedTeamId) {
          const team = await tx.team.findUnique({
            where: {
              id: idea.assignedTeamId,
            },
            select: {
              projectId: true,
            },
          });

          if (team?.projectId) {
            await tx.project.update({
              where: {
                id: team.projectId,
              },
              data: {
                facultyId: supervisorId,
              },
            });
          }
        }

        /**
         * Close any still-pending supervisor requests.
         */
        await tx.supervisorPreference.updateMany({
          where: {
            studentIdeaId: ideaId,
            responseStatus: 'PENDING',
          },
          data: {
            responseStatus: 'CLOSED',
            respondedAt: new Date(),
            responseNote:
              'Supervisor manually assigned by administrator.',
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
   * No project is created by rejection.
   */
  async rejectIdea(
    ideaId: string,
    adminFeedback?: string
  ) {
    const idea =
      await prisma.studentIdea.findUnique({
        where: {
          id: ideaId,
        },
      });

    if (!idea) {
      throw new NotFoundError(
        'Idea not found'
      );
    }

    if (
      idea.status !== 'SUBMITTED'
    ) {
      throw new BadRequestError(
        'Only pending ideas can be rejected'
      );
    }

    if (idea.supervisorId) {
      throw new BadRequestError(
        'This idea already has a supervisor and cannot be rejected from this stage'
      );
    }

    const result =
      await prisma.$transaction(async (tx) => {
        await tx.supervisorPreference.updateMany({
          where: {
            studentIdeaId: ideaId,
            responseStatus: 'PENDING',
          },
          data: {
            responseStatus: 'CLOSED',
            respondedAt: new Date(),
            responseNote:
              'Idea rejected by administrator.',
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
      });

    await notificationsService.create(
      result.studentId,
      'IDEA_REJECTED',
      'Idea Rejected',
      `Your idea "${result.title}" has been rejected${
        adminFeedback
          ? `: ${adminFeedback}`
          : '.'
      }`,
      '/ideas'
    );

    return result;
  }

  /**
   * Admin/SubAdmin idea list.
   */
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
            projectId: true,
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

  /**
   * Student's ideas.
   */
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
            projectId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Complete idea details.
   */
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
            projectId: true,
          },
        },
      },
    });
  }
}

export const ideasService = new IdeasService();