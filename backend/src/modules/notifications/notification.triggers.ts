import { notificationsService } from './notifications.service';
import { sendEmail, emailTemplates } from '../../shared/utils/email';
import prisma from '../../config/database';
//import { NotificationType } from '@prisma/client';

export const notifyTeamInvite = async (
  inviteeId: string,
  teamName: string,
  inviterName: string,
  inviteeEmail: string,
) => {
  await notificationsService.create(
    inviteeId,
    'TEAM_INVITE',
    'Team Invitation',
    `You've been invited to join ${teamName} by ${inviterName}`,
    '/my-team',
  );

  const tmpl = emailTemplates.teamInvite(
    teamName,
    inviterName,
  );

  await sendEmail(
    inviteeEmail,
    tmpl.subject,
    tmpl.html,
  );
};

export const notifyProjectApproved = async (
  projectId: string,
) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { faculty: true },
  });

  if (!project) return;

  await notificationsService.create(
    project.facultyId,
    'PROPOSAL_APPROVED',
    'Project Approved',
    `"${project.title}" has been approved`,
    '/proposals',
  );

  const tmpl = emailTemplates.projectApproved(
    project.title,
  );

  await sendEmail(
    project.faculty.email,
    tmpl.subject,
    tmpl.html,
  );

  const students =
    await prisma.poolStudent.findMany({
      where: {
        poolId: project.poolId,
      },
      include: {
        student: true,
      },
    });

  const studentIds = students.map(
    (student) => student.studentId,
  );

  if (studentIds.length > 0) {
    await notificationsService.createBulk(
      studentIds,
      'PROPOSAL_APPROVED',
      'New Project Available',
      `A new project "${project.title}" is now available for selection`,
      '/projects',
    );
  }
};

export const notifyProjectRejected = async (
  projectId: string,
  reason?: string,
) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { faculty: true },
  });

  if (!project) return;

  await notificationsService.create(
    project.facultyId,
    'PROPOSAL_REJECTED',
    'Project Rejected',
    `"${project.title}" has been rejected${
      reason ? ': ' + reason : ''
    }`,
    '/proposals',
  );

  const tmpl = emailTemplates.projectRejected(
    project.title,
    reason,
  );

  await sendEmail(
    project.faculty.email,
    tmpl.subject,
    tmpl.html,
  );
};

export const notifyTeamFrozen = async (
  teamId: string,
) => {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        where: {
          status: 'ACTIVE',
        },
        include: {
          student: true,
        },
      },
      project: true,
    },
  });

  if (!team) return;

  for (const member of team.members) {
    await notificationsService.create(
      member.studentId,
      'TEAM_FROZEN',
      'Team Frozen',
      `Team "${team.name}" has been frozen. No further changes allowed.`,
      '/my-team',
    );

    const tmpl = emailTemplates.teamFrozen(
      team.name,
      team.project?.title,
    );

    await sendEmail(
      member.student.email,
      tmpl.subject,
      tmpl.html,
    );
  }
};

export const notifyIdeaApproved = async (
  ideaId: string,
) => {
  const idea = await prisma.studentIdea.findUnique({
    where: { id: ideaId },
    include: {
      student: true,
    },
  });

  if (!idea || !idea.student) return;

  await notificationsService.create(
    idea.studentId,
    'IDEA_APPROVED',
    'Idea Approved',
    `Your idea "${idea.title}" has been approved. Your selected supervisors can now respond.`,
    '/ideas',
  );

  const tmpl = emailTemplates.ideaApproved(
    idea.title,
  );

  await sendEmail(
    idea.student.email,
    tmpl.subject,
    tmpl.html,
  );
};

export const notifyIdeaRejected = async (
  ideaId: string,
  feedback?: string,
) => {
  const idea = await prisma.studentIdea.findUnique({
    where: { id: ideaId },
    include: {
      student: true,
    },
  });

  if (!idea) return;

  await notificationsService.create(
    idea.studentId,
    'IDEA_REJECTED',
    'Idea Rejected',
    `Your idea "${idea.title}" was rejected${
      feedback ? ': ' + feedback : ''
    }`,
    '/ideas',
  );
};

/**
 * Notify all users assigned to a newly created pool.
 */
export const notifyPoolCreated = async (
  poolId: string,
) => {
  const pool = await prisma.pool.findUnique({
    where: { id: poolId },
  });

  if (!pool) return;

  const [
    faculty,
    students,
    subadmins,
  ] = await Promise.all([
    prisma.poolFaculty.findMany({
      where: { poolId },
      select: {
        facultyId: true,
      },
    }),

    prisma.poolStudent.findMany({
      where: { poolId },
      select: {
        studentId: true,
      },
    }),

    prisma.poolSubadmin.findMany({
      where: { poolId },
      select: {
        subadminId: true,
      },
    }),
  ]);

  const allIds = [
    ...faculty.map(
      (facultyAssignment) =>
        facultyAssignment.facultyId,
    ),

    ...students.map(
      (studentAssignment) =>
        studentAssignment.studentId,
    ),

    ...subadmins.map(
      (subadminAssignment) =>
        subadminAssignment.subadminId,
    ),
  ];

  const uniqueIds = [
    ...new Set(allIds),
  ];

  if (uniqueIds.length === 0) {
    return;
  }

  await notificationsService.createBulk(
    uniqueIds,
    'POOL_CREATED',
    'New Allocation Pool',
    `You've been added to "${pool.name}"`,
    '/dashboard',
  );
};

export const notifySubadminAccessGranted = async (
  poolId: string,
  subadminId: string,
) => {
  const assignment =
    await prisma.poolSubadmin.findUnique({
      where: {
        poolId_subadminId: {
          poolId,
          subadminId,
        },
      },
      include: {
        pool: {
          select: {
            id: true,
            name: true,
          },
        },
        subadmin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

  if (!assignment) {
      return;
    }

  await notificationsService.create(
    assignment.subadmin.id,
    'SUBADMIN_ACCESS_GRANTED',
    'SubAdmin Access Granted',
    `You have been granted SubAdmin access to "${assignment.pool.name}".`,
    `/pools/${assignment.pool.id}`,
  );
};

export const notifySubadminAccessRevoked = async (
  poolId: string,
  subadminId: string,
  poolName: string,
) => {
  await notificationsService.create(
    subadminId,
    'SUBADMIN_ACCESS_REVOKED',
    'SubAdmin Access Revoked',
    `Your SubAdmin access to "${poolName}" has been revoked.`,
    '/dashboard',
  );
};