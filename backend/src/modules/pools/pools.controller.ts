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
      const pool =
        await poolsService.createPool(
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
      console.log(
        '[POOLS CONTROLLER] list()',
        {
          userId: req.user?.userId,
          email: req.user?.email,
          role: req.user?.role,
          query: req.query,
        }
      );

      const result =
        await poolsService.listPools(
          req.user!.userId,
          req.user!.role,
          parsePagination(req.query)
        );

      console.log(
        '[POOLS CONTROLLER] list success',
        {
          userId: req.user?.userId,
          role: req.user?.role,
          count: result.data?.length ?? 0,
        }
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error(
        '[POOLS CONTROLLER] list error:',
        error
      );

      next(error);
    }
  }

  async getById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const pool =
        await poolsService.getPoolById(
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
      const pool =
        await poolsService.updatePool(
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
      const pool =
        await poolsService.activatePool(
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

  async advancePhase(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const pool =
        await poolsService.advancePhase(
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

  async freeze(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const pool =
        await poolsService.freezePool(
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
      const pool =
        await poolsService.archivePool(
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
      const pool =
        await poolsService.assignUsers(
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
      const stats =
        await poolsService.getPoolStats(
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
}

export const poolsController =
  new PoolsController();