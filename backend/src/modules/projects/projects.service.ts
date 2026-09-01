import prisma from '../../config/database';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from '../../shared/errors/AppError';
import { PROPOSALS_PER_FACULTY } from '../../config/constants';
import { logger } from '../../shared/utils/logger';
import { auditService } from '../audit/audit.service';
import { notificationsService } from '../notifications/notifications.service';
import { similarityService } from './similarity/similarity.service';

export class ProjectsService {
  /**
   * Check a proposal against all other proposals
   * in the same pool.
   *
   * Rejected projects are ignored.
   *
   * excludeProjectId is useful when editing an
   * existing draft so that the project does not
   * compare against itself.
   */
  async checkProjectSimilarity(
  poolId: string,
  data: {
    title: string;
    description: string;
    domain?: string | null;
  },
  excludeProjectId?: string
) {
  if (!data.title?.trim()) {
    throw new BadRequestError(
      'Project title is required'
    );
  }

  if (!data.description?.trim()) {
    throw new BadRequestError(
      'Project description is required'
    );
  }

  const existingProjects =
    await prisma.project.findMany({
      where: {
        poolId,

        // Rejected projects should not affect
        // future similarity checks.
        status: {
          not: 'REJECTED',
        },

        ...(excludeProjectId
          ? {
              id: {
                not: excludeProjectId,
              },
            }
          : {}),
      },

      select: {
        id: true,
        title: true,
        description: true,
        domain: true,
      },
    });

  return similarityService.checkSimilarity(
    {
      id: excludeProjectId,
      title: data.title.trim(),
      description: data.description.trim(),
      domain: data.domain?.trim() || null,
    },
    existingProjects
  );
}

  /**
   * Faculty creates a project proposal.
   */
  async submitProposal(
    poolId: string,
    facultyId: string,
    data: any
  ) {
    // Verify faculty is assigned to this pool.
    const assignment = await prisma.poolFaculty.findUnique({
      where: {
        poolId_facultyId: {
          poolId,
          facultyId,
        },
      },
    });

    if (!assignment) {
      throw new ForbiddenError(
        'You are not assigned to this pool'
      );
    }

    // Faculty cannot create more proposals after final submission.
    if (assignment.hasSubmitted) {
      throw new BadRequestError(
        'You have already submitted your proposals'
      );
    }

    // Verify pool.
    const pool = await prisma.pool.findUnique({
      where: {
        id: poolId,
      },
    });

    if (!pool) {
      throw new NotFoundError('Pool not found');
    }

    if (pool.status !== 'SUBMISSION_OPEN') {
      throw new BadRequestError(
        'Submissions are not open'
      );
    }

    // Count faculty's proposals in this pool.
    const count = await prisma.project.count({
      where: {
        poolId,
        facultyId,
      },
    });

    if (count >= PROPOSALS_PER_FACULTY) {
      throw new BadRequestError(
        `Maximum ${PROPOSALS_PER_FACULTY} proposals allowed`
      );
    }

    /**
     * Check similarity immediately when creating
     * the proposal.
     *
     * This does NOT block creation. It stores the
     * similarity result so the faculty can see it
     * and finalization performs the final check.
     */
    const similarity = await this.checkProjectSimilarity(
      poolId,
      {
        title: data.title,
        description: data.description,
        domain: data.domain ?? null,
      }
    );

    return prisma.project.create({
      data: {
        poolId,
        facultyId,

        title: data.title,
        description: data.description,
        domain: data.domain ?? null,
        prerequisites: data.prerequisites ?? null,

        maxTeamSize:
          data.maxTeamSize || pool.defaultMaxTeamSize,

        expectedOutcome:
          data.expectedOutcome ?? null,

        status: 'DRAFT',

        similarityStatus: similarity.action,
        similarityScore: similarity.highestSimilarity,
      },
    });
  }

