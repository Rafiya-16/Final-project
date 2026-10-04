import { Request, Response, NextFunction } from 'express';
import { poolsService } from './pools.service';
import { parsePagination } from '../../shared/utils/pagination';

export class PoolsController {
  async create(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      res.status(201).json({
        success: true,
        data: await poolsService.createPool(
          req.body,
          req.user!.userId
        ),
      });
    } catch (e) {
      next(e);
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

      const result =
        await poolsService.listPools(
          req.user!.userId,
          req.user!.role,
          parsePagination(req.query),
          scope
        );

      res.json({
        success: true,
        ...result,
      });
    } catch (e) {
      next(e);
    }
  }

  async getById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      res.json({
        success: true,
        data: await poolsService.getPoolById(
          req.params.id as string
        ),
      });
    } catch (e) {
      next(e);
    }
  }

  async update(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      res.json({
        success: true,
        data: await poolsService.updatePool(
          req.params.id as string,
          req.body
        ),
      });
    } catch (e) {
      next(e);
    }
  }

  async activate(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      res.json({
        success: true,
        message: 'Pool activated',
        data: await poolsService.activatePool(
          req.params.id as string
        ),
      });
    } catch (e) {
      next(e);
    }
  }

  async advancePhase(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      res.json({
        success: true,
        message: 'Phase advanced',
        data: await poolsService.advancePhase(
          req.params.id as string
        ),
      });
    } catch (e) {
      next(e);
    }
  }

  async freeze(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      res.json({
        success: true,
        data: await poolsService.freezePool(
          req.params.id as string
        ),
      });
    } catch (e) {
      next(e);
    }
  }

  async archive(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      res.json({
        success: true,
        data: await poolsService.archivePool(
          req.params.id as string
        ),
      });
    } catch (e) {
      next(e);
    }
  }

  async assignUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      res.json({
        success: true,
        data: await poolsService.assignUsers(
          req.params.id as string,
          req.body
        ),
      });
    } catch (e) {
      next(e);
    }
  }

  async getStats(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      res.json({
        success: true,
        data: await poolsService.getPoolStats(
          req.params.id as string
        ),
      });
    } catch (e) {
      next(e);
    }
  }

  async removeFaculty(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      res.json({
        success: true,
        data: await poolsService.removeFaculty(
          req.params.id as string,
          req.params.facultyId as string
        ),
      });
    } catch (e) {
      next(e);
    }
  }

  async removeSubadmin(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      res.json({
        success: true,
        data: await poolsService.removeSubadmin(
          req.params.id as string,
          req.params.subadminId as string
        ),
      });
    } catch (e) {
      next(e);
    }
  }
}

export const poolsController =
  new PoolsController();