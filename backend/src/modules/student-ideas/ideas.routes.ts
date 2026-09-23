import { Router } from 'express';
import { ideasController } from './ideas.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

router.use(authenticate);

/*
 * Student routes
 */

router.get(
  '/:poolId/ideas/available-supervisors',
  authorize('STUDENT'),
  (q, s, n) =>
    ideasController.getAvailableSupervisors(q, s, n)
);

router.post(
  '/:poolId/ideas',
  authorize('STUDENT'),
  (q, s, n) =>
    ideasController.submit(q, s, n)
);

router.get(
  '/:poolId/ideas/mine',
  authorize('STUDENT'),
  (q, s, n) =>
    ideasController.getMyIdeas(q, s, n)
);

/*
 * Faculty routes.
 *
 * Keep supervision-requests BEFORE /:ideaId routes.
 */

router.get(
  '/:poolId/ideas/supervision-requests',
  authorize('FACULTY'),
  (q, s, n) =>
    ideasController.getSupervisionRequests(q, s, n)
);

router.post(
  '/:poolId/ideas/:ideaId/supervision/accept',
  authorize('FACULTY'),
  (q, s, n) =>
    ideasController.acceptSupervision(q, s, n)
);

router.post(
  '/:poolId/ideas/:ideaId/supervision/reject',
  authorize('FACULTY'),
  (q, s, n) =>
    ideasController.rejectSupervision(q, s, n)
);

/*
 * Admin routes.
 */

router.get(
  '/:poolId/ideas',
  authorize('ADMIN', 'SUBADMIN'),
  (q, s, n) =>
    ideasController.listByPool(q, s, n)
);

router.post(
  '/:poolId/ideas/:ideaId/approve',
  authorize('ADMIN'),
  (q, s, n) =>
    ideasController.approve(q, s, n)
);

router.post(
  '/:poolId/ideas/:ideaId/reject',
  authorize('ADMIN'),
  (q, s, n) =>
    ideasController.reject(q, s, n)
);

router.post(
  '/:poolId/ideas/:ideaId/supervisor',
  authorize('ADMIN'),
  (q, s, n) =>
    ideasController.assignSupervisor(q, s, n)
);

export default router;