// backend/src/modules/pools/pools.routes.ts

import { Router } from 'express';

import { poolsController } from './pools.controller';

import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { requirePoolAccess } from '../../middleware/poolAccess';

import {
  createPoolSchema,
  updatePoolSchema,
  assignUsersSchema,
} from './pools.validation';

import { validateRequest } from '../../middleware/validateRequest';

const router = Router();

router.use(authenticate);

/*
 * Pool list
 *
 * ADMIN    -> all pools
 * SUBADMIN -> assigned pools
 * FACULTY  -> assigned pools
 * STUDENT  -> accessible pools
 *
 * The service applies role-based filtering and scope handling.
 */
router.get(
  '/',
  (req, res, next) =>
    poolsController.list(req, res, next)
);

/*
 * View a specific pool
 */
router.get(
  '/:id',
  requirePoolAccess('id'),
  (req, res, next) =>
    poolsController.getById(req, res, next)
);

/*
 * Pool statistics
 */
router.get(
  '/:id/stats',
  requirePoolAccess('id'),
  (req, res, next) =>
    poolsController.getStats(req, res, next)
);

/*
 * Admin-only mutation routes
 */
router.post(
  '/',
  authorize('ADMIN'),
  validateRequest(createPoolSchema),
  (req, res, next) =>
    poolsController.create(req, res, next)
);

router.put(
  '/:id',
  authorize('ADMIN'),
  validateRequest(updatePoolSchema),
  (req, res, next) =>
    poolsController.update(req, res, next)
);

router.post(
  '/:id/activate',
  authorize('ADMIN'),
  (req, res, next) =>
    poolsController.activate(req, res, next)
);

router.post(
  '/:id/advance-phase',
  authorize('ADMIN'),
  (req, res, next) =>
    poolsController.advancePhase(req, res, next)
);

router.post(
  '/:id/freeze',
  authorize('ADMIN'),
  (req, res, next) =>
    poolsController.freeze(req, res, next)
);

router.post(
  '/:id/archive',
  authorize('ADMIN'),
  (req, res, next) =>
    poolsController.archive(req, res, next)
);

router.post(
  '/:id/assign-users',
  authorize('ADMIN'),
  validateRequest(assignUsersSchema),
  (req, res, next) =>
    poolsController.assignUsers(req, res, next)
);

router.delete(
  '/:id/faculty/:facultyId',
  authorize('ADMIN'),
  (req, res, next) =>
    poolsController.removeFaculty(req, res, next)
);

router.delete(
  '/:id/subadmins/:subadminId',
  authorize('ADMIN'),
  (req, res, next) =>
    poolsController.removeSubadmin(req, res, next)
);

export default router;