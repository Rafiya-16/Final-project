// frontend/src/components/layout/Sidebar.tsx

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

import { useAuthStore } from '@/stores/authStore';
import { hasPermission } from '@/lib/rbac';

import type { Permission, UserRole } from '@/types';

import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  Bell,
  GraduationCap,
  BookOpen,
  ClipboardList,
  Lightbulb,
  UserCheck,
  BarChart3,
  Shield,
  LogOut,
  User,
  Sparkles,
} from 'lucide-react';

import { cn } from '@/lib/utils';


// ======================================================
// TYPES
// ======================================================

type NavItem = {
  label: string;
  path: string;
  icon: React.ReactNode;
  permission?: Permission;
};


// ======================================================
// NAVIGATION ITEMS
//
// permission:
// - If omitted -> available to the role
// - If specified -> user must have that permission
//
// hasPermission() checks:
// 1. ADMIN
// 2. Permanent role permission
// 3. Active temporary permission
// ======================================================

const navItems: Record<UserRole, NavItem[]> = {
  // ====================================================
  // ADMIN
  // ====================================================

  ADMIN: [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },

    {
      label: 'Users',
      path: '/users',
      icon: <Users className="w-5 h-5" />,
      permission: 'MANAGE_USERS',
    },

    {
      label: 'Pools',
      path: '/pools',
      icon: <FolderKanban className="w-5 h-5" />,
      permission: 'MANAGE_POOLS',
    },

    {
      label: 'Student Ideas',
      path: '/student-ideas',
      icon: <Lightbulb className="w-5 h-5" />,
    },

    {
      label: 'Reports',
      path: '/reports',
      icon: <BarChart3 className="w-5 h-5" />,
      permission: 'VIEW_REPORTS',
    },

    {
      label: 'Audit Logs',
      path: '/audit',
      icon: <Shield className="w-5 h-5" />,
    },

    {
      label: 'Notifications',
      path: '/notifications',
      icon: <Bell className="w-5 h-5" />,
    },
  ],


  // ====================================================
  // SUBADMIN
  // ====================================================

  SUBADMIN: [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },

    {
      label: 'Review',
      path: '/review',
      icon: <ClipboardList className="w-5 h-5" />,
      permission: 'MANAGE_PROJECTS',
    },

    {
      label: 'Pools',
      path: '/pools',
      icon: <FolderKanban className="w-5 h-5" />,
      permission: 'MANAGE_POOLS',
    },

    {
      label: 'Reports',
      path: '/reports',
      icon: <BarChart3 className="w-5 h-5" />,
      permission: 'VIEW_REPORTS',
    },

    {
      label: 'Notifications',
      path: '/notifications',
      icon: <Bell className="w-5 h-5" />,
    },
  ],


  // ====================================================
  // FACULTY
  // ====================================================

  FACULTY: [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },

    {
      label: 'Create Projects',
      path: '/faculty/proposals',
      icon: <FileText className="w-5 h-5" />,
    },

    {
      label: 'My Projects',
      path: '/my-projects',
      icon: <BookOpen className="w-5 h-5" />,
    },

    {
      label: 'Project Management',
      path: '/faculty/team-management',
      icon: <User className="w-5 h-5" />,
      permission: 'MANAGE_TEAMS',
    },

    {
      label: 'Notifications',
      path: '/notifications',
      icon: <Bell className="w-5 h-5" />,
    },
  ],


  // ====================================================
  // STUDENT
  // ====================================================

  STUDENT: [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },

    {
      label: 'Projects',
      path: '/projects',
      icon: <GraduationCap className="w-5 h-5" />,
    },

    {
      label: 'My Team',
      path: '/my-team',
      icon: <UserCheck className="w-5 h-5" />,
    },

    {
      label: 'Ideas',
      path: '/ideas',
      icon: <Lightbulb className="w-5 h-5" />,
    },

    {
      label: 'Notifications',
      path: '/notifications',
      icon: <Bell className="w-5 h-5" />,
    },
  ],
};


// ======================================================
// ROLE-SPECIFIC COLOR THEMES
// ======================================================

const roleTheme: Record<
  UserRole,
  {
    sidebarBg: string;
    brand: string;
    brandText: string;
    brandSub: string;
    activeLink: string;
    activeLinkText: string;
    avatarBg: string;
    avatarText: string;
    accent: string;
    logoutHover: string;
  }
> = {
  ADMIN: {
    sidebarBg: 'bg-slate-900',

    brand: 'text-white',
    brandText: 'ProjectAlloc',
    brandSub: 'text-slate-400',

    activeLink: 'bg-blue-600/20',
    activeLinkText: 'text-blue-400',

    avatarBg: 'bg-blue-600/20',
    avatarText: 'text-blue-400',

    accent:
      'text-slate-400 hover:bg-slate-800 hover:text-white',

    logoutHover:
      'hover:bg-red-500/10 text-red-400',
  },


  SUBADMIN: {
    sidebarBg: 'bg-amber-950',

    brand: 'text-amber-100',
    brandText: 'ReviewHub',
    brandSub: 'text-amber-500/60',

    activeLink: 'bg-amber-500/15',
    activeLinkText: 'text-amber-400',

    avatarBg: 'bg-amber-500/15',
    avatarText: 'text-amber-400',

    accent:
      'text-amber-400/70 hover:bg-amber-900/50 hover:text-amber-200',

    logoutHover:
      'hover:bg-red-500/10 text-red-400',
  },


  FACULTY: {
    sidebarBg:
      'bg-gradient-to-br from-[#0a0e27] via-[#0f172a] to-[#1a1a3e]',

    brand: 'text-white',
    brandText: 'Faculty Portal',
    brandSub: 'text-blue-400/60',

    activeLink: 'bg-blue-500/15',
    activeLinkText: 'text-blue-400',

    avatarBg: 'bg-blue-500/15',
    avatarText: 'text-blue-400',

    accent:
      'text-blue-300/60 hover:bg-blue-900/40 hover:text-blue-300',

    logoutHover:
      'hover:bg-red-500/10 text-red-400',
  },


  STUDENT: {
    sidebarBg: 'bg-teal-950',

    brand: 'text-teal-100',
    brandText: 'Student Hub',
    brandSub: 'text-teal-500/60',

    activeLink: 'bg-teal-500/15',
    activeLinkText: 'text-teal-400',

    avatarBg: 'bg-teal-500/15',
    avatarText: 'text-teal-400',

    accent:
      'text-teal-400/70 hover:bg-teal-900/50 hover:text-teal-200',

    logoutHover:
      'hover:bg-red-500/10 text-red-400',
  },
};


