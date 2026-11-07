import prisma from '../../config/database';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors/AppError';
import { notificationsService } from '../notifications/notifications.service';

type TeamChange = { actorId: string; poolId: string; teamId: string; studentId: string; reason: string; newLeaderId?: string };

const studentSelect = { id: true, firstName: true, lastName: true, email: true, enrollmentNo: true, section: true, semester: true } as const;

export class AdminTeamManagementService {
  private validateReason(reason: string) {
    const value = typeof reason === 'string' ? reason.trim() : '';
    if (value.length < 10) throw new BadRequestError('Please provide a reason of at least 10 characters for this administrative change.');
    if (value.length > 1000) throw new BadRequestError('Reason cannot exceed 1000 characters.');
    return value;
  }

  private async getPool(poolId: string) {
    const pool = await prisma.pool.findUnique({ where: { id: poolId }, select: { id: true, academicYear: true, status: true, teamFreezeDate: true, defaultMaxTeamSize: true, minTeamSize: true } });
    if (!pool) throw new NotFoundError('Pool not found');
    return pool;
  }

  private async assertStudentsInPool(poolId: string, studentIds: string[]) {
    const uniqueIds = [...new Set(studentIds)];
    if (!uniqueIds.length || uniqueIds.length !== studentIds.length) throw new BadRequestError('Select at least one student and do not select a student more than once.');
    const students = await prisma.poolStudent.findMany({
      where: { poolId, studentId: { in: uniqueIds }, student: { role: 'STUDENT', isActive: true } },
      select: { studentId: true },
    });
    if (students.length !== uniqueIds.length) throw new ForbiddenError('Every selected student must be an active student assigned to this pool.');
    return uniqueIds;
  }

  private async activeMembershipsInAcademicYear(tx: any, pool: { academicYear: string }, studentIds: string[]) {
    return tx.teamMember.findMany({
      where: { studentId: { in: studentIds }, status: 'ACTIVE', team: { status: { not: 'DISSOLVED' }, pool: { academicYear: pool.academicYear } } },
      include: { team: { select: { id: true, poolId: true, name: true, projectId: true } } },
    });
  }

