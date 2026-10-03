import { Router } from 'express';
import { ideasController } from './ideas.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import {
  requireFacultyPoolAccess,
  requireSubadminPoolAccess,
} from '../../middleware/poolAccess';

const router = Router();

router.use(authenticate);

/* Student routes */
router.get(
  '/:poolId/ideas/available-supervisors',
  authorize('STUDENT'),
  (q, s, n) => ideasController.getAvailableSupervisors(q, s, n)
);

router.post(
  '/:poolId/ideas',
  authorize('STUDENT'),
  (q, s, n) => ideasController.submit(q, s, n)
);

router.get(
  '/:poolId/ideas/mine',
  authorize('STUDENT'),
  (q, s, n) => ideasController.getMyIdeas(q, s, n)
);

/*
 * Faculty routes.
 *
 * DB-backed pool capability is used instead of authorize('FACULTY')
 * so a Faculty user who is also a pool SubAdmin is still handled
 * correctly without changing User.role.
 */
router.get(
  '/:poolId/ideas/supervision-requests',
  requireFacultyPoolAccess('poolId'),
  (q, s, n) => ideasController.getSupervisionRequests(q, s, n)
);

router.post(
  '/:poolId/ideas/:ideaId/supervision/accept',
  requireFacultyPoolAccess('poolId'),
  (q, s, n) => ideasController.acceptSupervision(q, s, n)
);

router.post(
  '/:poolId/ideas/:ideaId/supervision/reject',
  requireFacultyPoolAccess('poolId'),
  (q, s, n) => ideasController.rejectSupervision(q, s, n)
);

/* Admin / pool SubAdmin review */
router.get(
  '/:poolId/ideas',
  requireSubadminPoolAccess('poolId'),
  (q, s, n) => ideasController.listByPool(q, s, n)
);

/* Final decisions remain Admin-only. */
router.post(
  '/:poolId/ideas/:ideaId/approve',
  authorize('ADMIN'),
  (q, s, n) => ideasController.approve(q, s, n)
);

router.post(
  '/:poolId/ideas/:ideaId/reject',
  authorize('ADMIN'),
  (q, s, n) => ideasController.reject(q, s, n)
);

router.post(
  '/:poolId/ideas/:ideaId/supervisor',
  authorize('ADMIN'),
  (q, s, n) => ideasController.assignSupervisor(q, s, n)
);

router.get(
  '/:poolId/ideas/available-supervisors/admin',
  authorize('ADMIN'),
  (q, s, n) => ideasController.getAvailableSupervisors(q, s, n)
);

export default router;
