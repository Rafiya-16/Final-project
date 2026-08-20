import { Request, Response, NextFunction } from 'express';
import { poolsService } from './pools.service';
import { parsePagination } from '../../shared/utils/pagination';

export class PoolsController {
  async create(req: Request, res: Response, next: NextFunction) {
    try { res.status(201).json({ success: true, data: await poolsService.createPool(req.body, req.user!.userId) }); } catch (e) { next(e); }
  }
  async list(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, ...await poolsService.listPools(req.user!.userId, req.user!.role, parsePagination(req.query)) }); } catch (e) { next(e); }
  }
  async getById(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await poolsService.getPoolById(req.params.id as string) }); } catch (e) { next(e); }
  }
  async update(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await poolsService.updatePool(req.params.id as string, req.body) }); } catch (e) { next(e); }
  }
  async activate(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, message: 'Pool activated', data: await poolsService.activatePool(req.params.id as string) }); } catch (e) { next(e); }
  }
  async advancePhase(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, message: 'Phase advanced', data: await poolsService.advancePhase(req.params.id as string) }); } catch (e) { next(e); }
  }
  async freeze(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, message: 'Pool frozen', data: await poolsService.freezePool(req.params.id as string) }); } catch (e) { next(e); }
  }
  async archive(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await poolsService.archivePool(req.params.id as string) }); } catch (e) { next(e); }
  }
  async restore(req: Request, res: Response, next: NextFunction) {
  try {
    const pool = await poolsService.restorePool(
      req.params.id, req.user!.userId
    );

    res.json({
      success: true,
      data: pool,
    });
  } catch (e) {
    next(e);
  }
}
  async assignUsers(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await poolsService.assignUsers(req.params.id as string, req.body) }); } catch (e) { next(e); }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await poolsService.getPoolStats(req.params.id as string) }); } catch (e) { next(e); }
  }
}

export const poolsController = new PoolsController();