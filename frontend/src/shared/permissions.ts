import type {
  Permission,
  UserRole,
} from '@/types';

export const rolePermissions: Record<
  UserRole,
  Permission[]
> = {
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