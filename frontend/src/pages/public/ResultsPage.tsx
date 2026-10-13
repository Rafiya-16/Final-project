// frontend/src/pages/public/ResultsPage.tsx

import React, { useEffect, useMemo, useState } from 'react';
import api from '@/config/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/lib/utils';
import {
  Search,
  Trophy,
  Lock,
  Sparkles,
  Users,
  FolderKanban,
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  Star,
} from 'lucide-react';

const ResultsPage: React.FC = () => {
  const [pools, setPools] = useState<any[]>([]);
  const [selectedPool, setSelectedPool] = useState('');
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPools = async () => {
      try {
        const { data } = await api.get('/pools?status=FROZEN,ARCHIVED');

        const poolList = data.data || [];

        setPools(poolList);

        if (poolList.length > 0) {
          setSelectedPool(poolList[0].id);
        }
      } catch {
        setError('Sign in to view detailed results');
      } finally {
        setLoading(false);
      }
    };

    fetchPools();
  }, []);

  useEffect(() => {
    if (!selectedPool) return;

    setLoading(true);

    const fetchTeams = async () => {
      try {
        const { data } = await api.get(
          `/pools/${selectedPool}/reports/teams`
        );

        setTeams(data.data?.teams || []);
      } catch {
        setTeams([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [selectedPool]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return teams;

    return teams.filter((team: any) => {
      const teamName = team.name?.toLowerCase() || '';
      const projectTitle = team.project?.title?.toLowerCase() || '';

      const membersMatch =
        team.members?.some((member: any) => {
          const firstName =
            member.student?.firstName?.toLowerCase() || '';

          const lastName =
            member.student?.lastName?.toLowerCase() || '';

          const enrollment =
            member.student?.enrollmentNo?.toLowerCase() || '';

          return (
            firstName.includes(query) ||
            lastName.includes(query) ||
            enrollment.includes(query)
          );
        }) || false;

      return (
        teamName.includes(query) ||
        projectTitle.includes(query) ||
        membersMatch
      );
    });
  }, [teams, search]);

  const selectedPoolData = pools.find(
    (pool: any) => pool.id === selectedPool
  );

  const totalMembers = useMemo(() => {
    return filtered.reduce(
      (total: number, team: any) =>
        total + (team.members?.length || 0),
      0
    );
  }, [filtered]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#fffdf8] dark:bg-slate-950 transition-colors duration-500 overflow-hidden">
        <style>
          {`
            @keyframes resultsFadeUp {
              from {
                opacity: 0;
                transform: translateY(28px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @keyframes resultsFadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }

            @keyframes resultsFloat {
              0%, 100% {
                transform: translateY(0px);
              }
              50% {
                transform: translateY(-12px);
              }
            }

            @keyframes resultsGlow {
              0%, 100% {
                opacity: .35;
              }
              50% {
                opacity: .7;
              }
            }

            @keyframes resultsShimmer {
              0% {
                transform: translateX(-120%);
              }
              100% {
                transform: translateX(120%);
              }
            }
          `}
        </style>

        <section className="relative pt-32 pb-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#fff4d6] via-[#fffaf2] to-[#eaf8ef] dark:from-slate-950 dark:via-slate-950 dark:to-slate-950" />

          <div className="absolute -top-28 left-[8%] w-[380px] h-[380px] rounded-full bg-[#ffe7ad]/55 dark:bg-emerald-500/10 blur-[110px] animate-pulse" />

          <div
            className="absolute top-16 right-[8%] w-[360px] h-[360px] rounded-full bg-[#ccefd9]/65 dark:bg-cyan-500/10 blur-[115px]"
            style={{
              animation: 'resultsFloat 7s ease-in-out infinite',
            }}
          />

          <div
            className="absolute bottom-[-180px] left-[38%] w-[430px] h-[430px] rounded-full bg-[#ffdce9]/40 dark:bg-transparent blur-[125px]"
            style={{
              animation: 'resultsGlow 6s ease-in-out infinite',
            }}
          />

          <div
            className="absolute inset-0 opacity-[0.3] dark:opacity-[0.025]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(110,95,70,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(110,95,70,.07) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />

          <div
            className="absolute top-24 left-8 sm:left-16 w-16 h-16 rounded-full border border-emerald-200/70"
            style={{
              animation: 'resultsFloat 6s ease-in-out infinite',
            }}
          />

          <div
            className="absolute bottom-16 right-10 sm:right-24 w-10 h-10 rounded-full border border-amber-200/80"
            style={{
              animation: 'resultsFloat 5s ease-in-out infinite reverse',
            }}
          />

          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <div
              style={{
                animation: 'resultsFadeUp .7s ease-out both',
              }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-200/70 bg-white/75 dark:bg-white/5 backdrop-blur-md text-amber-700 dark:text-emerald-400 text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] shadow-sm">
                <Sparkles className="w-4 h-4 animate-pulse" />
                Final Results
              </div>
            </div>

            <h1
              className="mt-6 text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-stone-800 dark:text-white leading-[1.05]"
              style={{
                animation: 'resultsFadeUp .8s ease-out .1s both',
              }}
            >
              Allocation
              <span className="block bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500 bg-clip-text text-transparent">
                Results
              </span>
            </h1>

            <p
              className="max-w-2xl mx-auto mt-6 text-base sm:text-lg text-stone-600 dark:text-slate-400 leading-relaxed"
              style={{
                animation: 'resultsFadeUp .8s ease-out .2s both',
              }}
            >
              View finalized project allocations, assigned guides,
              and student teams in one place.
            </p>
          </div>
        </section>

        <section className="relative -mt-10 pb-20 px-4 sm:px-6">
          <div
            className="max-w-md mx-auto"
            style={{
              animation: 'resultsFadeUp .8s ease-out .3s both',
            }}
          >
            <div className="relative overflow-hidden rounded-3xl border border-[#eadfcb] dark:border-white/10 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl shadow-[0_20px_60px_rgba(120,100,70,0.10)] dark:shadow-black/30 p-8 sm:p-10 text-center">
              <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-emerald-200/35 dark:bg-emerald-500/10 blur-3xl" />

              <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-amber-200/35 dark:bg-amber-500/10 blur-3xl" />

              <div className="relative z-10">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center shadow-sm">
                  <Lock className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>

                <h2 className="text-2xl font-bold text-stone-800 dark:text-white">
                  Authentication Required
                </h2>

                <p className="mt-3 text-sm sm:text-base text-stone-500 dark:text-slate-400 leading-relaxed">
                  Please sign in to securely access finalized
                  allocation results.
                </p>

                <a
                  href="/login"
                  className="group relative overflow-hidden mt-7 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/15 hover:shadow-xl hover:shadow-emerald-500/20 hover:-translate-y-1 transition-all duration-300"
                >
                  <span className="relative z-10">Sign In</span>
                  <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-1 transition-transform" />

                  <span className="absolute inset-y-0 left-0 w-1/3 bg-white/20 -translate-x-[150%] skew-x-12 group-hover:translate-x-[400%] transition-transform duration-700" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffdf8] dark:bg-slate-950 text-stone-800 dark:text-white transition-colors duration-500 overflow-hidden">
      <style>
        {`
          @keyframes resultsFadeUp {
            from {
              opacity: 0;
              transform: translateY(28px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes resultsFadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes resultsFloat {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-12px);
            }
          }

          @keyframes resultsGlow {
            0%, 100% {
              opacity: .3;
              transform: scale(1);
            }
            50% {
              opacity: .65;
              transform: scale(1.08);
            }
          }

          @keyframes resultsShimmer {
            0% {
              transform: translateX(-120%);
            }
            100% {
              transform: translateX(120%);
            }
          }

          @keyframes resultsPulseSoft {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.04);
            }
          }
        `}
      </style>

      {/* ========================= HERO ========================= */}
      <section className="relative pt-32 pb-24 sm:pb-28 overflow-hidden">
        {/* Light background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#fff3d4] via-[#fffaf2] to-[#e8f8ee] dark:from-slate-950 dark:via-slate-950 dark:to-slate-950" />

        {/* Soft pastel glows */}
        <div
          className="absolute -top-32 left-[6%] w-[430px] h-[430px] rounded-full bg-[#ffe4a3]/55 dark:bg-emerald-500/10 blur-[125px]"
          style={{
            animation: 'resultsGlow 7s ease-in-out infinite',
          }}
        />

        <div
          className="absolute top-10 right-[6%] w-[400px] h-[400px] rounded-full bg-[#ccefd8]/65 dark:bg-teal-500/10 blur-[130px]"
          style={{
            animation: 'resultsFloat 8s ease-in-out infinite',
          }}
        />

        <div
          className="absolute bottom-[-190px] left-[35%] w-[500px] h-[500px] rounded-full bg-[#ffdce9]/35 dark:bg-cyan-500/5 blur-[150px]"
          style={{
            animation: 'resultsGlow 9s ease-in-out infinite reverse',
          }}
        />

        {/* Soft grid */}
        <div
          className="absolute inset-0 opacity-[0.28] dark:opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(100,90,70,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(100,90,70,.07) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Floating circles */}
        <div
          className="absolute top-24 left-5 sm:left-14 w-20 h-20 rounded-full border border-amber-200/70 bg-white/20"
          style={{
            animation: 'resultsFloat 6s ease-in-out infinite',
          }}
        />

        <div
          className="absolute top-36 right-[18%] w-5 h-5 rounded-full bg-emerald-200/70"
          style={{
            animation: 'resultsFloat 4s ease-in-out infinite reverse',
          }}
        />

        <div
          className="absolute bottom-16 right-8 sm:right-20 w-12 h-12 rounded-full border border-emerald-200/70"
          style={{
            animation: 'resultsFloat 5s ease-in-out infinite',
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div
              style={{
                animation: 'resultsFadeUp .7s ease-out both',
              }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-200/80 bg-white/75 dark:bg-white/5 backdrop-blur-md text-amber-700 dark:text-emerald-400 text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] shadow-sm">
                <Trophy className="w-4 h-4" />
                Results Center
                <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              </div>
            </div>

            <h1
              className="mt-6 text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-stone-800 dark:text-white leading-[1.05]"
              style={{
                animation: 'resultsFadeUp .8s ease-out .1s both',
              }}
            >
              Allocation
              <span className="block bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500 bg-clip-text text-transparent">
                Results
              </span>
            </h1>

            <p
              className="max-w-2xl mx-auto mt-6 text-base sm:text-lg text-stone-600 dark:text-slate-400 leading-relaxed"
              style={{
                animation: 'resultsFadeUp .8s ease-out .2s both',
              }}
            >
              Explore finalized project teams, assigned projects,
              guides, and student allocations.
            </p>

            {!loading && pools.length > 0 && (
              <div
                className="flex flex-wrap justify-center gap-3 mt-8"
                style={{
                  animation: 'resultsFadeUp .8s ease-out .3s both',
                }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/75 dark:bg-white/5 border border-emerald-100 dark:border-white/10 backdrop-blur-md text-stone-600 dark:text-slate-300 text-sm shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Finalized
                </div>

                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/75 dark:bg-white/5 border border-amber-100 dark:border-white/10 backdrop-blur-md text-stone-600 dark:text-slate-300 text-sm shadow-sm">
                  <Users className="w-4 h-4 text-amber-500" />
                  {teams.length} Teams
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================= CONTENT ========================= */}
      <section className="relative -mt-10 pb-20 sm:pb-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {pools.length === 0 && !loading ? (
            <div
              className="rounded-3xl border border-[#eadfcb] dark:border-white/10 bg-white/85 dark:bg-white/[0.03] backdrop-blur-xl shadow-[0_18px_50px_rgba(120,100,70,0.08)] dark:shadow-none p-8"
              style={{
                animation: 'resultsFadeUp .7s ease-out both',
              }}
            >
              <EmptyState
                title="No finalized pools"
                subtitle="Results will appear once a pool is frozen"
              />
            </div>
          ) : (
            <div className="space-y-7">
              {/* ========================= FILTER PANEL ========================= */}
              <div
                className="group relative overflow-hidden rounded-3xl border border-[#eadfcb] dark:border-white/10 bg-white/90 dark:bg-slate-900/70 backdrop-blur-xl shadow-[0_18px_55px_rgba(120,100,70,0.08)] dark:shadow-black/20 p-4 sm:p-5"
                style={{
                  animation: 'resultsFadeUp .8s ease-out .1s both',
                }}
              >
                <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-emerald-100/50 dark:bg-emerald-500/5 blur-3xl group-hover:scale-110 transition-transform duration-700" />

                <div className="absolute -bottom-24 -left-24 w-56 h-56 rounded-full bg-amber-100/50 dark:bg-amber-500/5 blur-3xl" />

                <div className="relative z-10 flex flex-col lg:flex-row gap-4">
                  {/* Pool Select */}
                  <div className="relative lg:w-[320px]">
                    <FolderKanban className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none" />

                    <select
                      value={selectedPool}
                      onChange={(e) =>
                        setSelectedPool(e.target.value)
                      }
                      className="w-full appearance-none pl-11 pr-11 py-3.5 bg-[#fffaf1] dark:bg-white/[0.04] border border-[#e9dec9] dark:border-white/10 rounded-xl text-stone-700 dark:text-white text-sm font-medium outline-none focus:border-emerald-300 dark:focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 hover:border-emerald-200 dark:hover:border-white/20 transition-all cursor-pointer"
                    >
                      {pools.map((pool: any) => (
                        <option
                          key={pool.id}
                          value={pool.id}
                          className="bg-white dark:bg-slate-900"
                        >
                          {pool.name} — {pool.academicYear}
                        </option>
                      ))}
                    </select>

                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                  </div>

                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-slate-500" />

                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by team, project, student or enrollment..."
                      className="w-full pl-11 pr-4 py-3.5 bg-[#fffaf1] dark:bg-white/[0.04] border border-[#e9dec9] dark:border-white/10 rounded-xl text-stone-700 dark:text-white text-sm placeholder:text-stone-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-300 dark:focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 hover:border-emerald-200 dark:hover:border-white/20 transition-all"
                    />
                  </div>
                </div>

                {selectedPoolData && (
                  <div className="relative z-10 flex flex-wrap items-center gap-2 mt-4 px-1">
                    <span className="text-xs text-stone-400">
                      Viewing:
                    </span>

                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {selectedPoolData.name}
                    </span>

                    {selectedPoolData.academicYear && (
                      <>
                        <span className="text-stone-300">•</span>

                        <span className="text-xs text-stone-400">
                          {selectedPoolData.academicYear}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* ========================= SUMMARY CARDS ========================= */}
              {!loading && teams.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {/* Teams */}
                  <div
                    className="group relative overflow-hidden rounded-2xl border border-[#e9dec9] dark:border-white/10 bg-white/85 dark:bg-white/[0.03] p-4 sm:p-5 shadow-sm hover:-translate-y-1.5 hover:shadow-[0_18px_35px_rgba(80,120,90,0.10)] transition-all duration-300"
                    style={{
                      animation: 'resultsFadeUp .6s ease-out .15s both',
                    }}
                  >
                    <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-emerald-100/60 dark:bg-emerald-500/5 blur-2xl group-hover:scale-150 transition-transform duration-500" />

                    <div className="relative z-10 flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 border border-emerald-100 dark:border-emerald-500/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        <Users className="w-5 h-5 text-emerald-500" />
                      </div>

                      <span className="text-xs font-medium text-stone-400">
                        Teams
                      </span>
                    </div>

                    <p className="relative z-10 mt-4 text-2xl sm:text-3xl font-bold text-stone-800 dark:text-white">
                      {filtered.length}
                    </p>

                    <p className="relative z-10 mt-1 text-xs sm:text-sm text-stone-500 dark:text-slate-500">
                      Allocated teams
                    </p>
                  </div>

                  {/* Students */}
                  <div
                    className="group relative overflow-hidden rounded-2xl border border-[#e9dec9] dark:border-white/10 bg-white/85 dark:bg-white/[0.03] p-4 sm:p-5 shadow-sm hover:-translate-y-1.5 hover:shadow-[0_18px_35px_rgba(210,160,70,0.10)] transition-all duration-300"
                    style={{
                      animation: 'resultsFadeUp .6s ease-out .25s both',
                    }}
                  >
                    <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-amber-100/70 dark:bg-amber-500/5 blur-2xl group-hover:scale-150 transition-transform duration-500" />

                    <div className="relative z-10 flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 border border-amber-100 dark:border-amber-500/10 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                        <GraduationCap className="w-5 h-5 text-amber-500" />
                      </div>

                      <span className="text-xs font-medium text-stone-400">
                        Students
                      </span>
                    </div>

                    <p className="relative z-10 mt-4 text-2xl sm:text-3xl font-bold text-stone-800 dark:text-white">
                      {totalMembers}
                    </p>

                    <p className="relative z-10 mt-1 text-xs sm:text-sm text-stone-500 dark:text-slate-500">
                      Students allocated
                    </p>
                  </div>

                  {/* Status */}
                  <div
                    className="col-span-2 lg:col-span-1 group relative overflow-hidden rounded-2xl border border-[#e9dec9] dark:border-white/10 bg-white/85 dark:bg-white/[0.03] p-4 sm:p-5 shadow-sm hover:-translate-y-1.5 hover:shadow-[0_18px_35px_rgba(70,150,130,0.10)] transition-all duration-300"
                    style={{
                      animation: 'resultsFadeUp .6s ease-out .35s both',
                    }}
                  >
                    <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-teal-100/60 dark:bg-teal-500/5 blur-2xl group-hover:scale-150 transition-transform duration-500" />

                    <div className="relative z-10 flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-500/10 dark:to-emerald-500/10 border border-teal-100 dark:border-teal-500/10 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                        <Trophy className="w-5 h-5 text-teal-500" />
                      </div>

                      <span className="text-xs font-medium text-stone-400">
                        Status
                      </span>
                    </div>

                    <p className="relative z-10 mt-4 text-lg sm:text-xl font-bold text-stone-800 dark:text-white">
                      Finalized
                    </p>

                    <p className="relative z-10 mt-1 text-xs sm:text-sm text-stone-500 dark:text-slate-500">
                      Allocation is frozen
                    </p>
                  </div>
                </div>
              )}

              {/* ========================= LOADING ========================= */}
              {loading ? (
                <div
                  className="rounded-3xl border border-[#eadfcb] dark:border-white/10 bg-white/85 dark:bg-white/[0.03] p-12 shadow-sm"
                  style={{
                    animation: 'resultsFadeIn .5s ease-out both',
                  }}
                >
                  <LoadingSpinner />
                </div>
              ) : filtered.length === 0 ? (
                <div
                  className="rounded-3xl border border-[#eadfcb] dark:border-white/10 bg-white/85 dark:bg-white/[0.03] p-8 shadow-sm"
                  style={{
                    animation: 'resultsFadeUp .6s ease-out both',
                  }}
                >
                  <EmptyState
                    title="No teams found"
                    subtitle={
                      search
                        ? 'Try adjusting your search terms'
                        : 'No allocation teams are available for this pool'
                    }
                  />
                </div>
              ) : (
                /* ========================= TEAM CARDS ========================= */
                <div className="space-y-5">
                  {filtered.map((team: any, idx: number) => (
                    <div
                      key={team.id}
                      className="group relative overflow-hidden rounded-3xl border border-[#e9dec9] dark:border-white/10 bg-white/90 dark:bg-white/[0.03] shadow-sm hover:shadow-[0_22px_50px_rgba(80,100,80,0.10)] hover:-translate-y-1 hover:border-emerald-200/80 dark:hover:border-emerald-500/20 transition-all duration-500"
                      style={{
                        animation: `resultsFadeUp .65s ease-out ${
                          idx * 0.08
                        }s both`,
                      }}
                    >
                      {/* Accent line */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-300 via-teal-300 to-amber-300 opacity-70 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Soft glow */}
                      <div className="absolute -top-28 -right-28 w-72 h-72 rounded-full bg-emerald-100/40 dark:bg-emerald-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700" />

                      <div className="absolute -bottom-28 -left-28 w-64 h-64 rounded-full bg-amber-100/30 dark:bg-amber-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700" />

                      <div className="relative z-10 p-5 sm:p-6 lg:p-7">
                        {/* TEAM HEADER */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                          <div className="flex items-start gap-4 min-w-0">
                            {/* Number */}
                            <div className="relative shrink-0">
                              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-100 via-teal-100 to-amber-100 dark:from-emerald-500/15 dark:via-teal-500/10 dark:to-amber-500/10 border border-emerald-200/70 dark:border-emerald-500/10 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-extrabold text-lg shadow-sm group-hover:scale-105 group-hover:rotate-2 transition-all duration-300">
                                {String(idx + 1).padStart(2, '0')}
                              </div>

                              <div className="absolute -right-1 -bottom-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border border-emerald-100 dark:border-white/10 flex items-center justify-center">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              </div>
                            </div>

                            {/* Team Info */}
                            <div className="min-w-0 pt-0.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-lg sm:text-xl font-bold text-stone-800 dark:text-white truncate">
                                  {team.name ||
                                    `Team ${idx + 1}`}
                                </h3>

                                <Badge
                                  text={team.status || 'FROZEN'}
                                />
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <FolderKanban className="w-3.5 h-3.5 shrink-0 text-emerald-500" />

                                  <p className="text-sm font-medium text-stone-600 dark:text-slate-300 truncate">
                                    {team.project?.title ||
                                      'No project assigned'}
                                  </p>
                                </div>

                                {team.project?.faculty && (
                                  <>
                                    <span className="hidden sm:inline text-stone-300 dark:text-slate-700">
                                      •
                                    </span>

                                    <p className="text-xs sm:text-sm text-stone-400 dark:text-slate-500">
                                      Guide:{' '}
                                      {
                                        team.project.faculty
                                          .firstName
                                      }{' '}
                                      {
                                        team.project.faculty
                                          .lastName
                                      }
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Member count */}
                          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-[#fffaf2] dark:bg-white/[0.03] border border-[#eee4d3] dark:border-white/5 text-xs text-stone-500 dark:text-slate-400 shrink-0 group-hover:border-emerald-100 dark:group-hover:border-emerald-500/10 transition-colors">
                            <Users className="w-3.5 h-3.5 text-emerald-500" />
                            {team.members?.length || 0}{' '}
                            members
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-gradient-to-r from-transparent via-[#eadfce] to-transparent dark:via-white/5 my-5" />

                        {/* MEMBERS HEADER */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                              <Users className="w-3.5 h-3.5 text-emerald-500" />
                            </div>

                            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                              Team Members
                            </span>
                          </div>

                          <span className="text-xs text-stone-400 dark:text-slate-500">
                            {team.members?.length || 0}{' '}
                            allocated
                          </span>
                        </div>

                        {/* MEMBERS */}
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {team.members?.map(
                            (member: any, memberIndex: number) => {
                              const firstName =
                                member.student?.firstName || '';

                              const lastName =
                                member.student?.lastName || '';

                              const initials =
                                `${firstName.charAt(
                                  0
                                )}${lastName.charAt(
                                  0
                                )}`.toUpperCase();

                              return (
                                <div
                                  key={member.id}
                                  className="group/member relative overflow-hidden flex items-center gap-3 p-3.5 rounded-2xl bg-[#fffaf2] dark:bg-white/[0.025] border border-[#eee4d3] dark:border-white/5 hover:bg-[#fff7e9] dark:hover:bg-white/[0.05] hover:border-emerald-200/70 dark:hover:border-emerald-500/10 hover:-translate-y-0.5 transition-all duration-300"
                                  style={{
                                    animation: `resultsFadeUp .5s ease-out ${
                                      0.15 +
                                      memberIndex * 0.06
                                    }s both`,
                                  }}
                                >
                                  <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-200/70 to-transparent opacity-0 group-hover/member:opacity-100 transition-opacity" />

                                  <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/15 dark:to-teal-500/10 border border-emerald-100 dark:border-emerald-500/10 flex items-center justify-center text-emerald-700 dark:text-emerald-400 text-xs font-extrabold group-hover/member:scale-105 transition-transform duration-300">
                                    {initials || '?'}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <p className="text-sm font-semibold text-stone-800 dark:text-white truncate">
                                        {firstName} {lastName}
                                      </p>

                                      {member.role === 'LEADER' && (
                                        <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/10 text-[9px] font-extrabold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                                          <Star className="w-2.5 h-2.5" />
                                          Leader
                                        </span>
                                      )}
                                    </div>

                                    <p className="mt-0.5 text-[11px] sm:text-xs text-stone-400 dark:text-slate-500 font-mono truncate">
                                      {member.student
                                        ?.enrollmentNo ||
                                        'Enrollment unavailable'}
                                    </p>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ========================= FOOTER NOTE ========================= */}
              {!loading && filtered.length > 0 && (
                <div
                  className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-center pt-4"
                  style={{
                    animation: 'resultsFadeUp .7s ease-out .2s both',
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/10 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  </div>

                  <p className="text-xs sm:text-sm text-stone-400 dark:text-slate-500">
                    These results represent finalized project
                    allocations for the selected pool.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ResultsPage;