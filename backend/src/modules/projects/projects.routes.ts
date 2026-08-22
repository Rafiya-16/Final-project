import { Router } from 'express';

import { Permission } from '@prisma/client';

import { projectsController } from './projects.controller';

import { authorize } from '../../middleware/authorize';

import { authorizeAccess } from '../../middleware/authorizeAccess';

import { authenticate } from '../../middleware/authenticate';

import { validateRequest } from '../../middleware/validateRequest';

import {
  submitProjectSchema,
  reviewProjectSchema,
} from './projects.validation';

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
// PROJECT REVIEW
// Supports permanent role permissions and
// temporary permissions.
// ======================================================

router.post(
  '/:poolId/projects/:projectId/lock',
  authorizeAccess({
    permissions: [Permission.MANAGE_PROJECTS],
  }),
  (q, s, n) => projectsController.lock(q, s, n)
);

router.post(
  '/:poolId/projects/:projectId/hold',
  authorizeAccess({
    permissions: [Permission.MANAGE_PROJECTS],
  }),
  (q, s, n) => projectsController.hold(q, s, n)
);

router.post(
  '/:poolId/faculty/:facultyId/review',
  authorizeAccess({
    permissions: [Permission.MANAGE_PROJECTS],
  }),
  validateRequest(reviewProjectSchema),
  (q, s, n) => projectsController.reviewBatch(q, s, n)
);

router.get(
  '/:poolId/faculty-status',
  authorizeAccess({
    permissions: [Permission.MANAGE_PROJECTS],
  }),
  (q, s, n) => projectsController.getFacultyStatus(q, s, n)
);

// ======================================================
// PROJECT DECISIONS
// Supports permanent role permissions and
// temporary permissions.
// ======================================================

router.post(
  '/:poolId/projects/:projectId/approve',
  authorizeAccess({
    permissions: [Permission.APPROVE_PROJECTS],
  }),
  (q, s, n) => projectsController.approve(q, s, n)
);

router.post(
  '/:poolId/projects/:projectId/reject',
  authorizeAccess({
    permissions: [Permission.REJECT_PROJECTS],
  }),
  (q, s, n) => projectsController.reject(q, s, n)
);

router.post(
  '/:poolId/projects/approve-all-locked',
  authorizeAccess({
    permissions: [Permission.APPROVE_PROJECTS],
  }),
  (q, s, n) => projectsController.approveAllLocked(q, s, n)
);

router.get(
  '/:poolId/projects/on-hold',
  authorizeAccess({
    permissions: [Permission.MANAGE_PROJECTS],
  }),
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