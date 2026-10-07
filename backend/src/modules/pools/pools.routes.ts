import { Router } from 'express';
import { poolsController } from './pools.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import {
  createPoolSchema,
  updatePoolSchema,
  assignUsersSchema,
} from './pools.validation';
import { validateRequest } from '../../middleware/validateRequest';

const router = Router();

router.use(authenticate);

/*
 * GET routes
 *
 * All authenticated roles can read pools.
 * The service layer filters pools according to the logged-in user's role.
 *
 * ADMIN    -> all pools
 * SUBADMIN -> assigned pools
 * FACULTY  -> assigned pools
 * STUDENT  -> assigned pools
 */
router.get('/', (q, s, n) => poolsController.list(q, s, n));

router.get('/:id', (q, s, n) =>
  poolsController.getById(q, s, n)
);

router.get('/:id/stats', (q, s, n) =>
  poolsController.getStats(q, s, n)
);

/*
 * Admin-only mutation routes
 */
router.post(
  '/',
  authorize('ADMIN'),
  validateRequest(createPoolSchema),
  (q, s, n) => poolsController.create(q, s, n)
);

router.put(
  '/:id',
  authorize('ADMIN'),
  validateRequest(updatePoolSchema),
  (q, s, n) => poolsController.update(q, s, n)
);

router.post(
  '/:id/activate',
  authorize('ADMIN'),
  (q, s, n) => poolsController.activate(q, s, n)
);

router.post(
  '/:id/advance-phase',
  authorize('ADMIN'),
  (q, s, n) => poolsController.advancePhase(q, s, n)
);

router.post(
  '/:id/freeze',
  authorize('ADMIN'),
  (q, s, n) => poolsController.freeze(q, s, n)
);

router.post(
  '/:id/archive',
  authorize('ADMIN'),
  (q, s, n) => poolsController.archive(q, s, n)
);

router.post(
  '/:id/assign-users',
  authorize('ADMIN'),
  validateRequest(assignUsersSchema),
  (q, s, n) => poolsController.assignUsers(q, s, n)
);

export default router;