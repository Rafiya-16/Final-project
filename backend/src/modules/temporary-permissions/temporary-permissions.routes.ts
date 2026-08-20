import { Router } from 'express';
import { UserRole } from '@prisma/client';

import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validateRequest } from '../../middleware/validateRequest';

import {
  createTemporaryPermissionSchema,
} from './temporary-permissions.validation';

import {
  temporaryPermissionsController,
} from './temporary-permissions.controller';

const router = Router();

router.use(authenticate);

/**
 * Get all temporary permissions
 * Admin only
 */
router.get(
  '/',
  authorize(UserRole.ADMIN),
  temporaryPermissionsController.list
);

/**
 * Get temporary permissions for a user
 * Admin only
 */
router.get(
  '/user/:userId',
  authorize(UserRole.ADMIN),
  temporaryPermissionsController.listForUser
);

/**
 * Grant temporary permission
 * Admin only
 */
router.post(
  '/',
  authorize(UserRole.ADMIN),
  validateRequest(createTemporaryPermissionSchema),
  temporaryPermissionsController.create
);

/**
 * Manually revoke permission
 * Admin only
 */
router.delete(
  '/:id',
  authorize(UserRole.ADMIN),
  temporaryPermissionsController.revoke
);

export default router;