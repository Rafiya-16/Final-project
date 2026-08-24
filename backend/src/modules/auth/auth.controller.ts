import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
  try {
    console.log('========== AUTH CONTROLLER LOGIN ==========');
    console.log('Request body:', {
      identifier: req.body?.identifier,
      passwordReceived: !!req.body?.password,
    });

    const { identifier, password } = req.body;

    console.log('JWT_ACCESS_SECRET exists:', !!process.env.JWT_ACCESS_SECRET);
    console.log('JWT_REFRESH_SECRET exists:', !!process.env.JWT_REFRESH_SECRET);

    if (!identifier || !password) {
      console.log('LOGIN ERROR: identifier or password missing');
      res.status(400).json({
        success: false,
        message: 'Identifier and password are required',
      });
      return;
    }

    if (
      !process.env.JWT_ACCESS_SECRET ||
      !process.env.JWT_REFRESH_SECRET
    ) {
      console.log('LOGIN ERROR: JWT secrets missing');

      throw new Error(
        'JWT secrets are missing in environment variables'
      );
    }

    console.log('Calling authService.login()...');

    const result = await authService.login(identifier, password);

    console.log('authService.login() completed successfully');

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log('Sending successful login response');

    res.json({
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });

    console.log('========== LOGIN RESPONSE SENT ==========');
  } catch (error) {
    console.error('========== AUTH CONTROLLER LOGIN ERROR ==========');
    console.error(error);
    console.error('=================================================');

    next(error);
  }
}

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const oldToken = req.cookies.refreshToken;
      if (!oldToken) { res.status(401).json({ success: false, message: 'Refresh token required' }); return; }

      const result = await authService.refresh(oldToken);
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.json({ success: true, data: { accessToken: result.accessToken } });
    } catch (error) { next(error); }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies.refreshToken;
      if (token) await authService.logout(token);
      res.clearCookie('refreshToken');
      res.json({ success: true, message: 'Logged out' });
    } catch (error) { next(error); }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.getMe(req.user!.userId);
      res.json({ success: true, data: user });
    } catch (error) { next(error); }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.changePassword(req.user!.userId, req.body.oldPassword, req.body.newPassword);
      res.clearCookie('refreshToken');
      res.json({ success: true, message: 'Password changed. Please login again.' });
    } catch (error) { next(error); }
  }
}

export const authController = new AuthController();