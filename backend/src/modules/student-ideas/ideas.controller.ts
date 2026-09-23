import { Request, Response, NextFunction } from 'express';
import { ideasService } from './ideas.service';

export class IdeasController {
  async submit(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data = await ideasService.submitIdea(
        req.params.poolId as string,
        req.user!.userId,
        req.body
      );

      res.status(201).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAvailableSupervisors(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data =
        await ideasService.getAvailableSupervisors(
          req.params.poolId as string
        );

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async approve(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data = await ideasService.approveIdea(
        req.params.ideaId as string,
        req.body.feedback
      );

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async reject(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data = await ideasService.rejectIdea(
        req.params.ideaId as string,
        req.body.feedback
      );

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSupervisionRequests(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data =
        await ideasService.getSupervisionRequests(
          req.params.poolId as string,
          req.user!.userId
        );

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async acceptSupervision(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data =
        await ideasService.acceptSupervision(
          req.params.ideaId as string,
          req.user!.userId,
          req.body.note
        );

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectSupervision(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data =
        await ideasService.rejectSupervision(
          req.params.ideaId as string,
          req.user!.userId,
          req.body.note
        );

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async assignSupervisor(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data =
        await ideasService.assignSupervisor(
          req.params.ideaId as string,
          req.body.supervisorId
        );

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async listByPool(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data =
        await ideasService.getIdeasByPool(
          req.params.poolId as string
        );

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyIdeas(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data =
        await ideasService.getMyIdeas(
          req.params.poolId as string,
          req.user!.userId
        );

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const ideasController = new IdeasController();