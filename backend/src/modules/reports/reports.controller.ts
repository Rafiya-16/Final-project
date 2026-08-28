import { Request, Response, NextFunction } from 'express';
import { reportsService } from './reports.service';

export class ReportsController {
  async teamReport(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      res.json({
        success: true,
        data: await reportsService.getTeamReport(
          req.params.poolId as string
        ),
      });
    } catch (e) {
      next(e);
    }
  }

  async summary(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      res.json({
        success: true,
        data: await reportsService.getAllocationSummary(
          req.params.poolId as string
        ),
      });
    } catch (e) {
      next(e);
    }
  }

  async unassigned(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      res.json({
        success: true,
        data: await reportsService.getUnassignedStudents(
          req.params.poolId as string
        ),
      });
    } catch (e) {
      next(e);
    }
  }

  async facultyReport(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      res.json({
        success: true,
        data: await reportsService.getFacultyReport(
          req.params.poolId as string
        ),
      });
    } catch (e) {
      next(e);
    }
  }
}

export const reportsController = new ReportsController();