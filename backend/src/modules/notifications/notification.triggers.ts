import { notificationsService } from './notifications.service';
import { sendEmail, emailTemplates } from '../../shared/utils/email';
import prisma from '../../config/database';
import { NotificationType } from '@prisma/client';
import { EMAIL_TRIGGER_EVENTS } from '../../config/constants';

export const notifyTeamInvite = async (inviteeId: string, teamName: string, inviterName: string, inviteeEmail: string) => {
  await notificationsService.create(inviteeId, 'TEAM_INVITE', 'Team Invitation', `You've been invited to join ${teamName} by ${inviterName}`, '/my-team');
  const tmpl = emailTemplates.teamInvite(teamName, inviterName);
  await sendEmail(inviteeEmail, tmpl.subject, tmpl.html);
};

export const notifyProjectApproved = async (projectId: string) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { faculty: true },
  });
  if (!project) return;

  await notificationsService.create(project.facultyId, 'PROPOSAL_APPROVED', 'Project Approved', `"${project.title}" has been approved`, '/proposals');
  const tmpl = emailTemplates.projectApproved(project.title);
  await sendEmail(project.faculty.email, tmpl.subject, tmpl.html);

  // Notify all students in pool
  const students = await prisma.poolStudent.findMany({ where: { poolId: project.poolId }, include: { student: true } });
  const studentIds = students.map(s => s.studentId);
  await notificationsService.createBulk(studentIds, 'PROPOSAL_APPROVED', 'New Project Available', `A new project "${project.title}" is now available for selection`, '/projects');
};

export const notifyProjectRejected = async (projectId: string, reason?: string) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { faculty: true },
  });
  if (!project) return;

  await notificationsService.create(project.facultyId, 'PROPOSAL_REJECTED', 'Project Rejected', `"${project.title}" has been rejected${reason ? ': ' + reason : ''}`, '/proposals');
  const tmpl = emailTemplates.projectRejected(project.title, reason);
  await sendEmail(project.faculty.email, tmpl.subject, tmpl.html);
};

export const notifyTeamFrozen = async (teamId: string) => {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: { where: { status: 'ACTIVE' }, include: { student: true } }, project: true },
  });
  if (!team) return;

  for (const m of team.members) {
    await notificationsService.create(m.studentId, 'TEAM_FROZEN', 'Team Frozen', `Team "${team.name}" has been frozen. No further changes allowed.`, '/my-team');
    const tmpl = emailTemplates.teamFrozen(team.name, team.project?.title);
    await sendEmail(m.student.email, tmpl.subject, tmpl.html);
  }
};

export const notifyIdeaApproved = async (ideaId: string) => {
  const idea = await prisma.studentIdea.findUnique({
    where: { id: ideaId },
    include: { student: true },
  });

  if (!idea || !idea.student) return;

  await notificationsService.create(
    idea.studentId,
    'IDEA_APPROVED',
    'Idea Approved',
    `Your idea "${idea.title}" has been approved. Your selected supervisors can now respond.`,
    '/ideas'
  );

  const tmpl = emailTemplates.ideaApproved(idea.title);

  await sendEmail(
    idea.student.email,
    tmpl.subject,
    tmpl.html
  );
};

export const notifyIdeaRejected = async (ideaId: string, feedback?: string) => {
  const idea = await prisma.studentIdea.findUnique({ where: { id: ideaId }, include: { student: true } });
  if (!idea) return;

  await notificationsService.create(idea.studentId, 'IDEA_REJECTED', 'Idea Rejected', `Your idea "${idea.title}" was rejected${feedback ? ': ' + feedback : ''}`, '/ideas');
};

export const notifyPoolCreated = async (poolId: string) => {
  const pool = await prisma.pool.findUnique({ where: { id: poolId } });
  if (!pool) return;

  const [faculty, students, subadmins] = await Promise.all([
    prisma.poolFaculty.findMany({ where: { poolId }, select: { facultyId: true } }),
    prisma.poolStudent.findMany({ where: { poolId }, select: { studentId: true } }),
    prisma.poolSubadmin.findMany({ where: { poolId }, select: { subadminId: true } }),
  ]);

  const allIds = [...faculty.map(f => f.facultyId), ...students.map(s => s.studentId), ...subadmins.map(s => s.subadminId)];
  await notificationsService.createBulk(allIds, 'POOL_CREATED', 'New Allocation Pool', `You've been added to "${pool.name}"`, '/dashboard');
};