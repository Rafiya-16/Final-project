import { Router } from 'express';
import { Permission } from '@prisma/client';
import { projectsController } from './projects.controller';
import { authorize } from '../../middleware/authorize';
import { authorizeAccess } from '../../middleware/authorizeAccess';
import { authorizePermission } from '../../middleware/authorizePermission';
import { authenticate } from '../../middleware/authenticate';
import { validateRequest } from '../../middleware/validateRequest';
import { submitProjectSchema, reviewProjectSchema } from './projects.validation';
import { timelineGuard } from '../../middleware/timelineGuard';

const router = Router();

router.use(authenticate);


// ======================================================
// FACULTY PROJECT SUBMISSION
// ======================================================

router.post(
  '/:poolId/projects',
  authorize('FACULTY'),
  timelineGuard('SUBMISSION'),
  validateRequest(submitProjectSchema),
  (q, s, n) => projectsController.submit(q, s, n)
);

router.post(
  '/:poolId/projects/finalize',
  authorize('FACULTY'),
  timelineGuard('SUBMISSION'),
  (q, s, n) => projectsController.finalize(q, s, n)
);

router.put(
  '/:poolId/projects/:projectId',
  authorize('FACULTY'),
  timelineGuard('SUBMISSION'),
  (q, s, n) => projectsController.edit(q, s, n)
);

router.delete(
  '/:poolId/projects/:projectId',
  authorize('FACULTY'),
  timelineGuard('SUBMISSION'),
  (q, s, n) => projectsController.remove(q, s, n)
);


// ======================================================
// SUBADMIN PROJECT REVIEW
// Supports temporary MANAGE_PROJECTS permission.
// ======================================================

router.post(
  '/:poolId/projects/:projectId/lock',
  authorizePermission(Permission.MANAGE_PROJECTS),
  (q, s, n) => projectsController.lock(q, s, n)
);

router.post(
  '/:poolId/projects/:projectId/hold',
  authorizePermission(Permission.MANAGE_PROJECTS),
  (q, s, n) => projectsController.hold(q, s, n)
);

router.post(
  '/:poolId/faculty/:facultyId/review',
  authorizePermission(Permission.MANAGE_PROJECTS),
  validateRequest(reviewProjectSchema),
  (q, s, n) => projectsController.reviewBatch(q, s, n)
);

router.get(
  '/:poolId/faculty-status',
  authorizePermission(Permission.MANAGE_PROJECTS),
  (q, s, n) => projectsController.getFacultyStatus(q, s, n)
);


// ======================================================
// ADMIN PROJECT DECISIONS
// Supports temporary permissions.
// ======================================================

router.post(
  '/:poolId/projects/:projectId/approve',
  authorizePermission(Permission.APPROVE_PROJECTS),
  (q, s, n) => projectsController.approve(q, s, n)
);

router.post(
  '/:poolId/projects/:projectId/reject',
  authorizePermission(Permission.REJECT_PROJECTS),
  (q, s, n) => projectsController.reject(q, s, n)
);

router.post(
  '/:poolId/projects/approve-all-locked',
  authorizePermission(Permission.APPROVE_PROJECTS),
  (q, s, n) => projectsController.approveAllLocked(q, s, n)
);

router.get(
  '/:poolId/projects/on-hold',
  authorizePermission(Permission.MANAGE_PROJECTS),
  (q, s, n) => projectsController.getHeld(q, s, n)
);


// ======================================================
// READ ACCESS
// ======================================================

router.get(
  '/:poolId/projects',
  (q, s, n) => projectsController.listByPool(q, s, n)
);

router.get(
  '/:poolId/projects/:projectId',
  (q, s, n) => projectsController.getById(q, s, n)
);


export default router;