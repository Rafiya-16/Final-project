// backend/src/modules/reports/reports.routes.ts

import { Router } from 'express';

import { reportsController } from './reports.controller';

import { authenticate } from '../../middleware/authenticate';
import { requireSubadminPoolAccess } from '../../middleware/poolAccess';

const router = Router();

router.use(authenticate);

/*
 * Reports are pool-scoped SubAdmin operations.
 *
 * Access is granted to:
 * - ADMIN
 * - global SUBADMIN
 * - FACULTY who has a PoolSubadmin assignment for the
 *   requested pool
 *
 * This intentionally does NOT use authorize('SUBADMIN')
 * because a Faculty user can have pool-level SubAdmin
 * capability without changing User.role.
 */

router.get(
  '/:poolId/reports/teams',
  requireSubadminPoolAccess('poolId'),
  (q, s, n) => reportsController.teamReport(q, s, n),
);

router.get(
  '/:poolId/reports/summary',
  requireSubadminPoolAccess('poolId'),
  (q, s, n) => reportsController.summary(q, s, n),
);

router.get(
  '/:poolId/reports/faculty',
  requireSubadminPoolAccess('poolId'),
  (q, s, n) => reportsController.facultyReport(q, s, n),
);

router.get(
  '/:poolId/reports/unassigned',
  requireSubadminPoolAccess('poolId'),
  (q, s, n) => reportsController.unassigned(q, s, n),
);

export default router;