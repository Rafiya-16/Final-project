import {
  Request,
  Response,
  NextFunction,
} from 'express';

import { poolsService } from './pools.service';

import {
  parsePagination,
} from '../../shared/utils/pagination';

export class PoolsController {
  async create(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const pool = await poolsService.createPool(
        req.body,
        req.user!.userId
      );

      res.status(201).json({
        success: true,
        data: pool,
      });
    } catch (error) {
      next(error);
    }
  }

  async list(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const requestedScope =
        typeof req.query.scope === 'string'
          ? req.query.scope
          : 'all';

      const validScopes = [
        'all',
        'faculty',
        'subadmin',
        'student',
      ] as const;

      const scope = validScopes.includes(
        requestedScope as (typeof validScopes)[number]
      )
        ? (requestedScope as
            | 'all'
            | 'faculty'
            | 'subadmin'
            | 'student')
        : 'all';

      const result = await poolsService.listPools(
        req.user!.userId,
        req.user!.role,
        parsePagination(req.query),
        scope
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const pool = await poolsService.getPoolById(
        String(req.params.id)
      );

      res.json({
        success: true,
        data: pool,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const pool = await poolsService.updatePool(
        String(req.params.id),
        req.body
      );

      res.json({
        success: true,
        data: pool,
      });
    } catch (error) {
      next(error);
    }
  }

  async activate(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const pool = await poolsService.activatePool(
        String(req.params.id)
      );

      res.json({
        success: true,
        message: 'Pool activated',
        data: pool,
      });
    } catch (error) {
      next(error);
    }
  }

  async advancePhase(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const pool = await poolsService.advancePhase(
        String(req.params.id)
      );

      res.json({
        success: true,
        message: 'Phase advanced',
        data: pool,
      });
    } catch (error) {
      next(error);
    }
  }

  async freeze(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const pool = await poolsService.freezePool(
        String(req.params.id)
      );

      res.json({
        success: true,
        data: pool,
      });
    } catch (error) {
      next(error);
    }
  }

  async archive(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const pool = await poolsService.archivePool(
        String(req.params.id)
      );

      res.json({
        success: true,
        data: pool,
      });
    } catch (error) {
      next(error);
    }
  }

  async assignUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const pool = await poolsService.assignUsers(
        String(req.params.id),
        req.body
      );

      res.json({
        success: true,
        data: pool,
      });
    } catch (error) {
      next(error);
    }
  }

  async getStats(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const stats = await poolsService.getPoolStats(
        String(req.params.id)
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async removeFaculty(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await poolsService.removeFaculty(
        String(req.params.id),
        String(req.params.facultyId)
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async removeSubadmin(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await poolsService.removeSubadmin(
        String(req.params.id),
        String(req.params.subadminId)
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const poolsController =
  new PoolsController();