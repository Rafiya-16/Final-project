// frontend/src/components/layout/Sidebar.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useWorkplaceStore } from '@/stores/workplaceStore';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  Bell,
  GraduationCap,
  BookOpen,
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
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { poolService } from '@/services/poolService';
import { ideaService } from '@/services/ideaService';

type NavItem = {
  label: string;
  path: string;
  icon: React.ReactNode;
  notice?: boolean;
  requestBadge?: boolean;
};

const navItems: Record<string, NavItem[]> = {
  ADMIN: [
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Users', path: '/users', icon: <Users className="w-5 h-5" /> },
    { label: 'Pools', path: '/pools', icon: <FolderKanban className="w-5 h-5" /> },
    { label: 'Student Ideas', path: '/student-ideas', icon: <Lightbulb className="w-5 h-5" /> },
    { label: 'Reports', path: '/reports', icon: <BarChart3 className="w-5 h-5" /> },
    { label: 'Audit Logs', path: '/audit', icon: <Shield className="w-5 h-5" /> },
    { label: 'Notifications', path: '/notifications', icon: <Bell className="w-5 h-5" /> },
  ],
  SUBADMIN: [
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Review', path: '/review', icon: <ClipboardList className="w-5 h-5" /> },    { label: 'Pools', path: '/pools', icon: <FolderKanban className="w-5 h-5" /> },
    { label: 'Reports', path: '/reports', icon: <BarChart3 className="w-5 h-5" /> },
    { label: 'Faculty', path: '/faculty', icon: <Users className="w-5 h-5" /> },
    { label: 'Notifications', path: '/notifications', icon: <Bell className="w-5 h-5" /> },
  ],
  FACULTY: [
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Create Projects', path: '/faculty/proposals', icon: <FileText className="w-5 h-5" /> },
    { label: 'My Projects', path: '/my-projects', icon: <BookOpen className="w-5 h-5" /> },
    { label: 'Project Management', path: '/faculty/team-management', icon: <User className="w-5 h-5" /> },
    {
      label: 'Student Proposals',
      path: '/supervision-requests',
      icon: <Lightbulb className="w-5 h-5" />,
      requestBadge: true,
    },
    { label: 'Notifications', path: '/notifications', icon: <Bell className="w-5 h-5" /> },
  ],
  STUDENT: [
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Projects', path: '/projects', icon: <GraduationCap className="w-5 h-5" /> },
    { label: 'My Team', path: '/my-team', icon: <UserCheck className="w-5 h-5" /> },
    { label: 'Ideas', path: '/ideas', icon: <Lightbulb className="w-5 h-5" /> },
    { label: 'What To Do', path: '/what-to-do', icon: <ListChecks className="w-5 h-5" />, notice: true },
    { label: 'Notifications', path: '/notifications', icon: <Bell className="w-5 h-5" /> },
  ],
};

const roleConfig = {
  ADMIN: {
    lightIcon: 'text-blue-600',
    darkIcon: 'dark:text-blue-400',
    lightActive: 'bg-blue-50 text-blue-700 border-blue-100',
    darkActive: 'dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/10',
    brandGlow: 'bg-blue-50 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/10',
  },
  SUBADMIN: {
    lightIcon: 'text-amber-600',
    darkIcon: 'dark:text-amber-400',
    lightActive: 'bg-amber-50 text-amber-700 border-amber-100',
    darkActive: 'dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/10',
    brandGlow: 'bg-amber-50 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/10',
  },
  FACULTY: {
    lightIcon: 'text-violet-600',
    darkIcon: 'dark:text-violet-400',
    lightActive: 'bg-violet-50 text-violet-700 border-violet-100',
    darkActive: 'dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/10',
    brandGlow: 'bg-violet-50 border-violet-100 dark:bg-violet-500/10 dark:border-violet-500/10',
  },
  STUDENT: {
    lightIcon: 'text-teal-600',
    darkIcon: 'dark:text-teal-400',
    lightActive: 'bg-teal-50 text-teal-700 border-teal-100',
    darkActive: 'dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/10',
    brandGlow: 'bg-teal-50 border-teal-100 dark:bg-teal-500/10 dark:border-teal-500/10',
  },
};

