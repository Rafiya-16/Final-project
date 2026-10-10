// backend/src/modules/teams/teams.routes.ts

import { Router } from 'express';

import { teamsController } from './teams.controller';

import { authenticate } from '../../middleware/authenticate';

import { authorize } from '../../middleware/authorize';

import { validateRequest } from '../../middleware/validateRequest';

import {
  createTeamSchema,
  inviteSchema,
  respondInviteSchema,
  selectProjectSchema,
} from './teams.validation';

const router = Router();

router.use(authenticate);

// ============================================================
// Student team operations
// ============================================================

router.post(
  '/:poolId/teams',
  authorize('STUDENT'),
  validateRequest(createTeamSchema),
  (q, s, n) => teamsController.create(q, s, n)
);

router.get(
  '/:poolId/my-team',
  authorize('STUDENT'),
  (q, s, n) => teamsController.getMyTeam(q, s, n)
);

router.get(
  '/:poolId/my-invites',
  authorize('STUDENT'),
  (q, s, n) => teamsController.getMyInvites(q, s, n)
);

router.post(
  '/:poolId/teams/:teamId/invite',
  authorize('STUDENT'),
  validateRequest(inviteSchema),
  (q, s, n) => teamsController.invite(q, s, n)
);

router.post(
  '/:poolId/invites/:inviteId/respond',
  authorize('STUDENT'),
  validateRequest(respondInviteSchema),
  (q, s, n) => teamsController.respond(q, s, n)
);

router.post(
  '/:poolId/teams/:teamId/select-project',
  authorize('STUDENT'),
  validateRequest(selectProjectSchema),
  (q, s, n) => teamsController.selectProject(q, s, n)
);

// ============================================================
// Team Leave Request
// ============================================================

// Student submits a leave request.
// Student is NOT removed immediately.
// Actual removal happens only after faculty approval.
router.post(
  '/:poolId/teams/:teamId/leave-request',
  authorize('STUDENT'),
  (q, s, n) => teamsController.createLeaveRequest(q, s, n)
);

// Legacy direct leave route.
// The service blocks direct leaving and requires
// a supervisor-approved leave request instead.
router.post(
  '/:poolId/teams/:teamId/leave',
  authorize('STUDENT'),
  (q, s, n) => teamsController.leave(q, s, n)
);

// ============================================================
// Faculty Leave Request Management
// ============================================================

// IMPORTANT:
// This uses two path segments after /pools:
// /team/leave-requests
//
// This prevents collision with poolRoutes:
// /:id
router.get(
  '/team/leave-requests',
  authorize('FACULTY'),
  (q, s, n) => teamsController.getLeaveRequestsForFaculty(q, s, n)
);

// Faculty approves or rejects a leave request.
router.patch(
  '/team/leave-requests/:requestId',
  authorize('FACULTY'),
  (q, s, n) => teamsController.reviewLeaveRequest(q, s, n)
);

// ============================================================
// Team Dissolve Request
// ============================================================

// Team Leader submits a dissolve request.
// Team is NOT dissolved immediately.
// Supervisor must approve the request first.
router.post(
  '/:poolId/teams/:teamId/dissolve-request',
  authorize('STUDENT'),
  (q, s, n) => teamsController.createDissolveRequest(q, s, n)
);

// ============================================================
// Faculty Dissolve Request Management
// ============================================================

// Faculty gets dissolve requests for their supervised projects.
router.get(
  '/team/dissolve-requests',
  authorize('FACULTY'),
  (q, s, n) => teamsController.getDissolveRequestsForFaculty(q, s, n)
);

// Faculty approves or rejects a dissolve request.
router.patch(
  '/team/dissolve-requests/:requestId',
  authorize('FACULTY'),
  (q, s, n) => teamsController.reviewDissolveRequest(q, s, n)
);

// ============================================================
// Other student team operations
// ============================================================

router.delete(
  '/:poolId/teams/:teamId/members/:memberId',
  authorize('STUDENT'),
  (q, s, n) => teamsController.removeMember(q, s, n)
);

router.post(
  '/:poolId/teams/:teamId/dissolve',
  authorize('STUDENT'),
  (q, s, n) => teamsController.dissolve(q, s, n)
);

// ============================================================
// Team Dissolve Request
// ============================================================

// Student leader submits dissolve request.
router.post(
  '/:poolId/teams/:teamId/dissolve',
  authorize('STUDENT'),
  (q, s, n) => teamsController.dissolve(q, s, n)
);

// Faculty → Get dissolve requests
router.get(
  '/team/dissolve-requests',
  authorize('FACULTY'),
  (q, s, n) =>
    teamsController.getDissolveRequestsForFaculty(q, s, n)
);

// Faculty → Approve / Reject dissolve request
router.patch(
  '/team/dissolve-requests/:requestId',
  authorize('FACULTY'),
  (q, s, n) =>
    teamsController.reviewDissolveRequest(q, s, n)
);

// ============================================================
// Admin / Subadmin / Faculty
// ============================================================

router.get(
  '/:poolId/teams',
  authorize('ADMIN', 'SUBADMIN', 'FACULTY'),
  (q, s, n) => teamsController.listByPool(q, s, n)
);

export default router;