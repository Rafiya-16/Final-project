import prisma from '../../config/database';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../shared/errors/AppError';
import { PROPOSALS_PER_FACULTY } from '../../config/constants';
import { logger } from '../../shared/utils/logger';
import { auditService } from '../audit/audit.service';
import { notificationsService } from '../notifications/notifications.service';
import { notifyProjectApproved, notifyProjectRejected } from '../notifications/notification.triggers';

export class ProjectsService {

  // Faculty submits a project proposal
  async submitProposal(poolId: string, facultyId: string, data: any) {
    // Verify faculty is assigned to pool
    const assignment = await prisma.poolFaculty.findUnique({ where: { poolId_facultyId: { poolId, facultyId } } });
    if (!assignment) throw new ForbiddenError('You are not assigned to this pool');
    if (assignment.hasSubmitted) throw new BadRequestError('You have already submitted your proposals');

    // Check count
    const count = await prisma.project.count({ where: { poolId, facultyId } });
    if (count >= PROPOSALS_PER_FACULTY) throw new BadRequestError(`Maximum ${PROPOSALS_PER_FACULTY} proposals allowed`);

    const pool = await prisma.pool.findUnique({ where: { id: poolId } });
    if (!pool || pool.status !== 'SUBMISSION_OPEN') throw new BadRequestError('Submissions are not open');

    return prisma.project.create({
      data: { poolId, facultyId, title: data.title, description: data.description, domain: data.domain, prerequisites: data.prerequisites, maxTeamSize: data.maxTeamSize || pool.defaultMaxTeamSize, expectedOutcome: data.expectedOutcome, status: 'DRAFT' },
    });
  }

  // Faculty finalizes all 4 proposals
  async finalizeSubmission(poolId: string, facultyId: string) {
    const projects = await prisma.project.findMany({ where: { poolId, facultyId } });
    if (projects.length !== PROPOSALS_PER_FACULTY) throw new BadRequestError(`You must have exactly ${PROPOSALS_PER_FACULTY} proposals. Current: ${projects.length}`);

    await prisma.$transaction([
      prisma.project.updateMany({ where: { poolId, facultyId }, data: { status: 'SUBMITTED' } }),
      prisma.poolFaculty.update({ where: { poolId_facultyId: { poolId, facultyId } }, data: { hasSubmitted: true, submittedAt: new Date() } }),
    ]);

    logger.info(`Faculty ${facultyId} finalized proposals for pool ${poolId}`);
    return { message: 'All proposals submitted successfully' };
  }

  // Faculty edits own draft proposal
  async editProposal(projectId: string, facultyId: string, data: any) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundError('Project not found');
    if (project.facultyId !== facultyId) throw new ForbiddenError('Not your project');
    if (project.status !== 'DRAFT') throw new BadRequestError('Can only edit DRAFT proposals');

