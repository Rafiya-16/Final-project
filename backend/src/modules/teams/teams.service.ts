import prisma from '../../config/database';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../../shared/errors/AppError';
import { TEAM_DEFAULTS } from '../../config/constants';
import { logger } from '../../shared/utils/logger';
import { notificationsService } from '../notifications/notifications.service';

export class TeamsService {
  private async getActiveTeamForStudent(
    poolId: string,
    studentId: string
  ) {
    return prisma.teamMember.findFirst({
      where: {
        team: {
          poolId,
        },
        studentId,
        status: 'ACTIVE',
      },
      include: {
        team: true,
      },
    });
  }

  private async getTeamMaxSize(teamId: string): Promise<number> {
    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
      },
      include: {
        project: {
          select: {
            maxTeamSize: true,
          },
        },
        pool: {
          select: {
            defaultMaxTeamSize: true,
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundError('Team not found');
    }

    return (
      team.project?.maxTeamSize ||
      team.pool.defaultMaxTeamSize ||
      TEAM_DEFAULTS.MAX_SIZE
    );
  }

  private async updateTeamStatus(teamId: string) {
    const [activeMemberCount, maxSize] = await Promise.all([
      prisma.teamMember.count({
        where: {
          teamId,
          status: 'ACTIVE',
        },
      }),
      this.getTeamMaxSize(teamId),
    ]);

    const status =
      activeMemberCount >= maxSize
        ? 'COMPLETE'
        : 'FORMING';

    await prisma.team.update({
      where: {
        id: teamId,
      },
      data: {
        status,
      },
    });

    return {
      activeMemberCount,
      maxSize,
      status,
    };
  }

  async createTeam(
    poolId: string,
    studentId: string,
    name: string
  ) {
    const inPool = await prisma.poolStudent.findUnique({
      where: {
        poolId_studentId: {
          poolId,
          studentId,
        },
      },
    });

    if (!inPool) {
      throw new ForbiddenError(
        'You are not assigned to this pool'
      );
    }

    const existing = await this.getActiveTeamForStudent(
      poolId,
      studentId
    );

    if (existing) {
      throw new ConflictError(
        'You are already in a team'
      );
    }

    const pool = await prisma.pool.findUnique({
      where: {
        id: poolId,
      },
    });

    if (!pool) {
      throw new NotFoundError('Pool not found');
    }

    if (
      !['SELECTION_OPEN', 'TEAMS_FORMING'].includes(
        pool.status
      )
    ) {
      throw new BadRequestError(
        'Team creation not allowed in current phase'
      );
    }

    const team = await prisma.team.create({
      data: {
        poolId,
        name,
        leaderId: studentId,
        status: 'FORMING',
        members: {
          create: {
            studentId,
            role: 'LEADER',
            status: 'ACTIVE',
          },
        },
      },
      include: {
        members: {
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
    });

    logger.info(
      `Team created: ${team.name} by ${studentId}`
    );

    return team;
  }

  async inviteMember(
    teamId: string,
    inviterId: string,
    inviteeId: string,
    message?: string
  ) {
    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
      },
      include: {
        members: {
          where: {
            status: 'ACTIVE',
          },
        },
        project: {
          select: {
            id: true,
            maxTeamSize: true,
          },
        },
        pool: {
          select: {
            defaultMaxTeamSize: true,
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundError('Team not found');
    }

    if (team.leaderId !== inviterId) {
      throw new ForbiddenError(
        'Only team leader can invite'
      );
    }

    if (team.isFrozen) {
      throw new BadRequestError(
        'Team is frozen'
      );
    }

    const maxSize =
      team.project?.maxTeamSize ||
      team.pool.defaultMaxTeamSize ||
      TEAM_DEFAULTS.MAX_SIZE;

    const pendingInviteCount =
      await prisma.teamInvite.count({
        where: {
          teamId,
          status: 'PENDING',
          expiresAt: {
            gt: new Date(),
          },
        },
      });

    const occupiedSlots =
      team.members.length + pendingInviteCount;

    if (occupiedSlots >= maxSize) {
      throw new BadRequestError(
        `Team has reached its member limit of ${maxSize}.`
      );
    }

    const inviteeTeam =
      await this.getActiveTeamForStudent(
        team.poolId,
        inviteeId
      );

    if (inviteeTeam) {
      throw new ConflictError(
        'Student is already in a team'
      );
    }

    const inPool =
      await prisma.poolStudent.findUnique({
        where: {
          poolId_studentId: {
            poolId: team.poolId,
            studentId: inviteeId,
          },
        },
      });

    if (!inPool) {
      throw new BadRequestError(
        'Student is not in this pool'
      );
    }

    const pending =
      await prisma.teamInvite.findFirst({
        where: {
          teamId,
          inviteeId,
          status: 'PENDING',
        },
      });

    if (pending) {
      throw new ConflictError(
        'Invite already pending'
      );
    }

    const expiresAt = new Date();
    expiresAt.setHours(
      expiresAt.getHours() + 48
    );

    const invite =
      await prisma.teamInvite.create({
        data: {
          teamId,
          invitedById: inviterId,
          inviteeId,
          message,
          expiresAt,
        },
        include: {
          invitee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

    notificationsService
      .create(
        inviteeId,
        'TEAM_INVITE',
        'Team Invitation',
        `You've been invited to join team "${team.name}".`,
        '/my-team'
      )
      .catch(() => {});

    return invite;
  }

  async respondToInvite(
    inviteId: string,
    studentId: string,
    accept: boolean
  ) {
    const invite =
      await prisma.teamInvite.findUnique({
        where: {
          id: inviteId,
        },
        include: {
          team: {
            include: {
              members: {
                where: {
                  status: 'ACTIVE',
                },
              },
              project: {
                select: {
                  id: true,
                  maxTeamSize: true,
                },
              },
              pool: {
                select: {
                  defaultMaxTeamSize: true,
                },
              },
            },
          },
        },
      });

    if (!invite) {
      throw new NotFoundError('Invite not found');
    }

    if (invite.inviteeId !== studentId) {
      throw new ForbiddenError(
        'Not your invite'
      );
    }

    if (invite.status !== 'PENDING') {
      throw new BadRequestError(
        'Invite already responded'
      );
    }

    if (invite.expiresAt < new Date()) {
      throw new BadRequestError(
        'Invite expired'
      );
    }

    if (accept) {
      if (invite.team.isFrozen) {
        throw new BadRequestError(
          'Team is frozen'
        );
      }

      const existing =
        await this.getActiveTeamForStudent(
          invite.team.poolId,
          studentId
        );

      if (existing) {
        throw new ConflictError(
          'You are already in a team'
        );
      }

      const maxSize =
        invite.team.project?.maxTeamSize ||
        invite.team.pool.defaultMaxTeamSize ||
        TEAM_DEFAULTS.MAX_SIZE;

      const currentActiveCount =
        await prisma.teamMember.count({
          where: {
            teamId: invite.teamId,
            status: 'ACTIVE',
          },
        });

      if (currentActiveCount >= maxSize) {
        throw new BadRequestError(
          `Team is full (maximum ${maxSize} members)`
        );
      }

      await prisma.$transaction(
        async (tx) => {
          await tx.teamInvite.update({
            where: {
              id: inviteId,
            },
            data: {
              status: 'ACCEPTED',
              respondedAt: new Date(),
            },
          });

          const existingMember =
            await tx.teamMember.findUnique({
              where: {
                teamId_studentId: {
                  teamId: invite.teamId,
                  studentId,
                },
              },
            });

          if (existingMember) {
            await tx.teamMember.update({
              where: {
                id: existingMember.id,
              },
              data: {
                status: 'ACTIVE',
                role: 'MEMBER',
                leftAt: null,
              },
            });
          } else {
            await tx.teamMember.create({
              data: {
                teamId: invite.teamId,
                studentId,
                role: 'MEMBER',
                status: 'ACTIVE',
              },
            });
          }
        }
      );

      const teamStatus =
        await this.updateTeamStatus(
          invite.teamId
        );

      const invitee =
        await prisma.user.findUnique({
          where: {
            id: studentId,
          },
          select: {
            firstName: true,
            lastName: true,
          },
        });

      notificationsService
        .create(
          invite.team.leaderId,
          'TEAM_INVITE',
          'Invite Accepted',
          `${invitee?.firstName || ''} ${
            invitee?.lastName || ''
          } accepted your team invite and joined the team.`,
          '/my-team'
        )
        .catch(() => {});

      return {
        message:
          'Invite accepted. You joined the team.',
        teamStatus: teamStatus.status,
        memberCount:
          teamStatus.activeMemberCount,
        maxTeamSize:
          teamStatus.maxSize,
      };
    }

    await prisma.teamInvite.update({
      where: {
        id: inviteId,
      },
      data: {
        status: 'DECLINED',
        respondedAt: new Date(),
      },
    });

    const invitee =
      await prisma.user.findUnique({
        where: {
          id: studentId,
        },
        select: {
          firstName: true,
          lastName: true,
        },
      });

    notificationsService
      .create(
        invite.team.leaderId,
        'TEAM_INVITE',
        'Invite Declined',
        `${invitee?.firstName || ''} ${
          invitee?.lastName || ''
        } declined your team invitation.`,
        '/my-team'
      )
      .catch(() => {});

    return {
      message: 'Invite declined.',
    };
  }

  async selectProject(
    teamId: string,
    leaderId: string,
    projectId: string
  ) {
    const team =
      await prisma.team.findUnique({
        where: {
          id: teamId,
        },
        include: {
          members: {
            where: {
              status: 'ACTIVE',
            },
          },
        },
      });

    if (!team) {
      throw new NotFoundError('Team not found');
    }

    if (team.leaderId !== leaderId) {
      throw new ForbiddenError(
        'Only leader can select project'
      );
    }

    if (team.isFrozen) {
      throw new BadRequestError(
        'Team is frozen'
      );
    }

    if (team.projectId) {
      throw new BadRequestError(
        'Team already has a project'
      );
    }

    const project =
      await prisma.project.findUnique({
        where: {
          id: projectId,
        },
        include: {
          team: true,
        },
      });

    if (!project) {
      throw new NotFoundError(
        'Project not found'
      );
    }

    if (project.poolId !== team.poolId) {
      throw new BadRequestError(
        'Project does not belong to this pool'
      );
    }

    if (project.status !== 'APPROVED') {
      throw new BadRequestError(
        'Project not approved'
      );
    }

    if (project.team) {
      throw new ConflictError(
        'Project already taken by another team'
      );
    }

    if (
      team.members.length >
      project.maxTeamSize
    ) {
      throw new BadRequestError(
        `This project allows a maximum of ${project.maxTeamSize} members, but your team already has ${team.members.length} members.`
      );
    }

    return prisma.$transaction(
      async (tx) => {
        const doubleCheck =
          await tx.project.findUnique({
            where: {
              id: projectId,
            },
            include: {
              team: true,
            },
          });

        if (doubleCheck?.team) {
          throw new ConflictError(
            'Project was just taken'
          );
        }

        return tx.team.update({
          where: {
            id: teamId,
          },
          data: {
            projectId,
            status:
              team.members.length >=
              project.maxTeamSize
                ? 'COMPLETE'
                : 'FORMING',
          },
          include: {
            project: {
              select: {
                id: true,
                title: true,
                domain: true,
                maxTeamSize: true,
              },
            },
          },
        });
      }
    );
  }

  async leaveTeam(
    teamId: string,
    studentId: string
  ) {
    const member =
      await prisma.teamMember.findUnique({
        where: {
          teamId_studentId: {
            teamId,
            studentId,
          },
        },
      });

    if (!member) {
      throw new NotFoundError(
        'Not a team member'
      );
    }

    if (member.status !== 'ACTIVE') {
      throw new BadRequestError(
        'Not active in team'
      );
    }

    const team =
      await prisma.team.findUnique({
        where: {
          id: teamId,
        },
      });

    if (!team) {
      throw new NotFoundError('Team not found');
    }

    if (team.isFrozen) {
      throw new BadRequestError(
        'Team is frozen'
      );
    }

    if (team.leaderId === studentId) {
      throw new BadRequestError(
        'Leader cannot leave. Transfer leadership first or dissolve team.'
      );
    }

    await prisma.teamMember.update({
      where: {
        id: member.id,
      },
      data: {
        status: 'LEFT',
        leftAt: new Date(),
      },
    });

    await this.updateTeamStatus(teamId);

    return {
      message: 'Left team',
    };
  }

  async removeMember(
    teamId: string,
    leaderId: string,
    memberId: string
  ) {
    const team =
      await prisma.team.findUnique({
        where: {
          id: teamId,
        },
      });

    if (!team) {
      throw new NotFoundError('Team not found');
    }

    if (team.leaderId !== leaderId) {
      throw new ForbiddenError(
        'Only leader can remove members'
      );
    }

    if (team.isFrozen) {
      throw new BadRequestError(
        'Team is frozen'
      );
    }

    if (memberId === leaderId) {
      throw new BadRequestError(
        'Cannot remove yourself'
      );
    }

    const member =
      await prisma.teamMember.findUnique({
        where: {
          teamId_studentId: {
            teamId,
            studentId: memberId,
          },
        },
      });

    if (
      !member ||
      member.status !== 'ACTIVE'
    ) {
      throw new NotFoundError(
        'Active member not found'
      );
    }

    await prisma.teamMember.update({
      where: {
        id: member.id,
      },
      data: {
        status: 'REMOVED',
        leftAt: new Date(),
      },
    });

    await this.updateTeamStatus(teamId);

    return {
      message: 'Member removed',
    };
  }

  async dissolveTeam(
    teamId: string,
    leaderId: string
  ) {
    const team =
      await prisma.team.findUnique({
        where: {
          id: teamId,
        },
      });

    if (!team) {
      throw new NotFoundError('Team not found');
    }

    if (team.leaderId !== leaderId) {
      throw new ForbiddenError(
        'Only leader can dissolve'
      );
    }

    if (team.isFrozen) {
      throw new BadRequestError(
        'Team is frozen'
      );
    }

    await prisma.$transaction([
      prisma.teamMember.updateMany({
        where: {
          teamId,
          status: 'ACTIVE',
        },
        data: {
          status: 'LEFT',
          leftAt: new Date(),
        },
      }),
      prisma.teamInvite.updateMany({
        where: {
          teamId,
          status: 'PENDING',
        },
        data: {
          status: 'EXPIRED',
        },
      }),
      prisma.team.update({
        where: {
          id: teamId,
        },
        data: {
          status: 'DISSOLVED',
          projectId: null,
        },
      }),
    ]);

    return {
      message: 'Team dissolved',
    };
  }

  async getTeamsByPool(poolId: string) {
    return prisma.team.findMany({
      where: {
        poolId,
        status: {
          not: 'DISSOLVED',
        },
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            domain: true,
            maxTeamSize: true,
            faculty: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
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
        leader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async getMyTeam(
    poolId: string,
    studentId: string
  ) {
    const membership =
      await this.getActiveTeamForStudent(
        poolId,
        studentId
      );

    if (!membership) {
      return null;
    }

    const allMembersInPool =
      await prisma.teamMember.findMany({
        where: {
          team: {
            poolId,
          },
          status: 'ACTIVE',
        },
        select: {
          studentId: true,
          teamId: true,
        },
      });

    const team =
      await prisma.team.findUnique({
        where: {
          id: membership.teamId,
        },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              description: true,
              domain: true,
              prerequisites: true,
              maxTeamSize: true,
            },
          },
          pool: {
            select: {
              id: true,
              minTeamSize: true,
              defaultMaxTeamSize: true,
            },
          },
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
          invites: {
            where: {
              status: 'PENDING',
              expiresAt: {
                gt: new Date(),
              },
            },
            include: {
              invitee: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          leader: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

    if (!team) {
      return null;
    }

    const maxTeamSize =
      team.project?.maxTeamSize ||
      team.pool.defaultMaxTeamSize ||
      TEAM_DEFAULTS.MAX_SIZE;

    return {
      ...team,
      maxTeamSize,
      allMembersInPool,
    };
  }

  async getMyInvites(
    poolId: string,
    studentId: string
  ) {
    return prisma.teamInvite.findMany({
      where: {
        inviteeId: studentId,
        status: 'PENDING',
        expiresAt: {
          gt: new Date(),
        },
        team: {
          poolId,
        },
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            project: {
              select: {
                id: true,
                title: true,
                maxTeamSize: true,
              },
            },
            leader: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        invitedBy: {
          select: {
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
}

export const teamsService = new TeamsService();