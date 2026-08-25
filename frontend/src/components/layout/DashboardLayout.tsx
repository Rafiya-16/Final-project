// frontend/src/components/layout/DashboardLayout.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Bell, CheckCheck } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { notificationService } from '@/services/notificationService';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import type { Notification } from '@/types';

export const DashboardLayout: React.FC = () => {
  const { user } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch unread count on mount and every 30s
  useEffect(() => {
    const fetchCount = () => {
      notificationService.unreadCount().then(c => setUnreadCount(c)).catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setShowPanel(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openPanel = async () => {
    if (showPanel) { setShowPanel(false); return; }
    setShowPanel(true); setLoading(true);
    try {
      const res = await notificationService.list();
      setNotifications(res.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  const markRead = async (id: string) => {
    await notificationService.markRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await notificationService.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const timeAgo = (date: string) => {
    const ms = Date.now() - new Date(date).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-slate-900 transition-colors">
      <Sidebar />
      <div className="md:ml-64">
        <header className="bg-cream-50 dark:bg-slate-800 border-b border-cream-300 dark:border-slate-700 sticky top-0 z-20 px-6 py-3 flex items-center justify-between transition-colors">
          <div>
            <p className="text-sm text-stone-500 dark:text-slate-400">Welcome back,</p>
            <h2 className="text-lg font-semibold text-stone-800 dark:text-white">{user?.firstName} {user?.lastName}</h2>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle variant="dashboard" />
            <div className="relative" ref={panelRef}>
              <button onClick={openPanel} className="relative p-2 hover:bg-cream-200 dark:hover:bg-slate-700 rounded-full transition-colors" id="notification-bell">
                <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-slate-400'}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {showPanel && (
                <div className="absolute right-0 top-12 w-96 bg-cream-50 dark:bg-slate-800 border border-cream-300 dark:border-slate-700 rounded-xl shadow-2xl z-30 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-cream-200 dark:border-slate-700 bg-cream-100 dark:bg-slate-700/50">
                    <h3 className="font-semibold text-stone-800 dark:text-white">Notifications</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                        <CheckCheck className="w-3.5 h-3.5" />Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto divide-y divide-cream-200 dark:divide-slate-700">
                    {loading ? (
                      <div className="p-8 text-center text-sm text-gray-400 dark:text-slate-500">Loading...</div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center text-sm text-gray-400 dark:text-slate-500">No notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id}
                          onClick={() => !n.isRead && markRead(n.id)}
                          className={`px-4 py-3 cursor-pointer transition-colors hover:bg-cream-100 dark:hover:bg-slate-700/50 ${!n.isRead ? 'bg-amber-50/50 dark:bg-blue-500/5' : ''}`}>
                          <div className="flex items-start gap-3">
                            <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!n.isRead ? 'bg-blue-500' : 'bg-transparent'}`} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${!n.isRead ? 'font-semibold text-stone-800 dark:text-white' : 'text-stone-600 dark:text-slate-300'}`}>{n.title}</p>
                              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{timeAgo(n.createdAt)}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="p-6 page-enter">
          <Outlet />
        </main>
      </div>
    </div>
  );
};