    return prisma.project.update({ where: { id: projectId }, data });
  }

  // Delete draft proposal
  async deleteProposal(projectId: string, facultyId: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundError('Project not found');
    if (project.facultyId !== facultyId) throw new ForbiddenError('Not your project');
    if (project.status !== 'DRAFT') throw new BadRequestError('Can only delete DRAFT proposals');

    await prisma.project.delete({ where: { id: projectId } });
    return { message: 'Proposal deleted' };
  }

  // Subadmin locks a proposal (3 out of 4)
  async lockProject(projectId: string, subadminId: string, note?: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundError('Project not found');
    if (project.status !== 'SUBMITTED') throw new BadRequestError('Only SUBMITTED projects can be locked');

    return prisma.project.update({
      where: { id: projectId },
      data: { status: 'LOCKED', subadminNote: note, reviewedById: subadminId, reviewedAt: new Date() },
    });
  }

  // Subadmin holds a proposal (1 out of 4) — escalates to admin
  async holdProject(projectId: string, subadminId: string, note?: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundError('Project not found');
    if (project.status !== 'SUBMITTED') throw new BadRequestError('Only SUBMITTED projects can be held');

    return prisma.project.update({
      where: { id: projectId },
      data: { status: 'ON_HOLD', subadminNote: note, reviewedById: subadminId, reviewedAt: new Date() },
    });
  }

  // Subadmin reviews faculty's 4 proposals: lock 3, hold 1
  async reviewFacultyProposals(poolId: string, facultyId: string, subadminId: string, decisions: { projectId: string; action: 'LOCK' | 'HOLD'; note?: string }[]) {
    const projects = await prisma.project.findMany({ where: { poolId, facultyId, status: 'SUBMITTED' } });
    if (projects.length !== PROPOSALS_PER_FACULTY) throw new BadRequestError(`Faculty must have ${PROPOSALS_PER_FACULTY} submitted proposals`);
    if (decisions.length !== PROPOSALS_PER_FACULTY) throw new BadRequestError(`Must decide on all ${PROPOSALS_PER_FACULTY} proposals`);

    const locks = decisions.filter(d => d.action === 'LOCK').length;
    const holds = decisions.filter(d => d.action === 'HOLD').length;
    if (locks !== 3 || holds !== 1) throw new BadRequestError('Must lock exactly 3 and hold exactly 1');

    // Verify all decisions reference this faculty's projects
    const projectIds = new Set(projects.map(p => p.id));
    for (const d of decisions) {
      if (!projectIds.has(d.projectId)) throw new BadRequestError(`Project ${d.projectId} does not belong to this faculty`);
    }

    await prisma.$transaction(
      decisions.map(d =>
        prisma.project.update({
          where: { id: d.projectId },
          data: {
            status: d.action === 'LOCK' ? 'LOCKED' : 'ON_HOLD',
            subadminNote: d.note,
            reviewedById: subadminId,
            reviewedAt: new Date(),
          },
        })
      )
    );

    logger.info(`Subadmin ${subadminId} reviewed faculty ${facultyId} proposals in pool ${poolId}`);

    // Audit: review
    auditService.log(subadminId, 'REVIEW_PROPOSALS', 'Pool', poolId).catch(() => {});

    // Notify faculty their proposals have been reviewed
    notificationsService.create(
      facultyId, 'PROPOSAL_LOCKED', 'Proposals Reviewed',
      'Your proposals have been reviewed by a subadmin. 3 are locked and 1 is on hold for admin review.',
      `/pools/${poolId}`
    ).catch(() => {});

    return { message: '3 locked, 1 on hold' };
  }

 // Admin approves held project
async approveProject(projectId: string, adminId: string, note?: string) {
  const updated = await prisma.$transaction(async (tx) => {
    const project = await tx.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    if (project.status !== 'ON_HOLD') {
      throw new BadRequestError(
        'Only ON_HOLD projects can be approved'
      );
    }

    // Get current pool counter
    const pool = await tx.pool.findUnique({
      where: { id: project.poolId },
      select: {
        id: true,
        name: true,
        nextProjectNumber: true,
      },
    });

    if (!pool) {
      throw new NotFoundError('Pool not found');
    }

    const nextNumber = pool.nextProjectNumber + 1;

    // Generate project code
    const projectCode = `${pool.name}/${nextNumber}`;

    // Update counter
    await tx.pool.update({
      where: { id: pool.id },
      data: {
        nextProjectNumber: nextNumber,
      },
    });

    // Approve project + save project code
    return tx.project.update({
      where: { id: projectId },
      data: {
        projectCode,
        status: 'APPROVED',
        adminNote: note,
        decidedById: adminId,
        decidedAt: new Date(),
      },
    });
  });

  // Audit
  auditService
    .log(adminId, 'APPROVE_PROJECT', 'Project', projectId)
    .catch(() => {});

  // Notification
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

  // Admin rejects held project
  async rejectProject(projectId: string, adminId: string, note?: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundError('Project not found');
    if (project.status !== 'ON_HOLD') throw new BadRequestError('Only ON_HOLD projects can be rejected');

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: { status: 'REJECTED', adminNote: note, decidedById: adminId, decidedAt: new Date() },
    });

    // Audit + Notify
    auditService.log(adminId, 'REJECT_PROJECT', 'Project', projectId).catch(() => {});
    notificationsService.create(
      updated.facultyId, 'PROPOSAL_REJECTED', 'Project Rejected',
      `Your project "${updated.title}" has been rejected.${note ? ' Note: ' + note : ''}`,
      `/pools/${updated.poolId}`
    ).catch(() => {});

    return updated;
  }

 // Admin approves all locked projects
