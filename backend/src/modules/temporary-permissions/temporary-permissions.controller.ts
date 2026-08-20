import {
  Request,
  Response,
  NextFunction,
} from 'express';

import {
  temporaryPermissionsService,
} from './temporary-permissions.service';

export class TemporaryPermissionsController {
  async create(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const permission =
        await temporaryPermissionsService.create(
          req.body,
          req.user!.userId
        );

      res.status(201).json({
        success: true,
        message:
          'Temporary permission granted successfully',
        data: permission,
      });
    } catch (error) {
      next(error);
    }
  }

  async list(
    _req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const permissions =
        await temporaryPermissionsService.listAll();

      res.json({
        success: true,
        data: permissions,
      });
    } catch (error) {
      next(error);
    }
  }

  async listForUser(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const permissions =
        await temporaryPermissionsService.listForUser(
String(req.params.userId)        );

      res.json({
        success: true,
        data: permissions,
      });
    } catch (error) {
      next(error);
    }
  }

  async revoke(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const permission =
        await temporaryPermissionsService.revoke(
String(req.params.id)        );

      res.json({
        success: true,
        message:
          'Temporary permission revoked successfully',
        data: permission,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const temporaryPermissionsController =
  new TemporaryPermissionsController();