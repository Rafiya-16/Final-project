import { Router } from 'express';
import { Permission } from '@prisma/client';

import { reportsController } from './reports.controller';

import { authenticate } from '../../middleware/authenticate';
import { authorizeAccess } from '../../middleware/authorizeAccess';

const router = Router();

router.use(authenticate);

// ======================================================
// REPORT ACCESS
//
// Supports:
// - ADMIN
// - users with permanent VIEW_REPORTS permission
// - users with active temporary VIEW_REPORTS permission
// ======================================================

const viewReports = authorizeAccess({
  permissions: [Permission.VIEW_REPORTS],
});

router.get(
  '/:poolId/reports/teams',
  viewReports,
  (q, s, n) => reportsController.teamReport(q, s, n),
);

router.get(
  '/:poolId/reports/summary',
  viewReports,
  (q, s, n) => reportsController.summary(q, s, n),
);

router.get(
  '/:poolId/reports/unassigned',
  viewReports,
  (q, s, n) => reportsController.unassigned(q, s, n),
);

export default router;