  async getManagementData(poolId: string) {
    await this.getPool(poolId);
    const [teams, students] = await Promise.all([
      prisma.team.findMany({
        where: { poolId, status: { not: 'DISSOLVED' } },
        include: {
          project: { select: { id: true, title: true, projectCode: true, maxTeamSize: true } },
          leader: { select: studentSelect },
          members: { where: { status: 'ACTIVE' }, include: { student: { select: studentSelect } }, orderBy: { joinedAt: 'asc' } },
          _count: { select: { members: { where: { status: 'ACTIVE' } } } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.poolStudent.findMany({
        where: { poolId, student: { role: 'STUDENT', isActive: true } },
        include: { student: { select: studentSelect } },
        orderBy: [{ student: { section: 'asc' } }, { student: { enrollmentNo: 'asc' } }],
      }),
    ]);
    return { teams, students: students.map((row) => row.student) };
  }

  async createTeam(poolId: string, actorId: string, input: { name: string; studentIds: string[]; leaderId: string; reason: string }) {
    const pool = await this.getPool(poolId);
    const reason = this.validateReason(input.reason);
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    if (!name || name.length > 100) throw new BadRequestError('Team name is required and must be at most 100 characters.');
    const studentIds = await this.assertStudentsInPool(poolId, input.studentIds || []);
    if (!studentIds.includes(input.leaderId)) throw new BadRequestError('The team leader must be one of the selected team members.');
    const maxSize = pool.defaultMaxTeamSize;
    if (studentIds.length > maxSize) throw new BadRequestError(`Team cannot exceed the configured maximum of ${maxSize} students.`);

    const created = await prisma.$transaction(async (tx) => {
      const existing = await this.activeMembershipsInAcademicYear(tx, pool, studentIds);
      if (existing.length) {
        const conflict = existing[0];
        throw new ConflictError(`${conflict.studentId} already has an active team in this academic year. Transfer the student through the team transfer action instead.`);
      }
      const frozen = pool.status === 'FROZEN' || pool.status === 'ARCHIVED' || new Date() >= pool.teamFreezeDate;
      const team = await tx.team.create({
        data: {
          poolId, name, leaderId: input.leaderId,
          status: frozen ? 'FROZEN' : (studentIds.length >= maxSize ? 'COMPLETE' : 'FORMING'),
          isFrozen: frozen,
          members: { create: studentIds.map((studentId) => ({ studentId, role: studentId === input.leaderId ? 'LEADER' : 'MEMBER', status: 'ACTIVE' })) },
        },
        include: { members: { where: { status: 'ACTIVE' }, include: { student: { select: studentSelect } } }, leader: { select: studentSelect } },
      });
      await tx.auditLog.create({ data: { userId: actorId, action: 'ADMIN_TEAM_CREATED', entityType: 'TEAM', entityId: team.id, newValue: { poolId, name, studentIds, leaderId: input.leaderId, reason } } });
      return team;
    });
    await notificationsService.createBulk(studentIds, 'GENERAL', 'Team assignment updated', `You have been added to team "${name}" by a Subadmin. Reason: ${reason}`, '/my-team').catch(() => {});
    return created;
  }

  async addOrTransferMember(input: TeamChange) {
    const pool = await this.getPool(input.poolId);
    const reason = this.validateReason(input.reason);
    await this.assertStudentsInPool(input.poolId, [input.studentId]);
    const result = await prisma.$transaction(async (tx) => {
      const target = await tx.team.findFirst({ where: { id: input.teamId, poolId: input.poolId, status: { not: 'DISSOLVED' } }, include: { project: { select: { maxTeamSize: true } } } });
      if (!target) throw new NotFoundError('Target team not found in this pool.');
      const maxSize = target.project?.maxTeamSize || pool.defaultMaxTeamSize;
      const targetCount = await tx.teamMember.count({ where: { teamId: target.id, status: 'ACTIVE' } });
      const existing = await this.activeMembershipsInAcademicYear(tx, pool, [input.studentId]);
      const current = existing[0];
      if (current?.team.id === target.id) throw new ConflictError('Student is already an active member of this team.');
      if (targetCount >= maxSize) throw new BadRequestError(`The selected team has reached its maximum size of ${maxSize}.`);
      if (current && current.team.poolId !== input.poolId) throw new ForbiddenError('Cross-pool transfers are not permitted through team management. Use the authorized academic reassignment process.');
      if (current?.team.projectId) throw new ForbiddenError('This student belongs to a team that has already acquired a project. Project-linked transfers require the authorized academic reassignment process.');
      if (current) {
        await tx.teamMember.update({ where: { teamId_studentId: { teamId: current.team.id, studentId: input.studentId } }, data: { status: 'REMOVED', leftAt: new Date() } });
        if (current.teamId === input.teamId) throw new ConflictError('Student is already in this team.');
        if (current.teamId) {
          await tx.teamMember.updateMany({ where: { teamId: current.team.id, studentId: input.studentId, status: 'ACTIVE' }, data: { status: 'REMOVED', leftAt: new Date() } });
        }
      }
      const prior = await tx.teamMember.findUnique({ where: { teamId_studentId: { teamId: target.id, studentId: input.studentId } } });
      if (prior) await tx.teamMember.update({ where: { id: prior.id }, data: { status: 'ACTIVE', role: 'MEMBER', joinedAt: new Date(), leftAt: null } });
      else await tx.teamMember.create({ data: { teamId: target.id, studentId: input.studentId, role: 'MEMBER', status: 'ACTIVE' } });
      await tx.auditLog.create({ data: { userId: input.actorId, action: current ? 'ADMIN_TEAM_MEMBER_TRANSFERRED' : 'ADMIN_TEAM_MEMBER_ADDED', entityType: 'TEAM', entityId: target.id, oldValue: current ? { teamId: current.team.id, teamName: current.team.name } : undefined, newValue: { poolId: input.poolId, studentId: input.studentId, reason } } });
      return { targetTeamId: target.id, oldTeamId: current?.team.id || null };
    });
    await notificationsService.create(input.studentId, 'GENERAL', 'Team membership changed', `Your team membership has been updated by a Subadmin. Reason: ${reason}`, '/my-team').catch(() => {});
    return result;
  }

  async removeMember(input: TeamChange) {
    const reason = this.validateReason(input.reason);
    const result = await prisma.$transaction(async (tx) => {
      const team = await tx.team.findFirst({ where: { id: input.teamId, poolId: input.poolId, status: { not: 'DISSOLVED' } } });
      if (!team) throw new NotFoundError('Team not found in this pool.');
      const member = await tx.teamMember.findUnique({ where: { teamId_studentId: { teamId: team.id, studentId: input.studentId } }, include: { student: { select: studentSelect } } });
      if (!member || member.status !== 'ACTIVE') throw new NotFoundError('Active team membership not found.');
      if (team.leaderId === input.studentId) throw new BadRequestError('Assign another team leader before removing the current leader.');
      await tx.teamMember.update({ where: { id: member.id }, data: { status: 'REMOVED', leftAt: new Date() } });
      await tx.auditLog.create({ data: { userId: input.actorId, action: 'ADMIN_TEAM_MEMBER_REMOVED', entityType: 'TEAM', entityId: team.id, oldValue: { studentId: input.studentId }, newValue: { reason } } });
      return { teamId: team.id, student: member.student };
    });
    await notificationsService.create(input.studentId, 'TEAM_REMOVED', 'Removed from team', `You have been removed from your team by a Subadmin. Reason: ${reason}`, '/my-team').catch(() => {});
    return result;
  }

  async setLeader(poolId: string, teamId: string, actorId: string, leaderId: string, reason: string) {
    const note = this.validateReason(reason);
    const result = await prisma.$transaction(async (tx) => {
      const team = await tx.team.findFirst({ where: { id: teamId, poolId, status: { not: 'DISSOLVED' } } });
      if (!team) throw new NotFoundError('Team not found in this pool.');
      const nextLeader = await tx.teamMember.findUnique({ where: { teamId_studentId: { teamId, studentId: leaderId } } });
      if (!nextLeader || nextLeader.status !== 'ACTIVE') throw new BadRequestError('The new leader must be an active member of this team.');
      const previousLeaderId = team.leaderId;
      await tx.teamMember.updateMany({ where: { teamId, role: 'LEADER', status: 'ACTIVE' }, data: { role: 'MEMBER' } });
      await tx.teamMember.update({ where: { id: nextLeader.id }, data: { role: 'LEADER' } });
      await tx.team.update({ where: { id: teamId }, data: { leaderId } });
      await tx.auditLog.create({ data: { userId: actorId, action: 'ADMIN_TEAM_LEADER_CHANGED', entityType: 'TEAM', entityId: teamId, oldValue: { leaderId: previousLeaderId }, newValue: { leaderId, reason: note } } });
      return { teamId, previousLeaderId, leaderId };
    });
    await notificationsService.create(leaderId, 'GENERAL', 'Team leadership assigned', 'You have been assigned as the team leader by a Subadmin.', '/my-team').catch(() => {});
    return result;
  }
}

export const adminTeamManagementService = new AdminTeamManagementService();
