// backend/src/modules/teams/teams.controller.ts

import { Request, Response, NextFunction } from 'express';

import { teamsService } from './teams.service';

export class TeamsController {
  // Create a new team
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(201).json({
        success: true,
        data: await teamsService.createTeam(
          req.params.poolId as string,
          req.user!.userId,
          req.body.name
        ),
      });
    } catch (e) {
      next(e);
    }
  }

  // Team Leader → Invite student
  async invite(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        success: true,
        data: await teamsService.inviteMember(
          req.params.teamId as string,
          req.user!.userId,
          req.body.studentId,
          req.body.message
        ),
      });
    } catch (e) {
      next(e);
    }
  }

  // Student → Accept / Reject team invitation
  async respond(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        success: true,
        ...(await teamsService.respondToInvite(
          req.params.inviteId as string,
          req.user!.userId,
          req.body.accept
        )),
      });
    } catch (e) {
      next(e);
    }
  }

  // Team Leader → Select project
  async selectProject(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        success: true,
        data: await teamsService.selectProject(
          req.params.teamId as string,
          req.user!.userId,
          req.body.projectId
        ),
      });
    } catch (e) {
      next(e);
    }
  }

  // Legacy direct leave endpoint.
  // Direct leaving is disabled in the service.
  // Student must submit a leave request for supervisor approval.
  async leave(req: Request, res: Response, next: NextFunction) {
    try {
      await teamsService.leaveTeam(
        req.params.teamId as string,
        req.user!.userId
      );

      res.json({
        success: true,
      });
    } catch (e) {
      next(e);
    }
  }

  // Student → Create team leave request
  async createLeaveRequest(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      res.status(201).json({
        success: true,
        data: await teamsService.createLeaveRequest(
          req.params.teamId as string,
          req.user!.userId,
          req.body.reason
        ),
      });
    } catch (e) {
      next(e);
    }
  }

  // Faculty → Get leave requests
  async getLeaveRequestsForFaculty(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      res.json({
        success: true,
        data: await teamsService.getLeaveRequestsForFaculty(
          req.user!.userId
        ),
      });
    } catch (e) {
      next(e);
    }
  }

  // Faculty → Approve / Reject leave request
  async reviewLeaveRequest(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      res.json({
        success: true,
        data: await teamsService.reviewLeaveRequest(
          req.params.requestId as string,
          req.user!.userId,
          req.body.status,
          req.body.responseNote
        ),
      });
    } catch (e) {
      next(e);
    }
  }

  // Team Leader → Create team dissolve request
  async createDissolveRequest(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      res.status(201).json({
        success: true,
        data: await teamsService.createDissolveRequest(
          req.params.teamId as string,
          req.user!.userId,
          req.body.reason
        ),
      });
    } catch (e) {
      next(e);
    }
  }

  // Faculty → Get team dissolve requests
  async getDissolveRequestsForFaculty(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      res.json({
        success: true,
        data: await teamsService.getDissolveRequestsForFaculty(
          req.user!.userId
        ),
      });
    } catch (e) {
      next(e);
    }
  }

  // Faculty → Approve / Reject team dissolve request
  async reviewDissolveRequest(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      res.json({
        success: true,
        data: await teamsService.reviewDissolveRequest(
          req.params.requestId as string,
          req.user!.userId,
          req.body.status,
          req.body.responseNote
        ),
      });
    } catch (e) {
      next(e);
    }
  }

  // Team Leader → Remove a team member
  async removeMember(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        success: true,
        ...(await teamsService.removeMember(
          req.params.teamId as string,
          req.user!.userId,
          req.params.memberId as string
        )),
      });
    } catch (e) {
      next(e);
    }
  }

  // Legacy dissolve endpoint.
  // Dissolution now goes through supervisor approval.
  async dissolve(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(201).json({
        success: true,
        data: await teamsService.createDissolveRequest(
          req.params.teamId as string,
          req.user!.userId,
          req.body.reason
        ),
      });
    } catch (e) {
      next(e);
    }
  }

  // Get all teams for a pool
  async listByPool(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        success: true,
        data: await teamsService.getTeamsByPool(
          req.params.poolId as string
        ),
      });
    } catch (e) {
      next(e);
    }
  }

  // Student → Get own team
  async getMyTeam(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        success: true,
        data: await teamsService.getMyTeam(
          req.params.poolId as string,
          req.user!.userId
        ),
      });
    } catch (e) {
      next(e);
    }
  }

  // Student → Get own team invitations
  async getMyInvites(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        success: true,
        data: await teamsService.getMyInvites(
          req.params.poolId as string,
          req.user!.userId
        ),
      });
    } catch (e) {
      next(e);
    }
  }
}

export const teamsController = new TeamsController();