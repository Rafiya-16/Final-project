import { Router } from 'express';
import { projectsController } from './projects.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validateRequest } from '../../middleware/validateRequest';
import { submitProjectSchema, reviewProjectSchema } from './projects.validation';
import { timelineGuard } from '../../middleware/timelineGuard';

const router = Router();
router.use(authenticate);

// Faculty
router.post('/:poolId/projects/check-similarity', authorize('FACULTY'), (q, s, n) => projectsController.checkSimilarity( q, s, n));
router.post('/:poolId/projects', authorize('FACULTY'), timelineGuard('SUBMISSION'), validateRequest(submitProjectSchema), (q, s, n) => projectsController.submit(q, s, n));
router.post('/:poolId/projects/finalize', authorize('FACULTY'), timelineGuard('SUBMISSION'), (q, s, n) => projectsController.finalize(q, s, n));
router.put('/:poolId/projects/:projectId', authorize('FACULTY'), timelineGuard('SUBMISSION'), (q, s, n) => projectsController.edit(q, s, n));
router.delete('/:poolId/projects/:projectId', authorize('FACULTY'), timelineGuard('SUBMISSION'), (q, s, n) => projectsController.remove(q, s, n));

// Subadmin review
router.post('/:poolId/projects/:projectId/lock', authorize('SUBADMIN'), (q, s, n) => projectsController.lock(q, s, n));
router.post('/:poolId/projects/:projectId/hold', authorize('SUBADMIN'), (q, s, n) => projectsController.hold(q, s, n));
router.post('/:poolId/faculty/:facultyId/review', authorize('SUBADMIN'), (q, s, n) => projectsController.reviewBatch(q, s, n));
router.get('/:poolId/faculty-status', authorize('SUBADMIN', 'ADMIN'), (q, s, n) => projectsController.getFacultyStatus(q, s, n));

// Admin decisions
router.post('/:poolId/projects/:projectId/approve', authorize('ADMIN'), (q, s, n) => projectsController.approve(q, s, n));
router.post('/:poolId/projects/:projectId/reject', authorize('ADMIN'), (q, s, n) => projectsController.reject(q, s, n));
router.post('/:poolId/projects/approve-all-locked', authorize('ADMIN'), (q, s, n) => projectsController.approveAllLocked(q, s, n));
router.get('/:poolId/projects/on-hold', authorize('ADMIN'), (q, s, n) => projectsController.getHeld(q, s, n));

// Anyone (role-filtered response)
router.get('/:poolId/projects', (q, s, n) => projectsController.listByPool(q, s, n));
router.get('/:poolId/projects/:projectId', (q, s, n) => projectsController.getById(q, s, n));

export default router;