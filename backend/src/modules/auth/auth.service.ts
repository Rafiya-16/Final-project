import prisma from '../../config/database';
import { hashPassword, comparePassword } from '../../shared/utils/hash';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, TokenPayload } from '../../shared/utils/token';
import { UnauthorizedError, BadRequestError } from '../../shared/errors/AppError';
import { auditService } from '../audit/audit.service';
import { notificationsService } from '../notifications/notifications.service';

export class AuthService {
async login(identifier: string, password: string) {
  const normalizedIdentifier = identifier.trim();

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: normalizedIdentifier.toLowerCase(), },
        { enrollmentNo: normalizedIdentifier, },
        { facultyId: normalizedIdentifier, },
      ],
    },
  });
    if (!user || !user.isActive) throw new UnauthorizedError('Invalid credentials');

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) throw new UnauthorizedError('Invalid credentials');

    const payload: TokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    // Audit: track login
    auditService.log(user.id, 'LOGIN', 'User', user.id).catch(() => {});

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id, email: user.email, role: user.role,
        firstName: user.firstName, lastName: user.lastName,
        department: user.department, mustResetPwd: user.mustResetPwd,
      },
    };
  }

  async refresh(oldRefreshToken: string) {
    try {
      const payload = verifyRefreshToken(oldRefreshToken);
      const stored = await prisma.refreshToken.findUnique({ where: { token: oldRefreshToken } });
      if (!stored || stored.isRevoked) throw new UnauthorizedError('Invalid refresh token');

      await prisma.refreshToken.update({ where: { id: stored.id }, data: { isRevoked: true } });

      const newPayload: TokenPayload = { userId: payload.userId, email: payload.email, role: payload.role };
      const accessToken = generateAccessToken(newPayload);
      const refreshToken = generateRefreshToken(newPayload);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      await prisma.refreshToken.create({ data: { token: refreshToken, userId: payload.userId, expiresAt } });

      return { accessToken, refreshToken };
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    await prisma.refreshToken.updateMany({ where: { token: refreshToken }, data: { isRevoked: true } });
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, role: true, firstName: true, lastName: true,
        department: true, enrollmentNo: true, facultyId: true, phone: true,
        mustResetPwd: true, lastLoginAt: true, createdAt: true,
      },
    });
    if (!user) throw new UnauthorizedError('User not found');
    return user;
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedError('User not found');

    const isMatch = await comparePassword(oldPassword, user.password);
    if (!isMatch) throw new BadRequestError('Current password is incorrect');

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed, mustResetPwd: false } });
    await prisma.refreshToken.updateMany({ where: { userId }, data: { isRevoked: true } });

    // Audit: track password change
    auditService.log(userId, 'CHANGE_PASSWORD', 'User', userId).catch(() => {});
  }
}

export const authService = new AuthService();