async approveAllLocked(poolId: string, adminId: string) {
  const result = await prisma.$transaction(async (tx) => {
    const pool = await tx.pool.findUnique({
      where: { id: poolId },
      select: {
        id: true,
        name: true,
        nextProjectNumber: true,
      },
    });

    if (!pool) {
      throw new NotFoundError('Pool not found');
    }

    const projects = await tx.project.findMany({
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

    if (projects.length === 0) {
      return {
        approved: 0,
      };
    }

    let nextNumber = pool.nextProjectNumber;

    for (const project of projects) {
      nextNumber += 1;

      const projectCode = `${pool.name}/${nextNumber}`;

      await tx.project.update({
        where: {
          id: project.id,
        },
        data: {
          projectCode,
          status: 'APPROVED',
          decidedById: adminId,
          decidedAt: new Date(),
        },
      });
    }

    await tx.pool.update({
      where: {
        id: poolId,
      },
      data: {
        nextProjectNumber: nextNumber,
      },
    });

    return {
      approved: projects.length,
    };
  });

  return result;
}

  // Get projects by pool — role-aware
  async getProjectsByPool(poolId: string, userId: string, userRole: string) {
    const pool = await prisma.pool.findUnique({ where: { id: poolId } });
    if (!pool) throw new NotFoundError('Pool not found');

    if (userRole === 'STUDENT') {
      // Students see only APPROVED, NO faculty names
      return prisma.project.findMany({
        where: { poolId, status: 'APPROVED' },
        select: {
          id: true, projectCode: true, title: true, description: true, domain: true,
          prerequisites: true, maxTeamSize: true, expectedOutcome: true,
          status: true,
          team: { select: { id: true, name: true, _count: { select: { members: true } } } },
        },
      });
    }

    if (userRole === 'FACULTY') {
      // Faculty sees only their own projects
      return prisma.project.findMany({
        where: { poolId, facultyId: userId },
        include: { team: { include: { members: { where: { status: 'ACTIVE' }, include: { student: { select: { id: true, firstName: true, lastName: true, email: true, enrollmentNo: true } } } } } } },
      });
    }

    // Admin/Subadmin see all
    return prisma.project.findMany({
      where: { poolId },
      include: {
        faculty: { select: { id: true, firstName: true, lastName: true, email: true } },
        reviewedBy: { select: { id: true, firstName: true, lastName: true } },
        decidedBy: { select: { id: true, firstName: true, lastName: true } },
        team: { include: { _count: { select: { members: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Get held projects (for admin review)
  async getHeldProjects(poolId: string) {
    return prisma.project.findMany({
      where: { poolId, status: 'ON_HOLD' },
      include: {
        faculty: { select: { id: true, firstName: true, lastName: true, email: true } },
        reviewedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  // Get faculty submission status for subadmin
  async getFacultySubmissions(poolId: string) {
    return prisma.poolFaculty.findMany({
      where: { poolId },
      include: {
        faculty: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  async getProjectById(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        faculty: { select: { id: true, firstName: true, lastName: true } },
        reviewedBy: { select: { id: true, firstName: true, lastName: true } },
        decidedBy: { select: { id: true, firstName: true, lastName: true } },
        team: { include: { members: { where: { status: 'ACTIVE' }, include: { student: { select: { id: true, firstName: true, lastName: true, email: true, enrollmentNo: true } } } } } },
      },
    });
    if (!project) throw new NotFoundError('Project not found');
    return project;
  }
}

export const projectsService = new ProjectsService();