  /**
   * Faculty finalizes all proposals.
   *
   * The faculty must have exactly
   * PROPOSALS_PER_FACULTY proposals.
   *
   * Every proposal is checked against the other
   * proposals in the same pool.
   */
  async finalizeSubmission(
    poolId: string,
    facultyId: string
  ) {
    // Verify pool.
    const pool = await prisma.pool.findUnique({
      where: {
        id: poolId,
      },
    });

    if (!pool) {
      throw new NotFoundError('Pool not found');
    }

    if (pool.status !== 'SUBMISSION_OPEN') {
      throw new BadRequestError(
        'Submissions are not open'
      );
    }

    // Verify faculty assignment.
    const assignment = await prisma.poolFaculty.findUnique({
      where: {
        poolId_facultyId: {
          poolId,
          facultyId,
        },
      },
    });

    if (!assignment) {
      throw new ForbiddenError(
        'You are not assigned to this pool'
      );
    }

    if (assignment.hasSubmitted) {
      throw new BadRequestError(
        'You have already submitted your proposals'
      );
    }

    /**
     * Only DRAFT proposals can be finalized.
     *
     * This prevents already submitted/locked/approved
     * projects from being included again.
     */
    const projects = await prisma.project.findMany({
      where: {
        poolId,
        facultyId,
        status: 'DRAFT',
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (projects.length !== PROPOSALS_PER_FACULTY) {
      throw new BadRequestError(
        `You must have exactly ${PROPOSALS_PER_FACULTY} proposals. Current: ${projects.length}`
      );
    }

    const similarityResults: Array<{
      projectId: string;
      action: string;
      highestSimilarity: number;
      [key: string]: any;
    }> = [];

    /**
     * Check each project against all OTHER projects
     * in the pool.
     *
     * The current project is excluded from its own
     * comparison.
     */
    for (const project of projects) {
      const similarity =
        await this.checkProjectSimilarity(
          poolId,
          {
            title: project.title,
            description: project.description,
            domain: project.domain,
          },
          project.id
        );

      similarityResults.push({
        projectId: project.id,
        ...similarity,
      });
    }

    /**
     * If any proposal is blocked by similarity,
     * do not submit any proposal.
     */
   const blockedProjects = similarityResults.filter(
  (result) => result.action === 'BLOCK'
);

if (blockedProjects.length > 0) {
  await prisma.$transaction(
    similarityResults.map((result) =>
      prisma.project.update({
        where: { id: result.projectId },
        data: {
          similarityStatus: result.action,
          similarityScore: result.highestSimilarity,
        },
      })
    )
  );

  const blockedProjectDetails = blockedProjects.map((result) => {
    const matchingProject = result.similarProjects?.[0];

    return {
      projectId: result.projectId,
      title: result.title,
      similarityScore: result.highestSimilarity,
      similarityStatus: result.action,
      similarProjectId: matchingProject?.projectId || null,
      similarProjectTitle: matchingProject?.title || null,
      similarProjectScore: matchingProject?.similarityScore || null,
    };
  });

  const error = new BadRequestError(
    'Some proposals are too similar to existing proposals. Please modify the highlighted proposals before finalizing.'
  );

  (error as any).details = {
    blockedProjects: blockedProjectDetails,
  };

  throw error;
}

    /**
     * Submit all proposals atomically.
     */
    await prisma.$transaction(async (tx) => {
      for (const result of similarityResults) {
        await tx.project.update({
          where: {
            id: result.projectId,
          },

          data: {
            status: 'SUBMITTED',

            similarityStatus:
              result.action,

            similarityScore:
              result.highestSimilarity,
          },
        });
      }

      await tx.poolFaculty.update({
        where: {
          poolId_facultyId: {
            poolId,
            facultyId,
          },
        },

        data: {
          hasSubmitted: true,
          submittedAt: new Date(),
        },
      });
    });

    logger.info(
      `Faculty ${facultyId} finalized proposals for pool ${poolId}`
    );

    return {
      message:
        'All proposals submitted successfully',

      similarityResults,
    };
  }

  /**
   * Faculty edits own DRAFT proposal.
   */
  async editProposal(
    projectId: string,
    facultyId: string,
    data: any
  ) {
    const project =
      await prisma.project.findUnique({
        where: {
          id: projectId,
        },
      });

    if (!project) {
      throw new NotFoundError(
        'Project not found'
      );
    }

    if (project.facultyId !== facultyId) {
      throw new ForbiddenError(
        'Not your project'
      );
    }

    if (project.status !== 'DRAFT') {
      throw new BadRequestError(
        'Can only edit DRAFT proposals'
      );
    }

    /**
     * Check similarity after editing.
     */
    const similarity =
      await this.checkProjectSimilarity(
        project.poolId,
        {
          title:
            data.title ?? project.title,

          description:
            data.description ??
            project.description,

          domain:
            data.domain ?? project.domain,
        },

        projectId
      );

    /**
     * Only update fields that belong to the project.
     *
     * This avoids accidentally trying to update
     * fields such as poolId/facultyId/status from
     * arbitrary frontend data.
     */
    const updateData: any = {
      similarityStatus:
        similarity.action,

      similarityScore:
        similarity.highestSimilarity,
    };

    if (data.title !== undefined) {
      updateData.title = data.title;
    }

    if (data.description !== undefined) {
      updateData.description =
        data.description;
    }

    if (data.domain !== undefined) {
      updateData.domain =
        data.domain;
    }

    if (data.prerequisites !== undefined) {
      updateData.prerequisites =
        data.prerequisites;
    }

    if (data.maxTeamSize !== undefined) {
      updateData.maxTeamSize =
        data.maxTeamSize;
    }

    if (data.expectedOutcome !== undefined) {
      updateData.expectedOutcome =
        data.expectedOutcome;
    }

    return prisma.project.update({
      where: {
        id: projectId,
      },

      data: updateData,
    });
  }

  /**
   * Delete a DRAFT proposal.
   */
  async deleteProposal(
    projectId: string,
    facultyId: string
  ) {
    const project =
      await prisma.project.findUnique({
        where: {
          id: projectId,
        },
      });

    if (!project) {
      throw new NotFoundError(
        'Project not found'
      );
    }

    if (project.facultyId !== facultyId) {
      throw new ForbiddenError(
        'Not your project'
      );
    }

    if (project.status !== 'DRAFT') {
      throw new BadRequestError(
        'Can only delete DRAFT proposals'
      );
    }

    await prisma.project.delete({
      where: {
        id: projectId,
      },
    });

    return {
      message: 'Proposal deleted',
    };
  }

  /**
   * SubAdmin locks a proposal.
   */
  async lockProject(
    projectId: string,
    subadminId: string,
    note?: string
  ) {
    const project =
      await prisma.project.findUnique({
        where: {
          id: projectId,
        },
      });

    if (!project) {
      throw new NotFoundError(
        'Project not found'
      );
    }

    if (project.status !== 'SUBMITTED') {
      throw new BadRequestError(
        'Only SUBMITTED projects can be locked'
      );
    }

    return prisma.project.update({
      where: {
        id: projectId,
      },

      data: {
        status: 'LOCKED',
        subadminNote: note,
        reviewedById: subadminId,
        reviewedAt: new Date(),
      },
    });
  }

  /**
   * SubAdmin holds a proposal for Admin review.
   */
  async holdProject(
    projectId: string,
    subadminId: string,
    note?: string
  ) {
    const project =
      await prisma.project.findUnique({
        where: {
          id: projectId,
        },
      });

    if (!project) {
      throw new NotFoundError(
        'Project not found'
      );
    }

    if (project.status !== 'SUBMITTED') {
      throw new BadRequestError(
        'Only SUBMITTED projects can be held'
      );
    }

    return prisma.project.update({
      where: {
        id: projectId,
      },

      data: {
        status: 'ON_HOLD',
        subadminNote: note,
        reviewedById: subadminId,
        reviewedAt: new Date(),
      },
    });
  }

  /**
   * SubAdmin reviews all proposals from one faculty.
   *
   * Required:
   * 3 LOCK
   * 1 HOLD
   */
  async reviewFacultyProposals(
    poolId: string,
    facultyId: string,
    subadminId: string,
    decisions: {
      projectId: string;
      action: 'LOCK' | 'HOLD';
      note?: string;
    }[]
  ) {
    const projects =
      await prisma.project.findMany({
        where: {
          poolId,
          facultyId,
          status: 'SUBMITTED',
        },
      });

    if (
      projects.length !==
      PROPOSALS_PER_FACULTY
    ) {
      throw new BadRequestError(
        `Faculty must have ${PROPOSALS_PER_FACULTY} submitted proposals`
      );
    }

    if (
      decisions.length !==
      PROPOSALS_PER_FACULTY
    ) {
      throw new BadRequestError(
        `Must decide on all ${PROPOSALS_PER_FACULTY} proposals`
      );
    }

    const locks =
      decisions.filter(
        (d) => d.action === 'LOCK'
      ).length;

    const holds =
      decisions.filter(
        (d) => d.action === 'HOLD'
      ).length;

    if (locks !== 3 || holds !== 1) {
      throw new BadRequestError(
        'Must lock exactly 3 and hold exactly 1'
      );
    }

    /**
     * Make sure there are no duplicate
     * project IDs in the decisions.
     */
    const uniqueDecisionIds =
      new Set(
        decisions.map(
          (d) => d.projectId
        )
      );

    if (
      uniqueDecisionIds.size !==
      decisions.length
    ) {
      throw new BadRequestError(
        'Each project must have exactly one decision'
      );
    }

    /**
     * Verify all decisions belong to
     * this faculty and pool.
     */
    const projectIds =
      new Set(
        projects.map((p) => p.id)
      );

    for (const decision of decisions) {
      if (
        !projectIds.has(
          decision.projectId
        )
      ) {
        throw new BadRequestError(
          `Project ${decision.projectId} does not belong to this faculty`
        );
      }
    }

    await prisma.$transaction(
      decisions.map((decision) =>
        prisma.project.update({
          where: {
            id: decision.projectId,
          },

          data: {
            status:
              decision.action === 'LOCK'
                ? 'LOCKED'
                : 'ON_HOLD',

            subadminNote:
              decision.note,

            reviewedById:
              subadminId,

            reviewedAt:
              new Date(),
          },
        })
      )
    );

    logger.info(
      `Subadmin ${subadminId} reviewed faculty ${facultyId} proposals in pool ${poolId}`
    );

    // Audit.
    auditService
      .log(
        subadminId,
        'REVIEW_PROPOSALS',
        'Pool',
        poolId
      )
      .catch(() => {});

    // Notify faculty.
    notificationsService
      .create(
        facultyId,
        'PROPOSAL_LOCKED',
        'Proposals Reviewed',
        'Your proposals have been reviewed by a subadmin. 3 are locked and 1 is on hold for admin review.',
        `/pools/${poolId}`
      )
      .catch(() => {});

    return {
      message: '3 locked, 1 on hold',
    };
  }

  /**
   * Admin approves an ON_HOLD project.
   *
   * Generates:
   *
   * PoolName/1
   * PoolName/2
   * PoolName/3
   */
  async approveProject(
    projectId: string,
    adminId: string,
    note?: string
  ) {
    const updated =
      await prisma.$transaction(
        async (tx) => {
          const project =
            await tx.project.findUnique({
              where: {
                id: projectId,
              },
            });

          if (!project) {
            throw new NotFoundError(
              'Project not found'
            );
          }

          if (
            project.status !==
            'ON_HOLD'
          ) {
            throw new BadRequestError(
              'Only ON_HOLD projects can be approved'
            );
          }

          const pool =
            await tx.pool.findUnique({
              where: {
                id: project.poolId,
              },

              select: {
                id: true,
                name: true,
                nextProjectNumber: true,
              },
            });

          if (!pool) {
            throw new NotFoundError(
              'Pool not found'
            );
          }

          const nextNumber =
            pool.nextProjectNumber + 1;

          const projectCode =
            `${pool.name}/${nextNumber}`;

          await tx.pool.update({
            where: {
              id: pool.id,
            },

            data: {
              nextProjectNumber:
                nextNumber,
            },
          });

          return tx.project.update({
            where: {
              id: projectId,
            },

            data: {
              projectCode,

              status: 'APPROVED',

              adminNote: note,

              decidedById:
                adminId,

              decidedAt:
                new Date(),
            },
          });
        }
      );

    // Audit.
    auditService
      .log(
        adminId,
        'APPROVE_PROJECT',
        'Project',
        projectId
      )
      .catch(() => {});

    // Notification.
    notificationsService
      .create(
        updated.facultyId,
        'PROPOSAL_APPROVED',
        'Project Approved',
        `Your project "${updated.title}" has been approved by the admin.`,
        `/pools/${updated.poolId}`
      )
      .catch(() => {});

    return updated;
  }

  /**
   * Admin rejects an ON_HOLD project.
   */
  async rejectProject(
    projectId: string,
    adminId: string,
    note?: string
  ) {
    const project =
      await prisma.project.findUnique({
        where: {
          id: projectId,
        },
      });

    if (!project) {
      throw new NotFoundError(
        'Project not found'
      );
    }

    if (
      project.status !== 'ON_HOLD'
    ) {
      throw new BadRequestError(
        'Only ON_HOLD projects can be rejected'
      );
    }

    const updated =
      await prisma.project.update({
        where: {
          id: projectId,
        },

        data: {
          status: 'REJECTED',

          adminNote: note,

          decidedById:
            adminId,

          decidedAt:
            new Date(),
        },
      });

    // Audit.
    auditService
      .log(
        adminId,
        'REJECT_PROJECT',
        'Project',
        projectId
      )
      .catch(() => {});

    // Notification.
    notificationsService
      .create(
        updated.facultyId,
        'PROPOSAL_REJECTED',
        'Project Rejected',
        `Your project "${updated.title}" has been rejected.${
          note
            ? ` Note: ${note}`
            : ''
        }`,
        `/pools/${updated.poolId}`
      )
      .catch(() => {});

    return updated;
  }

  /**
   * Admin approves every LOCKED project
   * in a pool.
   *
   * Project codes are generated sequentially.
   */
  async approveAllLocked(
    poolId: string,
    adminId: string
  ) {
    const result =
      await prisma.$transaction(
        async (tx) => {
          const pool =
            await tx.pool.findUnique({
              where: {
                id: poolId,
              },

              select: {
                id: true,
                name: true,
                nextProjectNumber: true,
              },
            });

          if (!pool) {
            throw new NotFoundError(
              'Pool not found'
            );
          }

          const projects =
            await tx.project.findMany({
              where: {
                poolId,
                status: 'LOCKED',
              },

              orderBy: {
                createdAt: 'asc',
              },

              select: {
                id: true,
              },
            });

          if (
            projects.length === 0
          ) {
            return {
              approved: 0,
            };
          }

          let nextNumber =
            pool.nextProjectNumber;

          for (
            const project of projects
          ) {
            nextNumber += 1;

            const projectCode =
              `${pool.name}/${nextNumber}`;

            await tx.project.update({
              where: {
                id: project.id,
              },

              data: {
                projectCode,

                status: 'APPROVED',

                decidedById:
                  adminId,

                decidedAt:
                  new Date(),
              },
            });
          }

          await tx.pool.update({
            where: {
              id: poolId,
            },

            data: {
              nextProjectNumber:
                nextNumber,
            },
          });

          return {
            approved:
              projects.length,
          };
        }
      );

    return result;
  }

  /**
   * Get projects by pool.
   *
   * STUDENT:
   *   APPROVED only
   *   No faculty information
   *
   * FACULTY:
   *   Own projects only
   *
   * ADMIN/SUBADMIN:
   *   All projects
   */
  async getProjectsByPool(
    poolId: string,
    userId: string,
    userRole: string
  ) {
    const pool =
      await prisma.pool.findUnique({
        where: {
          id: poolId,
        },
      });

    if (!pool) {
      throw new NotFoundError(
        'Pool not found'
      );
    }

    /**
     * STUDENT
     */
    if (userRole === 'STUDENT') {
      return prisma.project.findMany({
        where: {
          poolId,
          status: 'APPROVED',
        },

        select: {
          id: true,
          projectCode: true,
          title: true,
          description: true,
          domain: true,
          prerequisites: true,
          maxTeamSize: true,
          expectedOutcome: true,
          status: true,

          team: {
            select: {
              id: true,
              name: true,

              _count: {
                select: {
                  members: true,
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
     * FACULTY
     */
    if (userRole === 'FACULTY') {
      return prisma.project.findMany({
        where: {
          poolId,
          facultyId: userId,
        },

        include: {
          team: {
            include: {
              members: {
                where: {
                  status: 'ACTIVE',
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
     * ADMIN / SUBADMIN
     */
    return prisma.project.findMany({
      where: {
        poolId,
      },

      include: {
        faculty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },

        reviewedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },

        decidedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },

        team: {
          include: {
            _count: {
              select: {
                members: true,
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
   * Get ON_HOLD projects for Admin review.
   */
  async getHeldProjects(
    poolId: string
  ) {
    return prisma.project.findMany({
      where: {
        poolId,
        status: 'ON_HOLD',
      },

      include: {
        faculty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },

        reviewedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },

      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * Get faculty submission status
   * for SubAdmin.
   */
  async getFacultySubmissions(
    poolId: string
  ) {
    return prisma.poolFaculty.findMany({
      where: {
        poolId,
      },

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
    });
  }

  /**
   * Get a single project.
   */
  async getProjectById(
    projectId: string
  ) {
    const project =
      await prisma.project.findUnique({
        where: {
          id: projectId,
        },

        include: {
          faculty: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },

          reviewedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },

          decidedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },

          team: {
            include: {
              members: {
                where: {
                  status: 'ACTIVE',
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
                },
              },
            },
          },
        },
      });

    if (!project) {
      throw new NotFoundError(
        'Project not found'
      );
    }

    return project;
  }
}

export const projectsService =
  new ProjectsService();