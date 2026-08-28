import { Router } from 'express';
import { reportsController } from './reports.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();
router.use(authenticate, authorize('ADMIN', 'SUBADMIN'));

router.get('/:poolId/reports/teams', (q, s, n) => reportsController.teamReport(q, s, n));
router.get('/:poolId/reports/summary', (q, s, n) => reportsController.summary(q, s, n));
router.get('/:poolId/reports/faculty',(q, s, n) => reportsController.facultyReport(q, s, n));
router.get('/:poolId/reports/unassigned', (q, s, n) => reportsController.unassigned(q, s, n));

export default router;