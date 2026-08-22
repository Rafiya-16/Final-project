import { Router } from "express";
import { Permission } from "@prisma/client";

import { poolsController } from "./pools.controller";

import { authenticate } from "../../middleware/authenticate";
import { authorizeAccess } from "../../middleware/authorizeAccess";
import { validateRequest } from "../../middleware/validateRequest";

import {
  createPoolSchema,
  updatePoolSchema,
  assignUsersSchema,
} from "./pools.validation";

const router = Router();

router.use(authenticate);

// ======================================================
// READ ACCESS
// ======================================================

router.get("/", (q, s, n) =>
  poolsController.list(q, s, n),
);

router.get("/:id", (q, s, n) =>
  poolsController.getById(q, s, n),
);

router.get("/:id/stats", (q, s, n) =>
  poolsController.getStats(q, s, n),
);

// ======================================================
// POOL MANAGEMENT
//
// Supports:
// - ADMIN
// - users with permanent MANAGE_POOLS permission
// - users with active temporary MANAGE_POOLS permission
// ======================================================

router.post(
  "/",
  authorizeAccess({
    permissions: [Permission.MANAGE_POOLS],
  }),
  validateRequest(createPoolSchema),
  (q, s, n) => poolsController.create(q, s, n),
);

router.put(
  "/:id",
  authorizeAccess({
    permissions: [Permission.MANAGE_POOLS],
  }),
  validateRequest(updatePoolSchema),
  (q, s, n) => poolsController.update(q, s, n),
);

router.post(
  "/:id/activate",
  authorizeAccess({
    permissions: [Permission.MANAGE_POOLS],
  }),
  (q, s, n) => poolsController.activate(q, s, n),
);

router.post(
  "/:id/advance-phase",
  authorizeAccess({
    permissions: [Permission.MANAGE_POOLS],
  }),
  (q, s, n) => poolsController.advancePhase(q, s, n),
);

router.post(
  "/:id/freeze",
  authorizeAccess({
    permissions: [Permission.MANAGE_POOLS],
  }),
  (q, s, n) => poolsController.freeze(q, s, n),
);

router.post(
  "/:id/archive",
  authorizeAccess({
    permissions: [Permission.MANAGE_POOLS],
  }),
  (q, s, n) => poolsController.archive(q, s, n),
);

router.post(
  "/:id/restore",
  authorizeAccess({
    permissions: [Permission.MANAGE_POOLS],
  }),
  (q, s, n) => poolsController.restore(q, s, n),
);

// ======================================================
// ADD / ASSIGN EXISTING MEMBERS
//
// Supports adding existing SubAdmins, Faculty and
// Students to an already-created pool.
// ======================================================

router.post(
  "/:id/assign-users",
  authorizeAccess({
    permissions: [Permission.MANAGE_POOLS],
  }),
  validateRequest(assignUsersSchema),
  (q, s, n) => poolsController.assignUsers(q, s, n),
);

export default router;