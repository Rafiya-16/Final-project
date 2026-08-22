import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  roles?: UserRole[];
  permissions?: string[];
}

const rolePermissions: Record<UserRole, string[]> = {
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

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  roles,
  permissions,
}) => {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  // Not logged in
  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  // ADMIN has unrestricted access
  if (user.role === 'ADMIN') {
    return <Outlet />;
  }

  // Check explicit roles
  if (roles && roles.length > 0) {
    if (!roles.includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Check permissions
  if (permissions && permissions.length > 0) {
    const permanentPermissions =
      rolePermissions[user.role] || [];

    const temporaryPermissions =
      user.temporaryPermissions || [];

    const hasPermission = permissions.some((permission) => {
      // Permanent role permission
      if (permanentPermissions.includes(permission)) {
        return true;
      }

      // Temporary permission
      return temporaryPermissions.some((temp: any) => {
        if (typeof temp === 'string') {
          return temp === permission;
        }

        return (
          temp.permission === permission &&
          new Date(temp.startsAt) <= new Date() &&
          new Date(temp.expiresAt) > new Date() &&
          !temp.revokedAt
        );
      });
    });

    if (!hasPermission) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
};