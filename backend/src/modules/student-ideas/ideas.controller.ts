import { Request, Response, NextFunction } from 'express';
import { ideasService } from './ideas.service';

export class IdeasController {
  async submit(req: Request, res: Response, next: NextFunction) { try { res.status(201).json({ success: true, data: await ideasService.submitIdea(req.params.poolId as string, req.user!.userId, req.body) }); } catch (e) { next(e); } }
  async approve(req: Request, res: Response, next: NextFunction) { try { res.json({ success: true, ...await ideasService.approveIdea(req.params.ideaId as string, req.body.feedback) }); } catch (e) { next(e); } }
  async reject(req: Request, res: Response, next: NextFunction) { try { res.json({ success: true, data: await ideasService.rejectIdea(req.params.ideaId as string, req.body.feedback) }); } catch (e) { next(e); } }
  async assignSupervisor(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({
      success: true,
      data: await ideasService.assignSupervisor(
        req.params.ideaId as string,
        req.body.supervisorId
      ),
    });
  } catch (e) {
    next(e);
  }
}
  async listByPool(req: Request, res: Response, next: NextFunction) { try { res.json({ success: true, data: await ideasService.getIdeasByPool(req.params.poolId as string) }); } catch (e) { next(e); } }
  async getMyIdeas(req: Request, res: Response, next: NextFunction) { try { res.json({ success: true, data: await ideasService.getMyIdeas(req.params.poolId as string, req.user!.userId) }); } catch (e) { next(e); } }
}

export const ideasController = new IdeasController();