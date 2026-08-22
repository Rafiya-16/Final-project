import { useAuthStore } from '@/stores/authStore';
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
} from '@/lib/rbac';

import type { Permission } from '@/lib/rbac';

export const useRBAC = () => {
  const user = useAuthStore((state) => state.user);

  return {
    user,

    role: user?.role ?? null,

    isAdmin: user?.role === 'ADMIN',
    isSubAdmin: user?.role === 'SUBADMIN',
    isFaculty: user?.role === 'FACULTY',
    isStudent: user?.role === 'STUDENT',

    hasPermission: (permission: Permission) =>
      hasPermission(user, permission),

    hasAllPermissions: (permissions: Permission[]) =>
      hasAllPermissions(user, permissions),

    hasAnyPermission: (permissions: Permission[]) =>
      hasAnyPermission(user, permissions),
  };
};