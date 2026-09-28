// frontend/src/pages/admin/AdminDashboard.tsx

import React, { useEffect, useState } from 'react';
import {
  Users,
  FolderKanban,
  FileText,
  GraduationCap,
  Shield,
  TrendingUp,
  ArrowUpRight,
  Activity,
  Clock,
  Eye,
  Sparkles,
} from 'lucide-react';

import { userService } from '@/services/userService';
import { poolService } from '@/services/poolService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

import ReviewPage from '../subadmin/ReviewPage';
import FacultyDashboard from '../faculty/FacultyDashboard';
import BrowseProjectsPage from '../student/BrowseProjectsPage';

import type { UserStats, Pool } from '@/types';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<
    'admin' | 'subadmin' | 'faculty' | 'student'
  >('admin');

  useEffect(() => {
    Promise.all([userService.getStats(), poolService.list()])
      .then(([s, p]) => {
        setStats(s);
        setPools(p.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const activePools = pools.filter(
    (p) => !['DRAFT', 'ARCHIVED'].includes(p.status)
  ).length;

  const cards = [
    {
      label: 'Total Students',
      value: stats?.students || 0,
      icon: <GraduationCap className="w-5 h-5" />,
      change: '+12%',
      color: 'from-blue-500 to-cyan-500',
      glow: 'group-hover:shadow-blue-500/20',
      path: '/users',
    },
    {
      label: 'Faculty Members',
      value: stats?.faculty || 0,
      icon: <FileText className="w-5 h-5" />,
      change: '+3%',
      color: 'from-violet-500 to-purple-500',
      glow: 'group-hover:shadow-purple-500/20',
      path: '/users',
    },
    {
      label: 'Active Pools',
      value: activePools,
      icon: <FolderKanban className="w-5 h-5" />,
      change: `${pools.length} total`,
      color: 'from-emerald-500 to-teal-500',
      glow: 'group-hover:shadow-emerald-500/20',
      path: '/pools',
    },
    {
      label: 'Total Users',
      value: stats?.total || 0,
      icon: <Users className="w-5 h-5" />,
      change: `${stats?.active || 0} active`,
      color: 'from-amber-500 to-orange-500',
      glow: 'group-hover:shadow-amber-500/20',
      path: '/users',
    },
  ];

  const statusColor = (status: string) => {
    switch (status) {
      case 'FROZEN':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/20';

      case 'DRAFT':
        return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/20';

      case 'SUBMISSION_OPEN':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20';

      case 'UNDER_REVIEW':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20';

      default:
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20';
    }
  };

  return (
    <div className="space-y-6 text-stone-800 dark:text-slate-100 transition-colors duration-500">

      {/* =========================================================
          PAGE HEADER
      ========================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 animate-fade-in-up">

        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-500/10">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>

            <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
              Administration
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold mt-3 text-stone-900 dark:text-white">
            Command Center
          </h1>

          <p className="text-sm text-stone-500 dark:text-slate-400 mt-1">
            System-wide overview and management
          </p>
        </div>

        {/* View Switcher */}
        <div className="inline-flex items-center p-1.5 gap-1 rounded-2xl border border-cream-300 dark:border-slate-700 bg-cream-100/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-sm">

          {(['admin', 'subadmin', 'faculty', 'student'] as const).map(
            (mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`
                  relative px-4 py-2.5 rounded-xl text-xs font-semibold
                  capitalize transition-all duration-300
                  ${
                    viewMode === mode
                      ? `
                        bg-white dark:bg-slate-700
                        text-blue-700 dark:text-blue-300
                        shadow-md
                      `
                      : `
                        text-stone-500 dark:text-slate-400
                        hover:text-stone-900 dark:hover:text-white
                        hover:bg-white/70 dark:hover:bg-slate-700/60
                      `
                  }
                `}
              >
                {mode}
              </button>
            )
          )}
        </div>
      </div>

      {/* =========================================================
          OTHER ROLE VIEWS
      ========================================================= */}
      {viewMode === 'subadmin' && <ReviewPage />}

      {viewMode === 'faculty' && <FacultyDashboard />}

      {viewMode === 'student' && <BrowseProjectsPage />}

      {/* =========================================================
          ADMIN VIEW
      ========================================================= */}
      {viewMode === 'admin' && (
        <>
          {/* =====================================================
              HERO
          ===================================================== */}
          <section
            className="
              group relative overflow-hidden rounded-3xl p-7 md:p-9
              border border-cream-300 dark:border-slate-700
              bg-gradient-to-br
              from-white via-blue-50/80 to-violet-50/80
              dark:from-slate-900 dark:via-slate-800 dark:to-slate-900
              shadow-lg shadow-blue-100/40
              dark:shadow-black/20
              animate-fade-in-up
              transition-all duration-500
            "
          >
            {/* Decorative Glow */}
            <div
              className="
                absolute -top-24 -right-24
                w-72 h-72 rounded-full
                bg-blue-400/20 dark:bg-blue-500/10
                blur-3xl
                group-hover:scale-125
                transition-transform duration-1000
              "
            />

            <div
              className="
                absolute -bottom-28 -left-20
                w-64 h-64 rounded-full
                bg-violet-400/20 dark:bg-violet-500/10
                blur-3xl
                group-hover:scale-125
                transition-transform duration-1000
              "
            />

            <div className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]">
              <div
                className="
                  absolute inset-0
                  bg-[radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)]
                  [background-size:22px_22px]
                "
              />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-7">

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="
                      p-2 rounded-xl
                      bg-blue-100 dark:bg-blue-500/10
                      border border-blue-200 dark:border-blue-500/20
                    "
                  >
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
                  </div>

                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                    Platform Overview
                  </span>
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-stone-900 dark:text-white">
                  Everything under control.
                </h2>

                <p className="text-sm md:text-base text-stone-600 dark:text-slate-300 mt-2 max-w-xl leading-relaxed">
                  {activePools} active pool
                  {activePools !== 1 ? 's' : ''} running with{' '}
                  {stats?.total || 0} registered users across the platform.
                </p>
              </div>

              {/* Active / Inactive */}
              <div className="flex items-center gap-3">

                <div
                  className="
                    min-w-[105px] px-5 py-4 rounded-2xl
                    bg-white/80 dark:bg-white/5
                    backdrop-blur-xl
                    border border-white dark:border-white/10
                    shadow-sm
                    hover:-translate-y-1
                    transition-transform duration-300
                  "
                >
                  <p className="text-2xl font-bold text-stone-900 dark:text-white">
                    {stats?.active || 0}
                  </p>

                  <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">
                    Active
                  </p>
                </div>

                <div
                  className="
                    min-w-[105px] px-5 py-4 rounded-2xl
                    bg-white/80 dark:bg-white/5
                    backdrop-blur-xl
                    border border-white dark:border-white/10
                    shadow-sm
                    hover:-translate-y-1
                    transition-transform duration-300
                  "
                >
                  <p className="text-2xl font-bold text-stone-900 dark:text-white">
                    {stats?.inactive || 0}
                  </p>

                  <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">
                    Inactive
                  </p>
                </div>

              </div>
            </div>
          </section>

          {/* =====================================================
              STAT CARDS
          ===================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger-children">

            {cards.map((card) => (
              <button
                key={card.label}
                onClick={() => navigate(card.path)}
                className={`
                  group relative overflow-hidden text-left
                  p-5 rounded-2xl
                  bg-white/80 dark:bg-slate-800/80
                  backdrop-blur-xl
                  border border-cream-300 dark:border-slate-700
                  shadow-sm
                  hover:shadow-xl ${card.glow}
                  hover:-translate-y-1
                  transition-all duration-300
                `}
              >
                <div className="flex items-start justify-between gap-4">

                  <div>
                    <p className="text-sm font-medium text-stone-500 dark:text-slate-400">
                      {card.label}
                    </p>

                    <p className="text-3xl font-bold mt-2 text-stone-900 dark:text-white">
                      {card.value}
                    </p>

                    <div className="flex items-center gap-1.5 mt-2">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />

                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {card.change}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`
                      p-3.5 rounded-2xl
                      bg-gradient-to-br ${card.color}
                      text-white
                      shadow-lg
                      group-hover:scale-110
                      group-hover:rotate-3
                      transition-all duration-300
                    `}
                  >
                    {card.icon}
                  </div>
                </div>

                {/* Bottom animated line */}
                <div
                  className={`
                    absolute left-0 right-0 bottom-0
                    h-1
                    bg-gradient-to-r ${card.color}
                    opacity-0
                    group-hover:opacity-100
                    transition-opacity duration-300
                  `}
                />
              </button>
            ))}

          </div>

          {/* =====================================================
              RECENT POOLS
          ===================================================== */}
          <section
            className="
              overflow-hidden rounded-2xl
              bg-white/80 dark:bg-slate-800/80
              backdrop-blur-xl
              border border-cream-300 dark:border-slate-700
              shadow-sm
              animate-fade-in-up
              delay-300
            "
          >

            {/* Header */}
            <div
              className="
                flex flex-col sm:flex-row
                sm:items-center sm:justify-between
                gap-3 px-6 py-5
                border-b border-cream-200 dark:border-slate-700
              "
            >
              <div className="flex items-center gap-3">

                <div
                  className="
                    p-2.5 rounded-xl
                    bg-blue-50 dark:bg-blue-500/10
                    border border-blue-100 dark:border-blue-500/10
                  "
                >
                  <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-stone-900 dark:text-white">
                    Recent Pools
                  </h2>

                  <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                    Latest project allocation pools
                  </p>
                </div>

              </div>

              <button
                onClick={() => navigate('/pools')}
                className="
                  inline-flex items-center gap-1.5
                  text-xs font-semibold
                  text-blue-600 dark:text-blue-400
                  hover:text-blue-800 dark:hover:text-blue-300
                  transition-colors
                "
              >
                View All
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Empty State */}
            {pools.length === 0 ? (
              <div className="py-14 text-center">

                <div
                  className="
                    mx-auto mb-3
                    w-12 h-12 rounded-2xl
                    flex items-center justify-center
                    bg-cream-100 dark:bg-slate-700
                  "
                >
                  <FolderKanban className="w-5 h-5 text-stone-400 dark:text-slate-400" />
                </div>

                <p className="text-sm font-medium text-stone-600 dark:text-slate-300">
                  No pools created yet
                </p>

                <p className="text-xs text-stone-400 dark:text-slate-500 mt-1">
                  Create your first project pool to get started.
                </p>

              </div>
            ) : (

              <div className="divide-y divide-cream-200 dark:divide-slate-700">

                {pools.slice(0, 5).map((pool) => (
                  <button
                    key={pool.id}
                    onClick={() => navigate(`/pools/${pool.id}`)}
                    className="
                      w-full flex items-center justify-between
                      gap-4 px-6 py-4
                      text-left
                      hover:bg-cream-100/70
                      dark:hover:bg-slate-700/40
                      transition-all duration-300
                      group
                    "
                  >

                    <div className="flex items-center gap-4 min-w-0">

                      <div
                        className="
                          flex-shrink-0
                          w-11 h-11
                          rounded-xl
                          flex items-center justify-center
                          bg-gradient-to-br
                          from-blue-50 to-violet-50
                          dark:from-slate-700 dark:to-slate-600
                          border border-blue-100 dark:border-slate-600
                          group-hover:scale-105
                          transition-transform duration-300
                        "
                      >
                        <FolderKanban className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                      </div>

                      <div className="min-w-0">

                        <p
                          className="
                            font-semibold
                            text-stone-800 dark:text-white
                            truncate
                            group-hover:text-blue-700
                            dark:group-hover:text-blue-400
                            transition-colors
                          "
                        >
                          {pool.name}
                        </p>

                        <div className="flex items-center gap-2 mt-1">

                          <Clock className="w-3 h-3 text-stone-400 dark:text-slate-500" />

                          <p className="text-xs text-stone-500 dark:text-slate-400">
                            {pool.academicYear} • {pool.semester}
                          </p>

                        </div>

                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">

                      <span
                        className={`
                          px-3 py-1.5 rounded-lg
                          text-[11px] font-bold
                          border
                          ${statusColor(pool.status)}
                        `}
                      >
                        {pool.status.replace('_', ' ')}
                      </span>

                      <Eye
                        className="
                          w-4 h-4
                          text-stone-300 dark:text-slate-600
                          group-hover:text-blue-500
                          transition-colors
                        "
                      />

                    </div>

                  </button>
                ))}

              </div>
            )}

          </section>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;