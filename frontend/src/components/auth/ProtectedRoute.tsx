import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  roles?: UserRole[];
  permissions?: string[];
}

const rolePermissions: Record<UserRole, string[]> = {
  ADMIN: ['MANAGE_USERS','MANAGE_POOLS','MANAGE_PROJECTS','APPROVE_PROJECTS','REJECT_PROJECTS','PUBLISH_PROJECTS','ASSIGN_SUPERVISORS','MANAGE_TEAMS','VIEW_REPORTS'],
  SUBADMIN: ['MANAGE_PROJECTS','APPROVE_PROJECTS','REJECT_PROJECTS','PUBLISH_PROJECTS','ASSIGN_SUPERVISORS','MANAGE_TEAMS','VIEW_REPORTS'],
  FACULTY: ['MANAGE_TEAMS'],
  STUDENT: [],
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ roles, permissions }) => {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Explicit role restrictions must be exact. ADMIN is not silently allowed
  // into a route intended only for another role.
  if (roles?.length && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (permissions?.length) {
    // ADMIN has every permission, but only after any explicit role check above.
    if (user.role !== 'ADMIN') {
      const permanentPermissions = rolePermissions[user.role] || [];
      const temporaryPermissions = user.temporaryPermissions || [];

      const hasPermission = permissions.some((required) =>
        permanentPermissions.includes(required) ||
        temporaryPermissions.some((temp) => {
          if (typeof temp === 'string') return temp === required;
          return temp.permission === required &&
            new Date(temp.startsAt) <= new Date() &&
            new Date(temp.expiresAt) > new Date() &&
            !temp.revokedAt;
        })
      );

      if (!hasPermission) return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
};
