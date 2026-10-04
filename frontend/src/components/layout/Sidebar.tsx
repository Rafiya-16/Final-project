// frontend/src/components/layout/Sidebar.tsx

import React, {
  useState,
  useEffect,
  useCallback,
} from 'react';

import {
  NavLink,
  useNavigate,
} from 'react-router-dom';

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
  ArrowLeftRight,
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

  /*
   * SubAdmin workplace.
   *
   * Faculty + SubAdmin users will see this list when
   * SubAdmin workplace is selected.
   */
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
      label: 'Faculty',
      path: '/faculty',
      icon: <Users className="w-5 h-5" />,
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
      label: 'Student Proposals',
      path: '/supervision-requests',
      icon: <Lightbulb className="w-5 h-5" />,
      requestBadge: true,
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

const roleTheme: Record<
  string,
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

export const Sidebar: React.FC = () => {
  const {
    user,
    clearAuth,
  } = useAuthStore();

  const navigate = useNavigate();

  const {
    activeWorkplace,
    hasSubadminAccess,
    setWorkplace,
    setHasSubadminAccess,
    resetWorkplace,
  } = useWorkplaceStore();

  const [
    isMobileMenuOpen,
    setIsMobileMenuOpen,
  ] = useState(false);

  const [
    supervisionRequestCount,
    setSupervisionRequestCount,
  ] = useState(0);

  const [
    checkingSubadminAccess,
    setCheckingSubadminAccess,
  ] = useState(false);

  /*
   * -------------------------------------------------------
   * Detect pool-level SubAdmin capability
   * -------------------------------------------------------
   *
   * IMPORTANT:
   *
   * User.role remains FACULTY.
   *
   * We inspect pool details and check whether this Faculty
   * is present in pool.subadmins.
   */
  const checkSubadminAccess = useCallback(
    async () => {
      if (
        !user ||
        user.role !== 'FACULTY'
      ) {
        setHasSubadminAccess(false);
        return;
      }

      setCheckingSubadminAccess(true);

      try {
        const poolResponse =
          await poolService.list();

        const pools =
          poolResponse?.data || [];

        if (
          !Array.isArray(pools) ||
          pools.length === 0
        ) {
          setHasSubadminAccess(false);
          setWorkplace('FACULTY');
          return;
        }

        let foundSubadminAccess = false;

        /*
         * Check every pool.
         *
         * A Faculty only needs one PoolSubadmin assignment
         * to have SubAdmin workplace capability.
         */
        for (const pool of pools) {
          try {
            const details =
              await poolService.getById(
                pool.id
              );

            const subadmins =
              details?.subadmins || [];

            const isSubadmin =
              Array.isArray(subadmins) &&
              subadmins.some(
                (item: any) =>
                  item?.subadmin?.id ===
                    user.id ||
                  item?.subadminId ===
                    user.id
              );

            if (isSubadmin) {
              foundSubadminAccess = true;
              break;
            }
          } catch {
            /*
             * One inaccessible pool should not prevent
             * checking the remaining pools.
             */
            continue;
          }
        }

        setHasSubadminAccess(
          foundSubadminAccess
        );

        /*
         * If capability was removed from the database,
         * automatically return to Faculty workplace.
         */
        if (!foundSubadminAccess) {
          setWorkplace('FACULTY');
        }
      } catch {
        setHasSubadminAccess(false);
        setWorkplace('FACULTY');
      } finally {
        setCheckingSubadminAccess(false);
      }
    },
    [
      user,
      setHasSubadminAccess,
      setWorkplace,
    ]
  );

  /*
   * Check SubAdmin capability after login.
   */
  useEffect(() => {
    if (
      user?.role === 'FACULTY'
    ) {
      checkSubadminAccess();
    } else {
      setHasSubadminAccess(false);
    }
  }, [
    user?.id,
    user?.role,
    checkSubadminAccess,
    setHasSubadminAccess,
  ]);

  /*
   * -------------------------------------------------------
   * Supervision request badge
   * -------------------------------------------------------
   */
  const loadSupervisionRequestCount =
    useCallback(async () => {
      if (
        user?.role !== 'FACULTY'
      ) {
        setSupervisionRequestCount(0);
        return;
      }

      try {
        const poolResponse =
          await poolService.list();

        const pools =
          poolResponse?.data || [];

        if (
          !Array.isArray(pools) ||
          pools.length === 0
        ) {
          setSupervisionRequestCount(0);
          return;
        }

        let pendingCount = 0;

        for (
          const pool of pools
        ) {
          try {
            const requests =
              await ideaService.getSupervisionRequests(
                pool.id
              );

            if (
              !Array.isArray(requests)
            ) {
              continue;
            }

            pendingCount +=
              requests.filter(
                (request: any) =>
                  request?.responseStatus ===
                    'PENDING' ||
                  request?.status ===
                    'PENDING'
              ).length;
          } catch {
            continue;
          }
        }

        setSupervisionRequestCount(
          pendingCount
        );
      } catch {
        setSupervisionRequestCount(0);
      }
    }, [user?.role]);

  useEffect(() => {
    if (
      user?.role !== 'FACULTY'
    ) {
      return;
    }

    loadSupervisionRequestCount();

    const interval =
      window.setInterval(
        () => {
          loadSupervisionRequestCount();
        },
        30000
      );

    return () => {
      window.clearInterval(interval);
    };
  }, [
    user?.role,
    loadSupervisionRequestCount,
  ]);

  useEffect(() => {
    if (
      user?.role !== 'FACULTY'
    ) {
      return;
    }

    const handleFocus =
      () => {
        loadSupervisionRequestCount();
        checkSubadminAccess();
      };

    window.addEventListener(
      'focus',
      handleFocus
    );

    return () => {
      window.removeEventListener(
        'focus',
        handleFocus
      );
    };
  }, [
    user?.role,
    loadSupervisionRequestCount,
    checkSubadminAccess,
  ]);

  /*
   * Mobile sidebar handling.
   */
  useEffect(() => {
    const handleResize =
      () => {
        if (
          window.innerWidth >= 768
        ) {
          setIsMobileMenuOpen(false);
        }
      };

    window.addEventListener(
      'resize',
      handleResize
    );

    return () =>
      window.removeEventListener(
        'resize',
        handleResize
      );
  }, []);

  /*
   * -------------------------------------------------------
   * Effective workplace
   * -------------------------------------------------------
   */
  const isFaculty =
    user?.role === 'FACULTY';

  const isStudent =
    user?.role === 'STUDENT';

  const isAdmin =
    user?.role === 'ADMIN';

  const isGlobalSubadmin =
    user?.role === 'SUBADMIN';

  const isSubadminWorkplace =
    isFaculty &&
    hasSubadminAccess &&
    activeWorkplace === 'SUBADMIN';

  /*
   * Normal roles use their own role.
   *
   * Faculty + SubAdmin uses the SUBADMIN navigation
   * while the workplace is switched.
   */
  const effectiveRole =
    isSubadminWorkplace
      ? 'SUBADMIN'
      : user?.role || 'STUDENT';

  const items =
    navItems[effectiveRole] || [];

  const theme =
    roleTheme[effectiveRole] ||
    roleTheme.STUDENT;

  /*
   * -------------------------------------------------------
   * Workplace switch
   * -------------------------------------------------------
   */
  const switchWorkplace =
    (workplace: 'FACULTY' | 'SUBADMIN') => {
      if (
        workplace === 'SUBADMIN' &&
        !hasSubadminAccess
      ) {
        return;
      }

      setWorkplace(workplace);

      setIsMobileMenuOpen(false);

      /*
       * DashboardRedirect will render the correct
       * dashboard based on the selected workplace.
       */
      navigate('/dashboard');
    };

  /*
   * -------------------------------------------------------
   * Logout
   * -------------------------------------------------------
   */
  const handleLogout =
    () => {
      resetWorkplace();
      clearAuth();
      window.location.href =
        '/login';
    };

  return (
    <>
      {/* ===================================================
          MOBILE HAMBURGER
      =================================================== */}

      <button
        onClick={() =>
          setIsMobileMenuOpen(
            !isMobileMenuOpen
          )
        }
        className="
          fixed top-4 left-4 z-50
          p-2 rounded-lg
          bg-gradient-to-r
          from-purple-600
          to-pink-600
          text-white
          shadow-lg
          md:hidden
        "
        aria-label="Toggle navigation menu"
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </button>

      {/* ===================================================
          MOBILE OVERLAY
      =================================================== */}

      {isMobileMenuOpen && (
        <div
          className="
            fixed inset-0
            bg-black/50
            z-40
            md:hidden
          "
          onClick={() =>
            setIsMobileMenuOpen(false)
          }
        />
      )}

      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <aside
        className={`
          fixed left-0 top-0
          h-screen
          flex flex-col
          z-40
          transition-transform
          duration-300
          w-64
          ${theme.sidebarBg}
          ${
            isMobileMenuOpen
              ? 'translate-x-0'
              : '-translate-x-full'
          }
          md:translate-x-0
          shadow-2xl
        `}
      >

        {/* =================================================
            BRAND
        ================================================= */}

        <div className="p-6 border-b border-white/5">

          <div className="flex items-center gap-2 mb-1">

            <div className="p-1.5 bg-white/5 rounded-xl">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>

            <h1
              className={`
                text-xl
                font-bold
                ${theme.brand}
                tracking-tight
              `}
            >
              {theme.brandText}
            </h1>

          </div>

          <p
            className={`
              text-xs
              mt-1
              ${theme.brandSub}
            `}
          >
            {effectiveRole === 'ADMIN'
              ? 'Administration'
              : effectiveRole === 'SUBADMIN'
                ? 'SubAdmin Workplace'
                : effectiveRole === 'FACULTY'
                  ? 'Faculty Portal'
                  : 'Allocation Platform'}
          </p>

        </div>

        {/* =================================================
            WORKPLACE SWITCHER
            Only Faculty with PoolSubadmin access.
        ================================================= */}

        {isFaculty &&
          hasSubadminAccess && (
            <div
              className="
                px-3
                pt-4
                pb-2
                border-b
                border-white/5
              "
            >

              <p
                className="
                  px-2
                  mb-2
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-wider
                  text-white/40
                "
              >
                Workplace
              </p>

              <div
                className="
                  grid
                  grid-cols-2
                  gap-1
                  p-1
                  rounded-xl
                  bg-black/20
                "
              >

                <button
                  type="button"
                  onClick={() =>
                    switchWorkplace(
                      'FACULTY'
                    )
                  }
                  className={cn(
                    `
                      flex
                      items-center
                      justify-center
                      gap-1.5
                      px-2
                      py-2
                      rounded-lg
                      text-xs
                      font-medium
                      transition-all
                    `,
                    activeWorkplace ===
                      'FACULTY'
                      ? `
                        bg-blue-500/20
                        text-blue-300
                        shadow-sm
                      `
                      : `
                        text-white/50
                        hover:text-white
                        hover:bg-white/5
                      `
                  )}
                >
                  <GraduationCap className="w-4 h-4" />
                  Faculty
                </button>

                <button
                  type="button"
                  onClick={() =>
                    switchWorkplace(
                      'SUBADMIN'
                    )
                  }
                  disabled={
                    checkingSubadminAccess
                  }
                  className={cn(
                    `
                      flex
                      items-center
                      justify-center
                      gap-1.5
                      px-2
                      py-2
                      rounded-lg
                      text-xs
                      font-medium
                      transition-all
                    `,
                    activeWorkplace ===
                      'SUBADMIN'
                      ? `
                        bg-amber-500/20
                        text-amber-300
                        shadow-sm
                      `
                      : `
                        text-white/50
                        hover:text-white
                        hover:bg-white/5
                      `,
                    checkingSubadminAccess &&
                      'opacity-50 cursor-wait'
                  )}
                >
                  <Shield className="w-4 h-4" />
                  SubAdmin
                </button>

              </div>

            </div>
          )}

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav
          className="
            flex-1
            py-6
            px-3
            space-y-1.5
            overflow-y-auto
          "
        >

          {items.map((item) => {

            /*
             * Student "What To Do" notice.
             */
            if (
              isStudent &&
              item.notice
            ) {
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() =>
                    setIsMobileMenuOpen(
                      false
                    )
                  }
                  className={({ isActive }) =>
                    cn(
                      `
                        relative
                        flex
                        items-center
                        gap-3
                        px-3
                        py-2.5
                        rounded-xl
                        text-sm
                        font-medium
                        transition-all
                        duration-300
                        group
                      `,
                      isActive
                        ? `
                          ${theme.activeLink}
                          ${theme.activeLinkText}
                          shadow-md
                        `
                        : theme.accent
                    )
                  }
                >

                  <div
                    className="
                      absolute
                      inset-0
                      -translate-x-full
                      group-hover:translate-x-full
                      transition-transform
                      duration-1000
                      bg-gradient-to-r
                      from-transparent
                      via-white/30
                      to-transparent
                    "
                  />

                  <ListChecks
                    className="
                      w-5 h-5
                      animate-pulse
                    "
                  />

                  <span className="flex-1 text-left">
                    {item.label}
                  </span>

                  <span
                    className="
                      text-[9px]
                      font-bold
                      bg-white/30
                      px-2
                      py-0.5
                      rounded-full
                      animate-pulse
                    "
                  >
                    MUST READ
                  </span>

                </NavLink>
              );
            }

            /*
             * Regular navigation item.
             */
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() =>
                  setIsMobileMenuOpen(
                    false
                  )
                }
                className={({ isActive }) =>
                  cn(
                    `
                      flex
                      items-center
                      gap-3
                      px-3
                      py-2.5
                      rounded-xl
                      text-sm
                      font-medium
                      transition-all
                      duration-300
                      group
                    `,
                    isActive
                      ? `
                        ${theme.activeLink}
                        ${theme.activeLinkText}
                        shadow-md
                      `
                      : theme.accent
                  )
                }
              >

                <div
                  className="
                    transition-transform
                    duration-200
                    group-hover:scale-110
                  "
                >
                  {item.icon}
                </div>

                <span className="flex-1 text-left">
                  {item.label}
                </span>

                {/* Faculty supervision badge */}
                {isFaculty &&
                  !isSubadminWorkplace &&
                  item.requestBadge &&
                  supervisionRequestCount > 0 && (
                    <span
                      className="
                        min-w-[22px]
                        h-[22px]
                        px-1.5
                        flex
                        items-center
                        justify-center
                        rounded-full
                        bg-red-500
                        text-white
                        text-[11px]
                        font-bold
                        shadow-lg
                        shadow-red-500/30
                        animate-pulse
                      "
                      title={`
                        ${supervisionRequestCount}
                        pending supervision
                        ${
                          supervisionRequestCount === 1
                            ? 'request'
                            : 'requests'
                        }
                      `}
                    >
                      {supervisionRequestCount >
                      99
                        ? '99+'
                        : supervisionRequestCount}
                    </span>
                  )}

                {/* Notification indicator */}
                {item.label ===
                  'Notifications' && (
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
            );
          })}

        </nav>

        {/* =================================================
            PROFILE + LOGOUT
        ================================================= */}

        <div
          className="
            p-4
            border-t
            border-white/5
            space-y-2
          "
        >

          <button
            onClick={() => {
              navigate('/profile');
              setIsMobileMenuOpen(false);
            }}
            className={`
              w-full
              flex
              items-center
              gap-3
              px-3
              py-2.5
              text-sm
              rounded-xl
              transition-all
              duration-300
              ${theme.accent}
              group
            `}
          >

            <div
              className={`
                w-9
                h-9
                ${theme.avatarBg}
                rounded-xl
                flex
                items-center
                justify-center
                ${theme.avatarText}
                font-bold
                text-sm
                backdrop-blur-sm
                transition-transform
                group-hover:scale-105
              `}
            >
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>

            <div
              className="
                flex-1
                text-left
                min-w-0
              "
            >

              <p
                className="
                  font-semibold
                  text-white/90
                  truncate
                  text-sm
                "
              >
                {user?.firstName}{' '}
                {user?.lastName}
              </p>

              <p
                className="
                  text-xs
                  text-white/50
                "
              >
                {isSubadminWorkplace
                  ? 'SubAdmin Workplace'
                  : isGlobalSubadmin
                    ? 'SUBADMIN'
                    : isAdmin
                      ? 'ADMIN'
                      : 'FACULTY'}
              </p>

            </div>

          </button>

          <button
            onClick={handleLogout}
            className={`
              w-full
              flex
              items-center
              gap-2
              px-3
              py-2
              text-sm
              rounded-xl
              transition-all
              duration-300
              ${theme.logoutHover}
            `}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>

        </div>

      </aside>

      {/* Desktop content spacer */}
      <div className="hidden md:block w-64" />
    </>
  );
};