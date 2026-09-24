import nodemailer from 'nodemailer';
import { config } from '../../config';
import { logger } from './logger';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  if (!config.email.user || !config.email.pass) {
    logger.warn(`Email not configured. Skipping: ${subject} → ${to}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: config.email.from,
      to,
      subject,
      html,
    });
    logger.info(`Email sent: ${subject} → ${to}`);
  } catch (error: any) {
    logger.error(`Email failed: ${error.message}`, { to, subject });
  }
};

export const emailTemplates = {
  teamInvite: (teamName: string, inviterName: string) => ({
    subject: `Team Invite: ${teamName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Team Invitation</h2>
        <p>You've been invited to join <strong>${teamName}</strong> by ${inviterName}.</p>
        <p>Log in to the Project Allocation platform to accept or decline.</p>
        <a href="${config.cors.origin}/my-team" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; margin-top: 10px;">View Invite</a>
      </div>
    `,
  }),

  projectApproved: (projectTitle: string) => ({
    subject: `Project Approved: ${projectTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #16a34a;">✅ Project Approved</h2>
        <p>Your project proposal <strong>"${projectTitle}"</strong> has been approved.</p>
        <p>Students can now select this project.</p>
      </div>
    `,
  }),

  projectRejected: (projectTitle: string, reason?: string) => ({
    subject: `Project Rejected: ${projectTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #dc2626;">❌ Project Rejected</h2>
        <p>Your project proposal <strong>"${projectTitle}"</strong> has been rejected.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      </div>
    `,
  }),

  teamFrozen: (teamName: string, projectTitle?: string) => ({
    subject: `Team Frozen: ${teamName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #0891b2;">🧊 Team Frozen</h2>
        <p>Your team <strong>${teamName}</strong> has been frozen.</p>
        ${projectTitle ? `<p>Assigned project: <strong>${projectTitle}</strong></p>` : ''}
        <p>No further changes can be made.</p>
      </div>
    `,
  }),

 ideaApproved: (ideaTitle: string) => ({
  subject: `Idea Approved: ${ideaTitle}`,
  html: `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #16a34a;">💡 Idea Approved</h2>
      <p>Your project idea <strong>"${ideaTitle}"</strong> has been approved.</p>
      <p>Your selected supervisors have received supervision requests and can now respond.</p>
    </div>
  `,
}),

  credentials: (name: string, email: string, tempPassword: string) => ({
    subject: 'Your Project Allocation Account',
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Welcome to ProjectAlloc</h2>
        <p>Hi ${name},</p>
        <p>Your account has been created. Here are your credentials:</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> ${tempPassword}</p>
        </div>
        <p>Please change your password after first login.</p>
        <a href="${config.cors.origin}/login" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px;">Login Now</a>
      </div>
    `,
  }),
};