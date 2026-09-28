// frontend/src/components/layout/Sidebar.tsx

import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

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
  ListChecks,
  Shield,
  LogOut,
  User,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';

import { cn } from '@/lib/utils';

type NavItem = {
  label: string;
  path: string;
  icon: React.ReactNode;
  notice?: boolean;
};

const navItems: Record<string, NavItem[]> = {
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
    },
    {
      label: 'Pools',
      path: '/pools',
      icon: <FolderKanban className="w-5 h-5" />,
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
    },
    {
      label: 'Pools',
      path: '/pools',
      icon: <FolderKanban className="w-5 h-5" />,
    },
    {
      label: 'Reports',
      path: '/reports',
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      label: 'Notifications',
      path: '/notifications',
      icon: <Bell className="w-5 h-5" />,
    },
  ],

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
    },
    {
      label: 'Notifications',
      path: '/notifications',
      icon: <Bell className="w-5 h-5" />,
    },
  ],

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
      label: 'What To Do',
      path: '/what-to-do',
      icon: <ListChecks className="w-5 h-5" />,
      notice: true,
    },
    {
      label: 'Notifications',
      path: '/notifications',
      icon: <Bell className="w-5 h-5" />,
    },
  ],
};

export const Sidebar: React.FC = () => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] =
    useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);

    return () =>
      window.removeEventListener('resize', handleResize);
  }, []);

  const items =
    navItems[user?.role || 'STUDENT'] || [];

  const role = user?.role || 'STUDENT';

  const isStudent = role === 'STUDENT';

  const roleConfig = {
    ADMIN: {
      accent: 'blue',
      lightIcon: 'text-blue-600',
      darkIcon: 'text-blue-400',
      lightActive:
        'bg-blue-50 text-blue-700 border-blue-100',
      darkActive:
        'bg-blue-500/10 text-blue-300 border-blue-500/10',
    },

    SUBADMIN: {
      accent: 'amber',
      lightIcon: 'text-amber-600',
      darkIcon: 'text-amber-400',
      lightActive:
        'bg-amber-50 text-amber-700 border-amber-100',
      darkActive:
        'bg-amber-500/10 text-amber-300 border-amber-500/10',
    },

    FACULTY: {
      accent: 'violet',
      lightIcon: 'text-violet-600',
      darkIcon: 'text-violet-400',
      lightActive:
        'bg-violet-50 text-violet-700 border-violet-100',
      darkActive:
        'bg-violet-500/10 text-violet-300 border-violet-500/10',
    },

    STUDENT: {
      accent: 'teal',
      lightIcon: 'text-teal-600',
      darkIcon: 'text-teal-400',
      lightActive:
        'bg-teal-50 text-teal-700 border-teal-100',
      darkActive:
        'bg-teal-500/10 text-teal-300 border-teal-500/10',
    },
  }[role as 'ADMIN' | 'SUBADMIN' | 'FACULTY' | 'STUDENT'];

  return (
    <>
      {/* =====================================================
          MOBILE MENU BUTTON
      ===================================================== */}
      <button
        onClick={() =>
          setIsMobileMenuOpen(!isMobileMenuOpen)
        }
        className="
          fixed top-4 left-4 z-50
          p-2.5 rounded-xl
          bg-white dark:bg-slate-800
          border border-cream-300 dark:border-slate-700
          text-stone-700 dark:text-white
          shadow-lg
          md:hidden
          transition-all duration-300
        "
        aria-label="Toggle navigation menu"
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </button>

      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}
      {isMobileMenuOpen && (
        <div
          className="
            fixed inset-0
            bg-black/40 dark:bg-black/60
            backdrop-blur-sm
            z-40 md:hidden
          "
          onClick={() =>
            setIsMobileMenuOpen(false)
          }
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}
      <aside
        className={`
          fixed left-0 top-0
          h-screen w-64
          flex flex-col
          z-40

          bg-white
          dark:bg-slate-950

          border-r
          border-cream-300
          dark:border-slate-800

          shadow-xl
          dark:shadow-black/30

          transition-all duration-500
          ${isMobileMenuOpen
            ? 'translate-x-0'
            : '-translate-x-full'}
          md:translate-x-0
        `}
      >

        {/* ===================================================
            BRAND
        =================================================== */}
        <div
          className="
            p-6
            border-b
            border-cream-200
            dark:border-slate-800
          "
        >
          <div className="flex items-center gap-3">

            <div
              className={`
                p-2 rounded-xl
                bg-${roleConfig.accent}-50
                dark:bg-${roleConfig.accent}-500/10
                border
                border-${roleConfig.accent}-100
                dark:border-${roleConfig.accent}-500/10
              `}
            >
              <Sparkles
                className={`
                  w-5 h-5
                  ${roleConfig.lightIcon}
                  dark:${roleConfig.darkIcon.replace(
                    'text-',
                    'text-'
                  )}
                `}
              />
            </div>

            <h1
              className="
                text-xl font-bold
                tracking-tight
                text-stone-900
                dark:text-white
              "
            >
              ProjectAlloc
            </h1>

          </div>

          <p
            className="
              text-xs mt-2
              text-stone-400
              dark:text-slate-500
            "
          >
            {role === 'ADMIN'
              ? 'Administration'
              : role === 'FACULTY'
                ? 'Faculty Portal'
                : role === 'SUBADMIN'
                  ? 'Review Hub'
                  : 'Student Hub'}
          </p>
        </div>

        {/* ===================================================
            NAVIGATION
        =================================================== */}
        <nav
          className="
            flex-1
            py-6 px-3
            space-y-1.5
            overflow-y-auto
          "
        >
          {items.map((item) => {

            {/* Special Student Notice */}
            if (
              isStudent &&
              item.notice
            ) {
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() =>
                    setIsMobileMenuOpen(false)
                  }
                  className={({ isActive }) =>
                    cn(
                      `
                        relative
                        flex items-center gap-3
                        px-3 py-3
                        rounded-xl
                        text-sm font-medium
                        border
                        transition-all duration-300
                        overflow-hidden
                      `,
                      isActive
                        ? `
                          ${roleConfig.lightActive}
                          dark:${roleConfig.darkActive}
                          shadow-sm
                        `
                        : `
                          border-transparent
                          text-stone-500
                          dark:text-slate-400
                          hover:bg-cream-100
                          dark:hover:bg-slate-800
                          hover:text-stone-900
                          dark:hover:text-white
                        `
                    )
                  }
                >
                  <div className="transition-transform duration-300 group-hover:scale-110">
                    <ListChecks className="w-5 h-5 animate-pulse" />
                  </div>

                  <span className="flex-1 text-left">
                    {item.label}
                  </span>

                  <span
                    className="
                      text-[8px]
                      font-bold
                      bg-red-500
                      text-white
                      px-2 py-1
                      rounded-full
                      animate-pulse
                    "
                  >
                    MUST READ
                  </span>
                </NavLink>
              );
            }

            {/* Normal Navigation */}
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() =>
                  setIsMobileMenuOpen(false)
                }
                className={({ isActive }) =>
                  cn(
                    `
                      flex items-center gap-3
                      px-3 py-3
                      rounded-xl
                      text-sm font-medium
                      border
                      transition-all duration-300
                      group
                    `,
                    isActive
                      ? `
                        ${roleConfig.lightActive}
                        dark:${roleConfig.darkActive}
                        shadow-sm
                      `
                      : `
                        border-transparent
                        text-stone-500
                        dark:text-slate-400
                        hover:bg-cream-100
                        dark:hover:bg-slate-800
                        hover:text-stone-900
                        dark:hover:text-white
                      `
                  )
                }
              >
                <div
                  className="
                    transition-transform
                    duration-300
                    group-hover:scale-110
                  "
                >
                  {item.icon}
                </div>

                <span>{item.label}</span>

                {item.label === 'Notifications' && (
                  <span
                    className="
                      ml-auto
                      w-2 h-2
                      rounded-full
                      bg-red-500
                      animate-pulse
                    "
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* ===================================================
            PROFILE + LOGOUT
        =================================================== */}
        <div
          className="
            p-4
            border-t
            border-cream-200
            dark:border-slate-800
            space-y-2
          "
        >
          <button
            onClick={() => {
              navigate('/profile');
              setIsMobileMenuOpen(false);
            }}
            className="
              w-full
              flex items-center gap-3
              px-3 py-3
              rounded-xl
              text-left
              bg-cream-50
              dark:bg-slate-900
              border
              border-cream-200
              dark:border-slate-800
              hover:bg-cream-100
              dark:hover:bg-slate-800
              transition-all duration-300
              group
            "
          >
            <div
              className={`
                w-10 h-10
                rounded-xl
                flex items-center justify-center
                font-bold text-sm
                bg-${roleConfig.accent}-50
                dark:bg-${roleConfig.accent}-500/10
                ${roleConfig.lightIcon}
                dark:${roleConfig.darkIcon.replace(
                  'text-',
                  'text-'
                )}
                transition-transform
                group-hover:scale-105
              `}
            >
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>

            <div className="flex-1 min-w-0">
              <p
                className="
                  font-semibold
                  text-stone-800
                  dark:text-white
                  truncate
                  text-sm
                "
              >
                {user?.firstName} {user?.lastName}
              </p>

              <p
                className="
                  text-xs
                  text-stone-400
                  dark:text-slate-500
                  mt-0.5
                "
              >
                {user?.role}
              </p>
            </div>

            <User className="w-4 h-4 text-stone-400 dark:text-slate-500" />
          </button>

          <button
            onClick={() => {
              clearAuth();
              window.location.href = '/login';
            }}
            className="
              w-full
              flex items-center gap-2
              px-3 py-2.5
              rounded-xl
              text-sm
              text-red-500
              dark:text-red-400
              hover:bg-red-50
              dark:hover:bg-red-500/10
              transition-all duration-300
            "
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Desktop spacer */}
      <div className="hidden md:block w-64 flex-shrink-0" />
    </>
  );
};

export default Sidebar;