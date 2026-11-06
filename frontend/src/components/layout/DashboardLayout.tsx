import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import { notificationService } from '@/services/notificationService';
import type { Notification } from '@/types';
import toast from 'react-hot-toast';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '@/stores/authStore';

const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.email ||
    'User';
  const loadNotifications = async () => {
  setNotificationLoading(true);

  try {
    const [listResponse, count] = await Promise.all([
      notificationService.list(1),
      notificationService.unreadCount(),
    ]);

    setNotifications(listResponse.data || []);
    setUnreadCount(count || 0);
  } catch (error) {
    console.error('Failed to load notifications:', error);
    toast.error('Unable to load notifications');
  } finally {
    setNotificationLoading(false);
  }
};
useEffect(() => {
  loadNotifications();
}, []);
const handleMarkRead = async (notification: Notification) => {
  try {
    if (!notification.isRead) {
      await notificationService.markRead(notification.id);

      setNotifications(prev =>
        prev.map(item =>
          item.id === notification.id
            ? { ...item, isRead: true }
            : item
        )
      );

      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    if (notification.link) {
      setIsNotificationOpen(false);
      navigate(notification.link);
    }
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    toast.error('Failed to update notification');
  }
};
  return (
    <div className="min-h-screen bg-cream-100 dark:bg-slate-900">
      <Sidebar />
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

                {unreadCount > 0 && (
  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-800">
    {unreadCount > 99 ? '99+' : unreadCount}
  </span>
)}
              </button>

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
                          Stay updated with CSE ProjectHub
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

                   {/* Notification List */}

<div className="max-h-[400px] overflow-y-auto">

  {notificationLoading ? (
    <div className="px-4 py-10 text-center">
      <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      <p className="mt-3 text-sm text-slate-500">
        Loading notifications...
      </p>
    </div>
  ) : notifications.length === 0 ? (
    <div className="px-4 py-8 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-violet-50 dark:bg-violet-500/10">
        <Bell className="h-5 w-5 text-violet-500" />
      </div>

      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
        No notifications
      </p>

      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        You're all caught up!
      </p>
    </div>
  ) : (
    <div className="divide-y divide-slate-100 dark:divide-slate-700">

      {notifications.map(notification => (
        <button
          key={notification.id}
          type="button"
          onClick={() => handleMarkRead(notification)}
          className={`w-full px-4 py-4 text-left transition hover:bg-violet-50 dark:hover:bg-slate-700 ${
            !notification.isRead
              ? 'bg-violet-50/60 dark:bg-violet-500/10'
              : ''
          }`}
        >
          <div className="flex items-start gap-3">

            <div className="mt-1">
              <Bell
                className={`h-4 w-4 ${
                  !notification.isRead
                    ? 'text-violet-600'
                    : 'text-slate-400'
                }`}
              />
            </div>

            <div className="min-w-0 flex-1">

              <div className="flex items-center justify-between gap-2">

                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  {notification.title}
                </p>

                {!notification.isRead && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-violet-500" />
                )}

              </div>

              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {notification.message}
              </p>

              <p className="mt-2 text-[11px] text-slate-400">
                {new Date(notification.createdAt).toLocaleString()}
              </p>

            </div>
          </div>
        </button>
      ))}

    </div>
  )}
</div>

{/* Footer */}

<div className="border-t border-slate-100 px-4 py-3 dark:border-slate-700">
  <button
    type="button"
    onClick={() => {
      setIsNotificationOpen(false);
      navigate('/notifications');
    }}
    className="w-full text-center text-sm font-semibold text-violet-600 transition hover:text-violet-800 dark:text-violet-400"
  >
    View all notifications
  </button>
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