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

import {
  requirePoolAccess,
} from '../../middleware/poolAccess';

const router = Router();

router.use(authenticate);

/*
 * ============================================================
 * POOL LIST
 * ============================================================
 *
 * Backend determines the actual accessible pools.
 *
 * Examples:
 *
 * /pools?scope=subadmin
 * /pools?scope=faculty
 * /pools?scope=student
 * /pools?scope=all
 *
 * ADMIN always receives all pools.
 */
router.get(
  '/',
  (req, res, next) =>
    poolsController.list(
      req,
      res,
      next
    )
);

/*
 * ============================================================
 * VIEW SPECIFIC POOL
 * ============================================================
 *
 * ADMIN:
 *   allowed
 *
 * SUBADMIN:
 *   must be assigned through PoolSubadmin
 *
 * FACULTY:
 *   must be assigned through PoolFaculty OR
 *   PoolSubadmin
 *
 * STUDENT:
 *   existing behavior preserved
 */
router.get(
  '/:id',
  requirePoolAccess('id'),
  (req, res, next) =>
    poolsController.getById(
      req,
      res,
      next
    )
);

router.get(
  '/:id/stats',
  requirePoolAccess('id'),
  (req, res, next) =>
    poolsController.getStats(
      req,
      res,
      next
    )
);

/*
 * ============================================================
 * ADMIN ONLY
 * ============================================================
 */

router.post(
  '/',
  authorize('ADMIN'),
  validateRequest(createPoolSchema),
  (req, res, next) =>
    poolsController.create(
      req,
      res,
      next
    )
);

router.put(
  '/:id',
  authorize('ADMIN'),
  validateRequest(updatePoolSchema),
  (req, res, next) =>
    poolsController.update(
      req,
      res,
      next
    )
);

router.post(
  '/:id/activate',
  authorize('ADMIN'),
  (req, res, next) =>
    poolsController.activate(
      req,
      res,
      next
    )
);

router.post(
  '/:id/advance-phase',
  authorize('ADMIN'),
  (req, res, next) =>
    poolsController.advancePhase(
      req,
      res,
      next
    )
);

router.post(
  '/:id/freeze',
  authorize('ADMIN'),
  (req, res, next) =>
    poolsController.freeze(
      req,
      res,
      next
    )
);

router.post(
  '/:id/archive',
  authorize('ADMIN'),
  (req, res, next) =>
    poolsController.archive(
      req,
      res,
      next
    )
);

router.post(
  '/:id/assign-users',
  authorize('ADMIN'),
  validateRequest(assignUsersSchema),
  (req, res, next) =>
    poolsController.assignUsers(
      req,
      res,
      next
    )
);

router.delete(
  '/:id/faculty/:facultyId',
  authorize('ADMIN'),
  (req, res, next) =>
    poolsController.removeFaculty(
      req,
      res,
      next
    )
);

router.delete(
  '/:id/subadmins/:subadminId',
  authorize('ADMIN'),
  (req, res, next) =>
    poolsController.removeSubadmin(
      req,
      res,
      next
    )
);

export default router;