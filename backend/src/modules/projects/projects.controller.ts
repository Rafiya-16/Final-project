import { Request, Response, NextFunction } from 'express';
import { projectsService } from './projects.service';

export class ProjectsController {
  /**
   * Faculty creates a project proposal.
   */
  async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await projectsService.submitProposal(
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

  /**
   * Check project similarity before creating/editing.
   *
   * This endpoint only checks similarity.
   * It does not create or modify a project.
   */
  async checkSimilarity(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data = await projectsService.checkProjectSimilarity(
        req.params.poolId as string,
        {
          title: req.body.title,
          description: req.body.description,
          domain: req.body.domain ?? null,
        },
        req.body.excludeProjectId
      );

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Faculty finalizes all proposals.
   */
  async finalize(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await projectsService.finalizeSubmission(
        req.params.poolId as string,
        req.user!.userId
      );

      res.json({
        success: true,
        ...data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Faculty edits a DRAFT proposal.
   */
  async edit(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await projectsService.editProposal(
        req.params.projectId as string,
        req.user!.userId,
        req.body
      );

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Faculty deletes a DRAFT proposal.
   */
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await projectsService.deleteProposal(
        req.params.projectId as string,
        req.user!.userId
      );

      res.json({
        success: true,
        ...data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * SubAdmin locks a submitted project.
   */
  async lock(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await projectsService.lockProject(
        req.params.projectId as string,
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

  /**
   * SubAdmin puts a submitted project on hold.
   */
  async hold(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await projectsService.holdProject(
        req.params.projectId as string,
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

  /**
   * SubAdmin reviews all proposals from one faculty.
   *
   * Required:
   * - 3 LOCK
   * - 1 HOLD
   */
  async reviewBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await projectsService.reviewFacultyProposals(
        req.params.poolId as string,
        req.params.facultyId as string,
        req.user!.userId,
        req.body.decisions
      );

      res.json({
        success: true,
        ...data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin approves an ON_HOLD project.
   */
  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await projectsService.approveProject(
        req.params.projectId as string,
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

  /**
   * Admin rejects an ON_HOLD project.
   */
  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await projectsService.rejectProject(
        req.params.projectId as string,
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

  /**
   * Admin approves all LOCKED projects.
   */
  async approveAllLocked(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data = await projectsService.approveAllLocked(
        req.params.poolId as string,
        req.user!.userId
      );

      res.json({
        success: true,
        ...data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get projects belonging to a pool.
   */
  async listByPool(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data = await projectsService.getProjectsByPool(
        req.params.poolId as string,
        req.user!.userId,
        req.user!.role
      );

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get projects currently ON_HOLD.
   */
  async getHeld(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data = await projectsService.getHeldProjects(
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

  /**
   * Get faculty submission status.
   */
  async getFacultyStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data =
        await projectsService.getFacultySubmissions(
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

  /**
   * Get a single project.
   */
  async getById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data =
        await projectsService.getProjectById(
          req.params.projectId as string
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

export const projectsController =
  new ProjectsController();