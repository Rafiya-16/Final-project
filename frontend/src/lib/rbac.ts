import type { UserRole } from '@/types';

export type Permission =
  | 'MANAGE_USERS'
  | 'MANAGE_POOLS'
  | 'MANAGE_PROJECTS'
  | 'APPROVE_PROJECTS'
  | 'REJECT_PROJECTS'
  | 'PUBLISH_PROJECTS'
  | 'ASSIGN_SUPERVISORS'
  | 'MANAGE_TEAMS'
  | 'VIEW_REPORTS';

export const rolePermissions: Record<UserRole, Permission[]> = {
  ADMIN: [
    'MANAGE_USERS',
    'MANAGE_POOLS',
    'MANAGE_PROJECTS',
    'APPROVE_PROJECTS',
    'REJECT_PROJECTS',
    'PUBLISH_PROJECTS',
    'ASSIGN_SUPERVISORS',
    'MANAGE_TEAMS',
    'VIEW_REPORTS',
  ],

  SUBADMIN: [
    'MANAGE_PROJECTS',
    'APPROVE_PROJECTS',
    'REJECT_PROJECTS',
    'PUBLISH_PROJECTS',
    'ASSIGN_SUPERVISORS',
    'MANAGE_TEAMS',
    'VIEW_REPORTS',
  ],

  FACULTY: [
    'MANAGE_TEAMS',
  ],

  STUDENT: [],
};

/**
 * Check whether the user has a permission.
 *
 * ADMIN automatically has every permission.
 *
 * Temporary permissions are expected to be stored on
 * user.temporaryPermissions.
 */
export function hasPermission(
  user: {
    role: UserRole;
    temporaryPermissions?: Array<{
      permission: Permission | string;
      startsAt?: string;
      expiresAt?: string;
      revokedAt?: string | null;
    }>;
  } | null | undefined,
  permission: Permission
): boolean {
  if (!user) {
    return false;
  }

  // ADMIN has unrestricted access.
  if (user.role === 'ADMIN') {
    return true;
  }

  // Permanent role permission.
  if (rolePermissions[user.role]?.includes(permission)) {
    return true;
  }

  // Temporary permission.
  const now = new Date();

  return (
    user.temporaryPermissions?.some((item) => {
      if (item.permission !== permission) {
        return false;
      }

      if (item.revokedAt) {
        return false;
      }

      const startsAt = item.startsAt
        ? new Date(item.startsAt)
        : null;

      const expiresAt = item.expiresAt
        ? new Date(item.expiresAt)
        : null;

      if (!startsAt || !expiresAt) {
        return false;
      }

      return startsAt <= now && expiresAt > now;
    }) ?? false
  );
}

/**
 * Check whether the user has ALL requested permissions.
 */
export function hasAllPermissions(
  user: {
    role: UserRole;
    temporaryPermissions?: Array<{
      permission: Permission | string;
      startsAt?: string;
      expiresAt?: string;
      revokedAt?: string | null;
    }>;
  } | null | undefined,
  permissions: Permission[]
): boolean {
  return permissions.every((permission) =>
    hasPermission(user, permission)
  );
}

/**
 * Check whether the user has AT LEAST ONE requested permission.
 */
export function hasAnyPermission(
  user: {
    role: UserRole;
    temporaryPermissions?: Array<{
      permission: Permission | string;
      startsAt?: string;
      expiresAt?: string;
      revokedAt?: string | null;
    }>;
  } | null | undefined,
  permissions: Permission[]
): boolean {
  return permissions.some((permission) =>
    hasPermission(user, permission)
  );
}