import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireSubadminPoolAccess } from '../../middleware/poolAccess';
import { adminTeamManagementService } from './admin-team-management.service';

const router = Router();
router.use(authenticate);
const handle = (fn: (req: Request) => Promise<unknown>, status = 200) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(status).json({ success: true, data: await fn(req) }); }
    catch (error) { next(error); }
  };
const bodyString = (value: unknown) => typeof value === 'string' ? value : '';

router.get('/:poolId/team-management', requireSubadminPoolAccess('poolId'), handle((req) => adminTeamManagementService.getManagementData(req.params.poolId as string)));
router.post('/:poolId/team-management/teams', requireSubadminPoolAccess('poolId'), handle((req) => adminTeamManagementService.createTeam(req.params.poolId as string, req.user!.userId, { name: bodyString(req.body.name), studentIds: Array.isArray(req.body.studentIds) ? req.body.studentIds : [], leaderId: bodyString(req.body.leaderId), reason: bodyString(req.body.reason) }), 201));
router.post('/:poolId/team-management/teams/:teamId/members', requireSubadminPoolAccess('poolId'), handle((req) => adminTeamManagementService.addOrTransferMember({ actorId: req.user!.userId, poolId: req.params.poolId as string, teamId: req.params.teamId as string, studentId: bodyString(req.body.studentId), reason: bodyString(req.body.reason) }), 201));
router.delete('/:poolId/team-management/teams/:teamId/members/:studentId', requireSubadminPoolAccess('poolId'), handle((req) => adminTeamManagementService.removeMember({ actorId: req.user!.userId, poolId: req.params.poolId as string, teamId: req.params.teamId as string, studentId: req.params.studentId as string, reason: bodyString(req.body.reason) })));
router.patch('/:poolId/team-management/teams/:teamId/leader', requireSubadminPoolAccess('poolId'), handle((req) => adminTeamManagementService.setLeader(req.params.poolId as string, req.params.teamId as string, req.user!.userId, bodyString(req.body.leaderId), bodyString(req.body.reason))));
export default router;