export const Sidebar: React.FC = () => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const {
    activeWorkplace,
    hasSubadminAccess,
    setWorkplace,
    setHasSubadminAccess,
    resetWorkplace,
  } = useWorkplaceStore();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [supervisionRequestCount, setSupervisionRequestCount] = useState(0);
  const [checkingSubadminAccess, setCheckingSubadminAccess] = useState(false);

  const checkSubadminAccess = useCallback(async () => {
    if (!user || user.role !== 'FACULTY') {
      setHasSubadminAccess(false);
      return;
    }

    setCheckingSubadminAccess(true);

    try {
      const poolResponse = await poolService.list(1, 'subadmin');
      const pools = poolResponse?.data || [];

      if (!Array.isArray(pools) || pools.length === 0) {
        setHasSubadminAccess(false);
        setWorkplace('FACULTY');
        return;
      }

      let foundSubadminAccess = false;

      for (const pool of pools) {
        try {
          const details = await poolService.getById(pool.id);
          const subadmins = details?.subadmins || [];

          if (
            Array.isArray(subadmins) &&
            subadmins.some(
              (item: any) =>
                item?.subadmin?.id === user.id ||
                item?.subadminId === user.id,
            )
          ) {
            foundSubadminAccess = true;
            break;
          }
        } catch {
          continue;
        }
      }

      setHasSubadminAccess(foundSubadminAccess);

      if (!foundSubadminAccess) {
        setWorkplace('FACULTY');
      }
    } catch {
      setHasSubadminAccess(false);
      setWorkplace('FACULTY');
    } finally {
      setCheckingSubadminAccess(false);
    }
  }, [user, setHasSubadminAccess, setWorkplace]);

  useEffect(() => {
    if (user?.role === 'FACULTY') {
      void checkSubadminAccess();
    } else {
      setHasSubadminAccess(false);
    }
  }, [user?.id, user?.role, checkSubadminAccess, setHasSubadminAccess]);

  const loadSupervisionRequestCount = useCallback(async () => {
    if (user?.role !== 'FACULTY') {
      setSupervisionRequestCount(0);
      return;
    }

    try {
      const poolResponse = await poolService.list(1, 'faculty');
      const pools = poolResponse?.data || [];

      if (!Array.isArray(pools) || pools.length === 0) {
        setSupervisionRequestCount(0);
        return;
      }

      let pendingCount = 0;

      for (const pool of pools) {
        try {
          const requests = await ideaService.getSupervisionRequests(pool.id);

          if (Array.isArray(requests)) {
            pendingCount += requests.filter(
              (request: any) =>
                request?.responseStatus === 'PENDING' ||
                request?.status === 'PENDING',
            ).length;
          }
        } catch {
          continue;
        }
      }

      setSupervisionRequestCount(pendingCount);
    } catch {
      setSupervisionRequestCount(0);
    }
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== 'FACULTY') {
      return;
    }

    void loadSupervisionRequestCount();

    const interval = window.setInterval(() => {
      void loadSupervisionRequestCount();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [user?.role, loadSupervisionRequestCount]);

  useEffect(() => {
    if (user?.role !== 'FACULTY') {
      return;
    }

    const handleFocus = () => {
      void loadSupervisionRequestCount();
      void checkSubadminAccess();
    };

    window.addEventListener('focus', handleFocus);

    return () => window.removeEventListener('focus', handleFocus);
  }, [user?.role, loadSupervisionRequestCount, checkSubadminAccess]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const role = user?.role || 'STUDENT';
  const isFaculty = role === 'FACULTY';
  const isStudent = role === 'STUDENT';
  const isAdmin = role === 'ADMIN';
  const isGlobalSubadmin = role === 'SUBADMIN';

  const isSubadminWorkplace =
    isFaculty && hasSubadminAccess && activeWorkplace === 'SUBADMIN';

  const effectiveRole = isSubadminWorkplace ? 'SUBADMIN' : role;
  const items = navItems[effectiveRole] || [];
  const theme =
    roleConfig[effectiveRole as keyof typeof roleConfig] || roleConfig.STUDENT;

  const switchWorkplace = (workplace: 'FACULTY' | 'SUBADMIN') => {
    if (workplace === 'SUBADMIN' && !hasSubadminAccess) {
      return;
    }

    setWorkplace(workplace);
    setIsMobileMenuOpen(false);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    resetWorkplace();
    clearAuth();
    window.location.href = '/login';
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen((open) => !open)}
        className="fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-cream-300 dark:border-slate-700 text-stone-700 dark:text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 md:hidden transition-all duration-300"
        aria-label="Toggle navigation menu"
      >
        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 h-screen w-64 flex flex-col z-40
          bg-white dark:bg-slate-950 border-r border-cream-300 dark:border-slate-800
          shadow-xl dark:shadow-black/30 transition-all duration-500
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        <div className="relative p-6 border-b border-cream-200 dark:border-slate-800 overflow-hidden">
          <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-violet-200/20 dark:bg-violet-500/10 blur-2xl pointer-events-none" />

          <div className="relative flex items-center gap-3">
            <div className={`p-2 rounded-xl border shadow-sm transition-all duration-300 hover:scale-105 ${theme.brandGlow}`}>
              <Sparkles className={`w-5 h-5 ${theme.lightIcon} ${theme.darkIcon} animate-pulse`} />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight text-stone-900 dark:text-white">
                ProjectAlloc
              </h1>
              <p className="text-[10px] uppercase tracking-wider text-stone-400 dark:text-slate-500 mt-0.5">
                Smart Allocation
              </p>
            </div>
          </div>

          <p className="relative text-xs mt-3 text-stone-400 dark:text-slate-500">
            {effectiveRole === 'ADMIN'
              ? 'Administration'
              : effectiveRole === 'SUBADMIN'
                ? 'Review Hub'
                : effectiveRole === 'FACULTY'
                  ? 'Faculty Portal'
                  : 'Student Hub'}
          </p>
        </div>

        {isFaculty && hasSubadminAccess && (
          <div className="px-3 pt-4 pb-2 border-b border-cream-200 dark:border-slate-800">
            <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-slate-500">
              Workplace
            </p>

            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-cream-100 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => switchWorkplace('FACULTY')}
                className={cn(
                  'flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-all',
                  activeWorkplace === 'FACULTY'
                    ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300 shadow-sm'
                    : 'text-stone-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800',
                )}
              >
                <GraduationCap className="w-4 h-4" />
                Faculty
              </button>

              <button
                type="button"
                onClick={() => switchWorkplace('SUBADMIN')}
                disabled={checkingSubadminAccess}
                className={cn(
                  'flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-all',
                  activeWorkplace === 'SUBADMIN'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 shadow-sm'
                    : 'text-stone-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800',
                  checkingSubadminAccess && 'opacity-50 cursor-wait',
                )}
              >
                <Shield className="w-4 h-4" />
                SubAdmin
              </button>
            </div>
          </div>
        )}

        <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-cream-300 dark:scrollbar-thumb-slate-700">
          {items.map((item) => {
            if (isStudent && item.notice) {
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium border overflow-hidden group transition-all duration-300',
                      isActive
                        ? `${theme.lightActive} ${theme.darkActive} shadow-sm`
                        : 'border-transparent text-stone-500 dark:text-slate-400 hover:bg-cream-100 dark:hover:bg-slate-800 hover:text-stone-900 dark:hover:text-white',
                    )
                  }
                >
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

                  <div className="relative transition-transform duration-300 group-hover:scale-110">
                    <ListChecks className="w-5 h-5 text-teal-600 dark:text-teal-400 animate-pulse" />
                  </div>

                  <span className="relative flex-1 text-left">{item.label}</span>

                  <span className="relative text-[8px] font-bold bg-red-500 text-white px-2 py-1 rounded-full shadow-sm animate-pulse">
                    MUST READ
                  </span>
                </NavLink>
              );
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium border transition-all duration-300 group overflow-hidden',
                    isActive
                      ? `${theme.lightActive} ${theme.darkActive} shadow-sm`
                      : 'border-transparent text-stone-500 dark:text-slate-400 hover:bg-cream-100 dark:hover:bg-slate-800 hover:text-stone-900 dark:hover:text-white',
                  )
                }
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                <div className="relative transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-2">
                  {item.icon}
                </div>

                <span className="relative flex-1 text-left">{item.label}</span>

                {isFaculty &&
                  !isSubadminWorkplace &&
                  item.requestBadge &&
                  supervisionRequestCount > 0 && (
                    <span
                      className="relative min-w-[23px] h-[23px] px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[11px] font-bold shadow-lg shadow-red-500/30 animate-pulse ring-2 ring-red-500/10"
                      title={`${supervisionRequestCount} pending supervision ${supervisionRequestCount === 1 ? 'request' : 'requests'}`}
                    >
                      {supervisionRequestCount > 99 ? '99+' : supervisionRequestCount}
                    </span>
                  )}

                {item.label === 'Notifications' && (
                  <span
                    className="relative ml-auto w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500/50 animate-pulse"
                    title="New notifications"
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-cream-200 dark:border-slate-800 space-y-2 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => {
              navigate('/profile');
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left bg-cream-50 dark:bg-slate-900 border border-cream-200 dark:border-slate-800 hover:bg-cream-100 dark:hover:bg-slate-800 hover:shadow-sm transition-all duration-300 group"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border shadow-sm transition-all duration-300 group-hover:scale-105 ${theme.brandGlow} ${theme.lightIcon} ${theme.darkIcon}`}>
              {user?.firstName?.[0] || ''}
              {user?.lastName?.[0] || ''}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-stone-800 dark:text-white truncate text-sm">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-stone-400 dark:text-slate-500 mt-0.5">
                {isSubadminWorkplace
                  ? 'SubAdmin Workplace'
                  : isGlobalSubadmin
                    ? 'SUBADMIN'
                    : isAdmin
                      ? 'ADMIN'
                      : role}
              </p>
            </div>

            <User className="w-4 h-4 text-stone-400 dark:text-slate-500 transition-transform duration-300 group-hover:scale-110" />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:shadow-sm transition-all duration-300 group"
          >
            <LogOut className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="hidden md:block w-64 flex-shrink-0" />
    </>
  );
};

export default Sidebar;