// backend/src/modules/pools/pools.routes.ts

import { Router } from 'express';
import { poolsController } from './pools.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validateRequest } from '../../middleware/validateRequest';
import {
  createPoolSchema,
  updatePoolSchema,
  assignUsersSchema,
} from './pools.validation';
import { requirePoolAccess } from '../../middleware/poolAccess';

const router = Router();

router.use(authenticate);

// ============================================================
// POOL ACCESS
// ============================================================

// List pools
//
// Existing service already filters pools according to the
// logged-in user's role and assignments.
router.get(
  '/',
  (q, s, n) => poolsController.list(q, s, n)
);

// View a specific pool
//
// SUBADMIN/FACULTY must be assigned to this pool.
// ADMIN and STUDENT retain their existing application-level access.
router.get(
  '/:id',
  requirePoolAccess('id'),
  (q, s, n) => poolsController.getById(q, s, n)
);

// View pool statistics
//
// SUBADMIN/FACULTY must be assigned to this pool.
// ADMIN and STUDENT retain their existing application-level access.
router.get(
  '/:id/stats',
  requirePoolAccess('id'),
  (q, s, n) => poolsController.getStats(q, s, n)
);

// ============================================================
// ADMIN ONLY
// ============================================================

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
router.delete(
  '/:id/faculty/:facultyId',
  authorize('ADMIN'),
  (q, s, n) => poolsController.removeFaculty(q, s, n),
);

router.delete(
  '/:id/subadmins/:subadminId',
  authorize('ADMIN'),
  (q, s, n) => poolsController.removeSubadmin(q, s, n),
);
export default router;