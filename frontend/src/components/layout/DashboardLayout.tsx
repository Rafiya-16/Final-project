// frontend/src/components/layout/DashboardLayout.tsx

import React, { useState } from 'react';

import { Outlet } from 'react-router-dom';

import { Bell, X } from 'lucide-react';

import { Sidebar } from './Sidebar';

import { useAuthStore } from '@/stores/authStore';

const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const { user } = useAuthStore();

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.email ||
    'User';

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-slate-900">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <Sidebar />

      {/* =====================================================
          MAIN CONTENT

          OPEN SIDEBAR   = 256px
          CLOSED SIDEBAR = 76px

          The sidebar itself handles its own open/close state.
          Dashboard content follows the same layout spacing.
      ===================================================== */}

      <div
        className={`
          min-h-screen
          transition-[margin-left]
          duration-300
          ease-in-out
          ${
            isSidebarOpen
              ? 'md:ml-64'
              : 'md:ml-[76px]'
          }
        `}
      >
        {/* ===================================================
            HEADER
        =================================================== */}

        <header
          className="
            sticky
            top-0
            z-40
            h-16
            border-b
            border-slate-200/70
            bg-white/90
            backdrop-blur-xl
            dark:border-slate-700
            dark:bg-slate-900/90
          "
        >
          <div
            className="
              flex
              h-full
              items-center
              justify-between
              px-4
              sm:px-6
              lg:px-8
            "
          >
            {/* ================= WELCOME ================= */}

            <div className="min-w-0">
              <p
                className="
                  text-xs
                  font-medium
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Welcome back
              </p>

              <h1
                className="
                  truncate
                  text-sm
                  font-semibold
                  text-slate-800
                  sm:text-base
                  dark:text-white
                "
              >
                {displayName}
              </h1>
            </div>

            {/* ================= HEADER ACTIONS ================= */}

            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setIsNotificationOpen(
                    (previous) => !previous
                  )
                }
                className="
                  relative
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  text-slate-600
                  shadow-sm
                  transition-all
                  duration-200
                  hover:-translate-y-0.5
                  hover:border-violet-200
                  hover:bg-violet-50
                  hover:text-violet-600
                  hover:shadow-md
                  dark:border-slate-700
                  dark:bg-slate-800
                  dark:text-slate-300
                  dark:hover:bg-slate-700
                "
                aria-label="Notifications"
                aria-expanded={isNotificationOpen}
              >
                <Bell className="h-5 w-5" />

                {/* Notification indicator */}

                <span
                  className="
                    absolute
                    right-2
                    top-2
                    h-2
                    w-2
                    rounded-full
                    bg-pink-500
                    ring-2
                    ring-white
                    dark:ring-slate-800
                  "
                />
              </button>

              {/* =================================================
                  NOTIFICATION PANEL
              ================================================= */}

              {isNotificationOpen && (
                <>
                  {/* Mobile backdrop */}

                  <div
                    className="
                      fixed
                      inset-0
                      z-40
                      bg-slate-900/10
                      backdrop-blur-[2px]
                      md:hidden
                    "
                    onClick={() =>
                      setIsNotificationOpen(false)
                    }
                  />

                  <div
                    className="
                      absolute
                      right-0
                      top-12
                      z-50
                      w-[calc(100vw-2rem)]
                      max-w-sm
                      overflow-hidden
                      rounded-2xl
                      border
                      border-slate-200
                      bg-white
                      shadow-2xl
                      shadow-slate-900/10
                      dark:border-slate-700
                      dark:bg-slate-800
                    "
                  >
                    {/* Panel Header */}

                    <div
                      className="
                        flex
                        items-center
                        justify-between
                        border-b
                        border-slate-100
                        px-4
                        py-3
                        dark:border-slate-700
                      "
                    >
                      <div>
                        <h3
                          className="
                            text-sm
                            font-semibold
                            text-slate-800
                            dark:text-white
                          "
                        >
                          Notifications
                        </h3>

                        <p
                          className="
                            mt-0.5
                            text-xs
                            text-slate-500
                            dark:text-slate-400
                          "
                        >
                          Stay updated with ProjectAlloc
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setIsNotificationOpen(false)
                        }
                        className="
                          flex
                          h-8
                          w-8
                          items-center
                          justify-center
                          rounded-lg
                          text-slate-400
                          transition
                          hover:bg-slate-100
                          hover:text-slate-700
                          dark:hover:bg-slate-700
                          dark:hover:text-white
                        "
                        aria-label="Close notifications"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Empty notification state */}

                    <div className="px-4 py-8 text-center">
                      <div
                        className="
                          mx-auto
                          mb-3
                          flex
                          h-12
                          w-12
                          items-center
                          justify-center
                          rounded-full
                          bg-violet-50
                          dark:bg-violet-500/10
                        "
                      >
                        <Bell
                          className="
                            h-5
                            w-5
                            text-violet-500
                          "
                        />
                      </div>

                      <p
                        className="
                          text-sm
                          font-medium
                          text-slate-700
                          dark:text-slate-200
                        "
                      >
                        No new notifications
                      </p>

                      <p
                        className="
                          mt-1
                          text-xs
                          text-slate-500
                          dark:text-slate-400
                        "
                      >
                        You're all caught up!
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* =====================================================
            PAGE CONTENT
        ===================================================== */}

        <main
          className="
            min-h-[calc(100vh-4rem)]
            w-full
            overflow-x-hidden
            p-4
            sm:p-5
            lg:p-6
            page-enter
          "
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export { DashboardLayout };

export default DashboardLayout;