// ======================================================
// SIDEBAR COMPONENT
// ======================================================

export const Sidebar: React.FC = () => {
  const { user, clearAuth } = useAuthStore();

  const navigate = useNavigate();

  // ----------------------------------------------------
  // Default role
  // ----------------------------------------------------

  const role: UserRole = user?.role ?? 'STUDENT';

  const theme = roleTheme[role];

  // ----------------------------------------------------
  // Get role-specific navigation
  // ----------------------------------------------------

  const allItems = navItems[role] ?? [];

  // ----------------------------------------------------
  // RBAC FILTER
  //
  // Items without permission:
  //   -> visible
  //
  // Items with permission:
  //   -> visible only if user currently has permission
  //
  // hasPermission() automatically handles temporary
  // permission start/end times and revoked permissions.
  // ----------------------------------------------------

  const items = allItems.filter((item) => {
    if (!item.permission) {
      return true;
    }

    return hasPermission(user, item.permission);
  });


  // ====================================================
  // LOGOUT
  // ====================================================

  const handleLogout = () => {
    clearAuth();

    window.location.href = '/login';
  };


  // ====================================================
  // RENDER
  // ====================================================

  return (
    <aside
      className={cn(
        'w-64 h-screen flex flex-col fixed left-0 top-0 z-30',
        'shadow-2xl',
        theme.sidebarBg
      )}
    >

      {/* ==================================================
          BRAND
      ================================================== */}

      <div className="p-6 border-b border-white/5">

        <div className="flex items-center gap-2 mb-1">

          <div className="p-1.5 bg-white/5 rounded-xl">
            <Sparkles className="w-5 h-5 text-blue-400" />
          </div>

          <h1
            className={cn(
              'text-xl font-bold tracking-tight',
              theme.brand
            )}
          >
            {theme.brandText}
          </h1>

        </div>

        <p
          className={cn(
            'text-xs mt-1',
            theme.brandSub
          )}
        >
          {user?.role === 'ADMIN'
            ? 'Administration'
            : user?.role === 'SUBADMIN'
            ? 'SubAdmin Portal'
            : user?.role === 'FACULTY'
            ? 'Faculty Portal'
            : 'Allocation Platform'}
        </p>

      </div>


      {/* ==================================================
          NAVIGATION
      ================================================== */}

      <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">

        {items.map((item) => (

          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3',
                'px-3 py-2.5 rounded-xl',
                'text-sm font-medium',
                'transition-all duration-300',
                'group',

                isActive
                  ? cn(
                      theme.activeLink,
                      theme.activeLinkText,
                      'shadow-md'
                    )
                  : theme.accent
              )
            }
          >

            {/* Icon */}

            <div
              className="
                transition-transform
                duration-200
                group-hover:scale-110
              "
            >
              {item.icon}
            </div>


            {/* Label */}

            <span>
              {item.label}
            </span>


            {/* Notification indicator */}

            {item.label === 'Notifications' && (
              <span
                className="
                  ml-auto
                  w-2
                  h-2
                  bg-red-500
                  rounded-full
                  animate-pulse
                "
              />
            )}

          </NavLink>

        ))}

      </nav>


      {/* ==================================================
          PROFILE + LOGOUT
      ================================================== */}

      <div className="p-4 border-t border-white/5 space-y-2">

        {/* Profile */}

        <button
          onClick={() => navigate('/profile')}
          className={cn(
            'w-full flex items-center gap-3',
            'px-3 py-2.5 text-sm rounded-xl',
            'transition-all duration-300',
            theme.accent,
            'group'
          )}
        >

          {/* Avatar */}

          <div
            className={cn(
              'w-9 h-9 rounded-xl',
              'flex items-center justify-center',
              'font-bold text-sm',
              'backdrop-blur-sm',
              'transition-transform',
              'group-hover:scale-105',

              theme.avatarBg,
              theme.avatarText
            )}
          >
            {user?.firstName?.[0] ?? ''}
            {user?.lastName?.[0] ?? ''}
          </div>


          {/* User information */}

          <div className="flex-1 text-left min-w-0">

            <p
              className="
                font-semibold
                text-white/90
                truncate
                text-sm
              "
            >
              {user?.firstName ?? 'User'}{' '}
              {user?.lastName ?? ''}
            </p>

            <p className="text-xs text-white/50">
              {user?.role ?? 'STUDENT'}
            </p>

          </div>

        </button>


        {/* Logout */}

        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-2',
            'px-3 py-2 text-sm rounded-xl',
            'transition-all duration-300',
            theme.logoutHover
          )}
        >
          <LogOut className="w-4 h-4" />

          Logout
        </button>

      </div>

    </aside>
  );
};