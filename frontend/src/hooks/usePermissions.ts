import { useAuthStore } from '@/stores/authStore';
import {
  rolePermissions,
} from '@/shared/permissions';

import type {
  Permission,
} from '@/types';

export const usePermissions = () => {
  const user = useAuthStore(
    (state) => state.user
  );

  const hasPermission = (
    permission: Permission
  ): boolean => {
    if (!user) {
      return false;
    }

    // ADMIN has unrestricted access
    if (user.role === 'ADMIN') {
      return true;
    }

    // Permanent role permission
    const permanentPermission =
      rolePermissions[user.role]?.includes(
        permission
      );

    if (permanentPermission) {
      return true;
    }

    // Temporary permission
    const temporaryPermission =
      user.temporaryPermissions?.some(
        (item) =>
          item.permission === permission &&
          new Date(item.startsAt) <= new Date() &&
          new Date(item.expiresAt) > new Date() &&
          item.revokedAt === null
      );

    return !!temporaryPermission;
  };

  const hasAnyPermission = (
    permissions: Permission[]
  ) => {
    return permissions.some(
      hasPermission
    );
  };

  const hasAllPermissions = (
    permissions: Permission[]
  ) => {
    return permissions.every(
      hasPermission
    );
  };

  return {
    user,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
};