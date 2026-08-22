import { Router } from 'express';
import multer from 'multer';
import { Permission } from '@prisma/client';

import { usersController } from './users.controller';

import { authenticate } from '../../middleware/authenticate';
import { authorizeAccess } from '../../middleware/authorizeAccess';
import { validateRequest } from '../../middleware/validateRequest';

import {
  createUserSchema,
  listUsersSchema,
  updateUserSchema,
} from './users.validation';

import { IMPORT_LIMITS } from '../../config/constants';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: IMPORT_LIMITS.MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_r, file, cb) => {
    file.originalname.endsWith('.csv')
      ? cb(null, true)
      : cb(new Error('Only CSV'));
  },
});

const router = Router();

router.use(authenticate);

// ======================================================
// USER MANAGEMENT ACCESS
//
// Supports:
// - ADMIN
// - permanent MANAGE_USERS permission
// - active temporary MANAGE_USERS permission
// ======================================================

const manageUsers = authorizeAccess({
  permissions: [Permission.MANAGE_USERS],
});

// ======================================================
// USER STATISTICS / IMPORT
// ======================================================

router.get(
  '/stats',
  manageUsers,
  (q, s, n) => usersController.getStats(q, s, n),
);

router.get(
  '/import/template',
  manageUsers,
  (q, s, n) => usersController.downloadTemplate(q, s, n),
);

router.get(
  '/import/jobs',
  manageUsers,
  (q, s, n) => usersController.getImportHistory(q, s, n),
);

router.get(
  '/import/jobs/:jobId',
  manageUsers,
  (q, s, n) => usersController.getImportJob(q, s, n),
);

router.post(
  '/bulk-import',
  manageUsers,
  upload.single('file'),
  (q, s, n) => usersController.bulkImport(q, s, n),
);

// ======================================================
// READ ACCESS
//
// Any authenticated user can list/view users.
// This is required for things such as finding teammates.
// ======================================================

router.get(
  '/',
  validateRequest(listUsersSchema),
  (q, s, n) => usersController.listUsers(q, s, n),
);

router.get(
  '/:id',
  (q, s, n) => usersController.getUserById(q, s, n),
);

// ======================================================
// USER MUTATIONS
// ======================================================

router.post(
  '/',
  manageUsers,
  validateRequest(createUserSchema),
  (q, s, n) => usersController.createUser(q, s, n),
);

router.put(
  '/:id',
  manageUsers,
  validateRequest(updateUserSchema),
  (q, s, n) => usersController.updateUser(q, s, n),
);

router.patch(
  '/:id/toggle-status',
  manageUsers,
  (q, s, n) => usersController.toggleStatus(q, s, n),
);

router.post(
  '/:id/reset-password',
  manageUsers,
  (q, s, n) => usersController.resetPassword(q, s, n),
);

export default router;