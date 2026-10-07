// frontend/src/pages/student/StudentDashboard.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { poolService } from '@/services/poolService';
import { teamService } from '@/services/teamService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  GraduationCap,
  Users,
  Lightbulb,
  ArrowRight,
  Sparkles,
  BookOpen,
  Clock,
  CheckCircle2,
  Zap,
  Target,
  Award,
  Crown,
  Shield,
  Gem,
  Trophy,
  Brain,
  Leaf,
  Flower2,
  ListChecks,
  Trees,
  Droplets,
  Sun,
  Wind,
  Bell,
} from 'lucide-react';
import type { Pool, Team } from '@/types';

// Premium Nature-Inspired Gradient Colors
const gradients = {
  brand:
    'linear-gradient(135deg, #11998e 0%, #38ef7d 50%, #a8e6cf 100%)',
  brandAlt:
    'linear-gradient(135deg, #52c234 0%, #061700 50%, #2ecc71 100%)',
  card:
    'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(245,255,250,0.95) 100%)',
  dark:
    'linear-gradient(135deg, #0a2e1f 0%, #1a5c3a 50%, #0d3b24 100%)',
  emerald:
    'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  mint:
    'linear-gradient(135deg, #a8e6cf 0%, #d4f1f4 100%)',
  sage:
    'linear-gradient(135deg, #9cb380 0%, #e4f0c5 100%)',
  forest:
    'linear-gradient(135deg, #2d5a27 0%, #4c9f38 100%)',
  lime:
    'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)',
  teal:
    'linear-gradient(135deg, #00b4db 0%, #0083b0 100%)',
  gold:
    'linear-gradient(135deg, #f5af19 0%, #f12711 50%, #f5af19 100%)',
};

const PROJECT_POOL_ACTIVE_STATUSES = [
  'SELECTION_OPEN',
  'TEAMS_FORMING',
];

const JOURNEY_STAGES = [
  'SUBMISSION_OPEN',
  'UNDER_REVIEW',
  'DECISION_PENDING',
  'SELECTION_OPEN',
  'TEAMS_FORMING',
  'FROZEN',
];

const StudentDashboard: React.FC = () => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [activePools, setActivePools] = useState<Pool[]>([]);

  /*
   * Team information is now tracked per pool.
   * This prevents one active pool from overwriting another pool's
   * team/invite information.
   */
  const [teamsByPool, setTeamsByPool] = useState<
    Record<string, Team | null>
  >({});

  const [invitesByPool, setInvitesByPool] = useState<
    Record<string, number>
  >({});

  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const loadStudentPools = async () => {
      try {
        setLoading(true);

        const response = await poolService.list(1);

        if (!isMounted) return;

        const allPools: Pool[] = Array.isArray(response?.data)
          ? response.data
          : [];

        setPools(allPools);

        /*
         * Students can have multiple assigned pools.
         * Only selection/team-forming pools are considered active
         * for project selection from this dashboard.
         */
        const active = allPools.filter((currentPool) =>
          PROJECT_POOL_ACTIVE_STATUSES.includes(
            currentPool.status
          )
        );

        setActivePools(active);

        /*
         * Load team + invites independently for every relevant pool.
         *
         * We include active pools first and then any other assigned
         * pools that may already contain the student's team.
         */
        const relevantPools = Array.from(
          new Map(
            [...active, ...allPools].map((currentPool) => [
              currentPool.id,
              currentPool,
            ])
          ).values()
        );

        if (relevantPools.length === 0) {
          if (isMounted) {
            setTeamsByPool({});
            setInvitesByPool({});
          }

          return;
        }

        const teamResults = await Promise.all(
          relevantPools.map(async (currentPool) => {
            try {
              const [team, invites] = await Promise.all([
                teamService.getMyTeam(currentPool.id),
                teamService.getMyInvites(currentPool.id),
              ]);

              return {
                poolId: currentPool.id,
                team: team || null,
                inviteCount: Array.isArray(invites)
                  ? invites.length
                  : 0,
              };
            } catch (teamError) {
              console.error(
                `Failed to load team/invites for pool ${currentPool.id}:`,
                teamError
              );

              return {
                poolId: currentPool.id,
                team: null,
                inviteCount: 0,
              };
            }
          })
        );

        if (!isMounted) return;

        const nextTeams: Record<string, Team | null> = {};
        const nextInvites: Record<string, number> = {};

        teamResults.forEach((result) => {
          nextTeams[result.poolId] = result.team;
          nextInvites[result.poolId] = result.inviteCount;
        });

        setTeamsByPool(nextTeams);
        setInvitesByPool(nextInvites);
      } catch (error) {
        console.error('Failed to load student pools:', error);

        if (isMounted) {
          setPools([]);
          setActivePools([]);
          setTeamsByPool({});
          setInvitesByPool({});
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadStudentPools();

    return () => {
      isMounted = false;
    };
  }, []);

  /*
   * Pool with the highest lifecycle progress is used for the
   * large phase banner.
   *
   * Active pools are preferred. If there are multiple active pools,
   * the furthest-progressed pool is shown first.
   */
  const pool = useMemo(() => {
    const candidates =
      activePools.length > 0 ? activePools : pools;

    if (candidates.length === 0) {
      return undefined;
    }

    return [...candidates].sort((a, b) => {
      const aIndex = JOURNEY_STAGES.indexOf(a.status);
      const bIndex = JOURNEY_STAGES.indexOf(b.status);

      return bIndex - aIndex;
    })[0];
  }, [activePools, pools]);

  /*
   * Team for the pool currently shown in the phase banner.
   */
  const myTeam = pool
    ? teamsByPool[pool.id] || null
    : null;

  /*
   * Total pending invites across all assigned pools.
   */
  const inviteCount = Object.values(invitesByPool).reduce(
    (total, count) => total + count,
    0
  );

  /*
   * Total active teams found across all assigned pools.
   */
  const teamCount = Object.values(teamsByPool).filter(
    Boolean
  ).length;

  /*
   * Number of projects/pools currently available to browse.
   *
   * This intentionally represents active allocation pools rather
   * than using a fake hard-coded project count.
   */
  const activePoolCount = activePools.length;

  const phaseInfo = (status: string) => {
    switch (status) {
      case 'SUBMISSION_OPEN':
        return {
          label: 'Submissions Open',
          gradient: gradients.teal,
          icon: (
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          ),
          desc: 'Faculty are submitting proposals',
        };

      case 'UNDER_REVIEW':
        return {
          label: 'Under Review',
          gradient: gradients.gold,
          icon: (
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          ),
          desc: 'Subadmins are reviewing proposals',
        };

      case 'DECISION_PENDING':
        return {
          label: 'Decision Pending',
          gradient: gradients.gold,
          icon: (
            <Target className="w-4 h-4 sm:w-5 sm:h-5" />
          ),
          desc: 'Admin is making final decisions',
        };

      case 'SELECTION_OPEN':
        return {
          label: 'Selection Open',
          gradient: gradients.emerald,
          icon: (
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          ),
          desc: 'Browse and select your project!',
        };

      case 'TEAMS_FORMING':
        return {
          label: 'Teams Forming',
          gradient: gradients.forest,
          icon: (
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          ),
          desc: 'Complete your team now',
        };

      case 'FROZEN':
        return {
          label: 'Frozen',
          gradient: gradients.sage,
          icon: (
            <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
          ),
          desc: 'Allocation complete',
        };

      default:
        return {
          label: status,
          gradient: gradients.brand,
          icon: (
            <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
          ),
          desc: '',
        };
    }
  };

  const phase = pool ? phaseInfo(pool.status) : null;

  /*
   * These are now meaningful dashboard stats instead of fake
   * hard-coded numbers.
   */
  const stats = [
    {
      label: 'Active Pools',
      value: activePoolCount.toString(),
      icon: (
        <Gem className="w-3 h-3 sm:w-4 sm:h-4" />
      ),
      gradient: gradients.emerald,
      color: 'text-emerald-600',
    },
    {
      label: 'My Teams',
      value: teamCount.toString(),
      icon: (
        <Users className="w-3 h-3 sm:w-4 sm:h-4" />
      ),
      gradient: gradients.teal,
      color: 'text-teal-600',
    },
    {
      label: 'Invites',
      value: inviteCount.toString(),
      icon: (
        <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
      ),
      gradient: gradients.gold,
      color: 'text-amber-500',
    },
  ];

  const quickActions = [
    {
      id: 'browse',
      title: 'Browse Projects',
      description:
        'Explore approved projects from your active allocation pools and find your perfect match',
      icon: (
        <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
      ),
      gradient: gradients.emerald,
      /*
       * If multiple pools are available, the active-pool section
       * below gives the exact pool-specific navigation.
       *
       * This fallback still works when there is only one pool.
       */
      path: pool
        ? `/projects?poolId=${encodeURIComponent(pool.id)}`
        : '/projects',
      badge:
        activePoolCount > 0
          ? `${activePoolCount} ${
              activePoolCount === 1 ? 'Pool' : 'Pools'
            } Available`
          : 'No Active Pool',
      stat:
        activePoolCount > 0
          ? '🔥 Browse Now'
          : '⏳ Coming Soon',
    },
    {
      id: 'team',
      title: myTeam ? 'My Team' : 'Form Team',
      description: myTeam
        ? `Team: ${myTeam.name}`
        : 'Create or join a team with peers',
      icon: (
        <Users className="w-5 h-5 sm:w-6 sm:h-6" />
      ),
      gradient: gradients.teal,
      path: pool
        ? `/my-team?poolId=${encodeURIComponent(pool.id)}`
        : '/my-team',
      badge: myTeam
        ? `${
            myTeam.members?.filter(
              (m) => m.status === 'ACTIVE'
            ).length || 0
          } members`
        : 'Start Building',
      stat: '👥 Team Activity',
      notification: inviteCount,
    },
    {
      id: 'ideas',
      title: 'Submit Idea',
      description:
        'Propose your own project idea to admins for approval',
      icon: (
        <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6" />
      ),
      gradient: gradients.gold,
      path: '/ideas',
      badge: 'Get Approved',
      stat: '💡 Innovation Hub',
    },
  ];

  const achievements = [
    {
      label: 'Projects Completed',
      value: '0',
      icon: <Award className="w-4 h-4" />,
      color: 'from-emerald-400 to-teal-500',
    },
    {
      label: 'Team Streak',
      value: teamCount.toString(),
      icon: <Flower2 className="w-4 h-4" />,
      color: 'from-teal-400 to-emerald-500',
    },
    {
      label: 'Ideas Submitted',
      value: '0',
      icon: <Lightbulb className="w-4 h-4" />,
      color: 'from-amber-400 to-yellow-500',
    },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden"
      style={{
        background:
          'radial-gradient(circle at 10% 20%, #e8f5e9 0%, #c8e6c9 50%, #a5d6a7 100%)',
        position: 'relative',
      }}
    >
      {/* Animated Nature Elements - Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 opacity-10 animate-float">
          <Leaf className="w-full h-full text-emerald-600" />
        </div>

        <div className="absolute bottom-20 right-10 w-40 h-40 opacity-10 animate-float-delayed">
          <Flower2 className="w-full h-full text-teal-600" />
        </div>

        <div className="absolute top-1/2 left-1/4 w-24 h-24 opacity-5 animate-spin-slow">
          <Sun className="w-full h-full text-amber-500" />
        </div>

        <div className="absolute bottom-1/3 right-1/4 w-28 h-28 opacity-10 animate-bounce-slow">
          <Droplets className="w-full h-full text-emerald-400" />
        </div>

        <div className="absolute top-1/3 right-10 w-20 h-20 opacity-5 animate-pulse-slow">
          <Wind className="w-full h-full text-teal-500" />
        </div>
      </div>

      <div className="relative z-10 w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-4 sm:py-6 md:py-8 lg:py-10 space-y-4 sm:space-y-6 md:space-y-8 lg:space-y-10">
        {/* Hero Welcome Section - Glassmorphic Premium */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 rounded-3xl blur-2xl opacity-25 group-hover:opacity-40 transition duration-1000" />

          <div className="relative backdrop-blur-xl bg-white/30 rounded-3xl p-6 sm:p-8 md:p-10 border border-white/40 shadow-2xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="p-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30 animate-pulse-slow">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>

                  <div className="px-3 py-1 rounded-full bg-white/40 backdrop-blur-sm border border-white/60">
                    <span className="text-xs sm:text-sm font-semibold text-emerald-800 uppercase tracking-wider">
                      ✨ Welcome Back, Star Student ✨
                    </span>
                  </div>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold bg-gradient-to-r from-emerald-700 via-teal-600 to-green-600 bg-clip-text text-transparent">
                  Student Dashboard
                </h1>

                <p className="text-sm sm:text-base md:text-lg text-emerald-700/80 mt-2 sm:mt-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Track your project allocation progress and team status
                </p>
              </div>

              {/* Achievement Badges */}
              <div className="flex gap-3">
                {achievements.map((ach, idx) => (
                  <div key={idx} className="group/ach relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl blur-md opacity-0 group-hover/ach:opacity-50 transition duration-500" />

                    <div className="relative bg-white/40 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/60 text-center min-w-[90px] hover:scale-105 transition-transform duration-300">
                      <div
                        className={`p-1.5 rounded-xl bg-gradient-to-r ${ach.color} inline-flex mb-1`}
                      >
                        {ach.icon}
                      </div>

                      <p className="text-xl font-bold text-emerald-800">
                        {ach.value}
                      </p>

                      <p className="text-[10px] text-emerald-600 font-medium">
                        {ach.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Active Project Pools */}
        {activePools.length > 0 && (
          <div className="relative group animate-fade-in-up">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition duration-700" />

            <div className="relative rounded-3xl bg-white/75 backdrop-blur-xl border border-white/70 shadow-xl overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500" />

              <div className="p-5 sm:p-6 md:p-7">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg">
                        <Trees className="w-5 h-5 text-white" />
                      </div>

                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-emerald-900">
                          Active Project Pools
                        </h2>

                        <p className="text-xs sm:text-sm text-emerald-700/70 mt-0.5">
                          Choose from the currently active project allocation pools
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>

                    {activePools.length}{' '}
                    {activePools.length === 1
                      ? 'Active Pool'
                      : 'Active Pools'}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {activePools.map((currentPool, index) => {
                    const currentPhase = phaseInfo(
                      currentPool.status
                    );

                    const poolTeam =
                      teamsByPool[currentPool.id] || null;

                    const poolInvites =
                      invitesByPool[currentPool.id] || 0;

                    const activeMemberCount =
                      poolTeam?.members?.filter(
                        (member) => member.status === 'ACTIVE'
                      ).length || 0;

                    return (
                      <div
                        key={currentPool.id}
                        className="group/pool relative overflow-hidden rounded-2xl border border-emerald-100 bg-white/80 shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
                      >
                        <div
                          className="absolute inset-x-0 top-0 h-1"
                          style={{
                            background: currentPhase.gradient,
                          }}
                        />

                        <div className="p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-md group-hover/pool:scale-110 transition-transform duration-300"
                                style={{
                                  background: currentPhase.gradient,
                                }}
                              >
                                {currentPhase.icon}
                              </div>

                              <div className="min-w-0">
                                <h3 className="font-bold text-gray-800 text-base sm:text-lg truncate">
                                  {currentPool.name}
                                </h3>

                                <p className="text-xs text-gray-500 mt-0.5">
                                  Project Allocation Pool
                                </p>
                              </div>
                            </div>

                            <span className="flex-shrink-0 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide">
                              Active
                            </span>
                          </div>

                          <div className="mt-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                {currentPhase.icon}
                              </div>

                              <div>
                                <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-600">
                                  Current Phase
                                </p>

                                <p className="text-sm font-semibold text-gray-800">
                                  {currentPhase.label}
                                </p>
                              </div>
                            </div>

                            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                              {currentPhase.desc}
                            </p>
                          </div>

                          {/* Pool-specific team information */}
                          {poolTeam && (
                            <div className="mt-3 rounded-xl bg-white border border-emerald-100 p-3">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Users className="w-4 h-4 text-emerald-600 flex-shrink-0" />

                                  <span className="text-xs font-semibold text-gray-700 truncate">
                                    {poolTeam.name}
                                  </span>
                                </div>

                                <span className="text-[9px] font-bold text-emerald-600 whitespace-nowrap">
                                  {activeMemberCount}{' '}
                                  {activeMemberCount === 1
                                    ? 'member'
                                    : 'members'}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Pool-specific invite count */}
                          {poolInvites > 0 && (
                            <div className="mt-3 flex items-center gap-2 rounded-xl bg-pink-50 border border-pink-200 px-3 py-2">
                              <Bell className="w-3.5 h-3.5 text-pink-600 animate-pulse" />

                              <span className="text-[11px] font-semibold text-pink-700">
                                {poolInvites}{' '}
                                {poolInvites === 1
                                  ? 'team invite'
                                  : 'team invites'}{' '}
                                waiting
                              </span>
                            </div>
                          )}

                          <button
                            onClick={() =>
                              navigate(
                                `/projects?poolId=${encodeURIComponent(
                                  currentPool.id
                                )}`
                              )
                            }
                            className="relative w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                            style={{
                              background: currentPhase.gradient,
                            }}
                          >
                            <span className="relative z-10 flex items-center gap-2">
                              Browse Projects
                              <ArrowRight className="w-4 h-4 group-hover/pool:translate-x-1 transition-transform" />
                            </span>

                            <div className="absolute inset-0 -translate-x-full group-hover/pool:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                          </button>

                          {index === 0 && (
                            <p className="text-[10px] text-center text-emerald-600/70 mt-2">
                              Latest active pool
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Active Pools Notice */}
        {activePools.length === 0 && pools.length > 0 && (
          <div className="relative group animate-fade-in-up">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400 rounded-3xl blur-xl opacity-20" />

            <div className="relative rounded-3xl bg-white/75 backdrop-blur-xl border border-white/70 shadow-xl overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500" />

              <div className="p-6 sm:p-8 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg mb-4">
                  <Clock className="w-7 h-7 text-white" />
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-emerald-900">
                  No Active Project Selection Pool
                </h2>

                <p className="text-sm text-emerald-700/70 mt-2 max-w-xl mx-auto">
                  Your assigned pools are currently in another phase.
                  You will be able to browse projects when selection or
                  team formation opens.
                </p>

                <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {pools.length}{' '}
                  {pools.length === 1
                    ? 'assigned pool'
                    : 'assigned pools'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notice Alert Banner - For Decision Pending Phase */}
        {pool &&
          (pool.status === 'DECISION_PENDING' ||
            pool.status === 'UNDER_REVIEW') &&
          !myTeam && (
            <div className="relative group animate-fade-in-up">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-2xl blur-xl opacity-70 animate-pulse" />

              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 border-2 border-amber-400 shadow-2xl">
                {/* Animated Warning Stripes */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,#000_0px,#000_2px,transparent_2px,transparent_8px)]" />
                </div>

                <div className="relative p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />

                      <div className="relative w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-red-500 flex items-center justify-center shadow-lg">
                        <Bell className="w-6 h-6 text-white animate-bounce" />
                      </div>
                    </div>

                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-red-700 flex items-center gap-2">
                        ⚠️ IMPORTANT NOTICE ⚠️

                        <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] animate-pulse">
                          URGENT
                        </span>
                      </h4>

                      <p className="text-sm sm:text-base text-orange-800 font-semibold mt-1">
                        Fast create your team manually because team and
                        project selection phase will open soon!
                      </p>

                      <p className="text-xs text-amber-700 mt-0.5">
                        Don't wait until the last moment - form your team
                        now to be ready for project selection.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => navigate('/what-to-do')}
                      className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105 overflow-hidden shadow-md bg-white/80 backdrop-blur-sm border border-amber-300"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-600" />
                        Learn How?
                      </span>
                    </button>
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="relative h-1 bg-gradient-to-r from-amber-200 via-orange-200 to-red-200">
                  <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-amber-500 to-red-500 rounded-full animate-shimmer" />
                </div>
              </div>
            </div>
          )}

        {/* Phase Banner - Premium Ultra-Modern Design */}
        {pool && phase && (
          <div
            className="relative group overflow-hidden rounded-3xl shadow-2xl"
            style={{ background: phase.gradient }}
          >
            {/* Animated Gradient Orbs */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/20 rounded-full blur-3xl animate-pulse-slow" />

              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/20 rounded-full blur-3xl animate-pulse-slow delay-1000" />

              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-spin-slow" />
            </div>

            {/* Shine Border */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

            <div className="relative p-6 sm:p-8 md:p-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-medium px-4 py-1.5 rounded-full bg-white/30 backdrop-blur-sm text-white mb-4 border border-white/40 shadow-lg">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />

                    <Sparkles className="h-3 w-3 animate-spin-slow" />

                    {pool.name}

                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  </div>

                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 rounded-2xl bg-white/30 backdrop-blur-sm shadow-lg transform group-hover:scale-110 transition-transform duration-500">
                      {phase.icon}
                    </div>

                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-lg tracking-tight">
                      {phase.label}
                    </h2>
                  </div>

                  <p className="text-white/95 text-base sm:text-lg max-w-lg flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    {phase.desc}
                  </p>

                  <button
                    onClick={() => navigate('/what-to-do')}
                    className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 hover:scale-105 overflow-hidden shadow-xl mt-4"
                    style={{
                      background:
                        'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
                      color: 'white',
                    }}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <ListChecks className="w-4 h-4 animate-pulse" />
                      DON'T KNOW WHAT TO DO?
                      <ListChecks className="w-4 h-4 animate-pulse" />
                    </span>

                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {stats.map((stat, idx) => (
                    <div
                      key={idx}
                      className="relative group/stat overflow-hidden rounded-2xl bg-white/20 backdrop-blur-md px-3 sm:px-5 py-2 sm:py-3 transition-all hover:scale-105 hover:bg-white/30 cursor-pointer border border-white/30"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/stat:translate-x-full transition-transform duration-700" />

                      <div className="relative">
                        <div className="flex items-center gap-2 text-white/90 text-[10px] sm:text-xs uppercase tracking-wider">
                          {stat.icon}

                          <span className="hidden sm:inline">
                            {stat.label}
                          </span>
                        </div>

                        <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white mt-1">
                          {stat.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Premium Journey Timeline */}
              <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-white/30">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-xl bg-white/20 backdrop-blur-sm">
                      <Target className="w-4 h-4 text-white" />
                    </div>

                    <span className="text-xs sm:text-sm font-semibold text-white/90 uppercase tracking-wider">
                      Your Success Journey
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-20 h-px bg-white/30" />

                    <span className="text-[10px] text-white/90 font-mono">
                      6 STAGES
                    </span>

                    <div className="w-20 h-px bg-white/30" />
                  </div>
                </div>

                {/* Modern Stepper Design */}
                <div className="relative">
                  {/* Background Track */}
                  <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/20 rounded-full" />

                  <div className="relative flex justify-between items-center">
                    {[
                      {
                        label: 'Submit',
                        icon: <Sparkles className="w-3 h-3" />,
                        stage: 1,
                        emoji: '📝',
                        description: 'Faculty submits proposals',
                      },
                      {
                        label: 'Review',
                        icon: <Clock className="w-3 h-3" />,
                        stage: 2,
                        emoji: '🔍',
                        description: 'Subadmins review',
                      },
                      {
                        label: 'Decision',
                        icon: <Target className="w-3 h-3" />,
                        stage: 3,
                        emoji: '⚖️',
                        description: 'Admin decides',
                      },
                      {
                        label: 'Project Select',
                        icon: (
                          <CheckCircle2 className="w-3 h-3" />
                        ),
                        stage: 4,
                        emoji: '🎯',
                        description: 'Students select',
                      },
                      {
                        label: 'Team',
                        icon: <Users className="w-3 h-3" />,
                        stage: 5,
                        emoji: '🤝',
                        description: 'Teams form',
                      },
                      {
                        label: 'Final',
                        icon: <Award className="w-3 h-3" />,
                        stage: 6,
                        emoji: '🏆',
                        description: 'Allocation complete',
                      },
                    ].map((stage, idx) => {
                      const currentIdx = JOURNEY_STAGES.indexOf(
                        pool.status
                      );

                      const isCompleted = idx < currentIdx;
                      const isActive = idx === currentIdx;

                      return (
                        <div
                          key={stage.label}
                          className="flex-1 relative group/step"
                        >
                          {/* Connector Line */}
                          {idx > 0 && (
                            <div
                              className={`absolute top-5 left-0 w-full h-0.5 transition-all duration-700 ${
                                isCompleted
                                  ? 'bg-white shadow-lg'
                                  : 'bg-white/20'
                              }`}
                              style={{
                                left: '-50%',
                                width: '100%',
                              }}
                            />
                          )}

                          {/* Step Node */}
                          <div className="relative z-10 flex flex-col items-center">
                            {/* Pulse Ring for Active Step */}
                            {isActive && (
                              <div className="absolute -inset-2 rounded-full">
                                <div className="absolute inset-0 rounded-full bg-white animate-ping opacity-75" />

                                <div className="absolute inset-0 rounded-full bg-white animate-pulse" />
                              </div>
                            )}

                            {/* Node Circle */}
                            <div
                              className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-500 cursor-pointer group-hover/step:scale-110 ${
                                isCompleted
                                  ? 'bg-white shadow-xl shadow-white/50 scale-105'
                                  : isActive
                                    ? 'bg-white shadow-2xl shadow-white/50 scale-110 ring-4 ring-white/30'
                                    : 'bg-white/30 backdrop-blur-sm border-2 border-white/50'
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                              ) : (
                                <span className="text-white font-bold text-sm sm:text-base">
                                  {stage.stage}
                                </span>
                              )}
                            </div>

                            {/* Label */}
                            <div className="mt-3 text-center">
                              <div
                                className={`flex items-center gap-1 justify-center mb-1 transition-all duration-300 ${
                                  isActive ? 'scale-110' : ''
                                }`}
                              >
                                <span className="text-sm sm:text-base">
                                  {stage.emoji}
                                </span>

                                <span
                                  className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
                                    isActive
                                      ? 'text-white drop-shadow-lg'
                                      : 'text-white/90'
                                  }`}
                                >
                                  {stage.label}
                                </span>
                              </div>

                              <p className="text-[8px] sm:text-[10px] text-white/80 hidden sm:block">
                                {stage.description}
                              </p>
                            </div>

                            {/* Status Badge for Active Step */}
                            {isActive && (
                              <div className="absolute -bottom-8 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[8px] font-bold text-white border border-white/40">
                                  <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
                                  CURRENT STAGE
                                </span>
                              </div>
                            )}

                            {/* Completion Checkmark */}
                            {isCompleted && (
                              <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3">
                                <div className="bg-emerald-500 rounded-full p-0.5 shadow-lg">
                                  <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Progress Bar with Percentage */}
                <div className="mt-10 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-white/70 font-mono">
                      PROGRESS
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        {Math.round(
                          ((JOURNEY_STAGES.indexOf(pool.status) + 1) /
                            JOURNEY_STAGES.length) *
                            100
                        )}
                        %
                      </span>

                      <div className="w-16 h-px bg-white/30" />

                      <span className="text-[10px] text-white/90">
                        COMPLETE
                      </span>
                    </div>
                  </div>

                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-1000 ease-out relative"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(
                            100,
                            ((JOURNEY_STAGES.indexOf(
                              pool.status
                            ) + 1) /
                              JOURNEY_STAGES.length) *
                              100
                          )
                        )}%`,
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
                    </div>
                  </div>
                </div>

                {/* Milestone Completion Summary */}
                <div className="mt-6 pt-3 flex flex-wrap gap-2 justify-center">
                  {JOURNEY_STAGES.map((status, idx) => {
                    const currentIdx = JOURNEY_STAGES.indexOf(
                      pool.status
                    );

                    const isCompleted = idx < currentIdx;
                    const isCurrent = idx === currentIdx;

                    if (isCompleted) {
                      return (
                        <div
                          key={status}
                          className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm"
                        >
                          <CheckCircle2 className="w-2.5 h-2.5 text-white" />

                          <span className="text-[8px] text-white font-medium capitalize">
                            {status
                              .replace(/_/g, ' ')
                              .toLowerCase()}
                          </span>
                        </div>
                      );
                    }

                    if (isCurrent) {
                      return (
                        <div
                          key={status}
                          className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/30 backdrop-blur-sm border border-white/40 animate-pulse"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />

                          <span className="text-[8px] text-white font-bold capitalize">
                            {status
                              .replace(/_/g, ' ')
                              .toLowerCase()}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={status}
                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm opacity-50"
                      >
                        <div className="w-1 h-1 rounded-full bg-white/50" />

                        <span className="text-[7px] text-white/50 capitalize">
                          {status
                            .replace(/_/g, ' ')
                            .toLowerCase()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Action Cards - 3D Premium Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
          {quickActions.map((action) => (
            <div
              key={action.id}
              onClick={() => navigate(action.path)}
              onMouseEnter={() =>
                setHoveredCard(action.id)
              }
              onMouseLeave={() => setHoveredCard(null)}
              className="group relative cursor-pointer transition-all duration-500 hover:-translate-y-3"
            >
              {/* 3D Shadow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition duration-500" />

              <div
                className="relative rounded-2xl overflow-hidden transition-all duration-500 group-hover:shadow-3xl"
                style={{
                  background: gradients.card,
                  boxShadow:
                    '0 20px 40px -12px rgba(0,0,0,0.15)',
                }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-700"
                  style={{
                    background: action.gradient,
                    filter: 'blur(30px)',
                  }}
                />

                <div className="absolute inset-px rounded-2xl bg-white/95" />

                <div
                  className="absolute inset-x-0 top-0 h-1"
                  style={{
                    background: action.gradient,
                  }}
                />

                <div className="relative p-5 sm:p-6 md:p-7">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`p-3 rounded-xl transition-all duration-500 ${
                        hoveredCard === action.id
                          ? 'scale-110 rotate-3'
                          : ''
                      }`}
                      style={{
                        background: action.gradient,
                      }}
                    >
                      <div className="text-white">
                        {action.icon}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {action.notification &&
                        action.notification > 0 && (
                          <div className="relative">
                            <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />

                            <div className="relative bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] sm:text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                              {action.notification} new
                            </div>
                          </div>
                        )}

                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center group-hover:translate-x-1 transition-transform duration-300">
                        <ArrowRight className="w-4 h-4 text-emerald-600" />
                      </div>
                    </div>
                  </div>

                  <h3 className="font-bold text-xl sm:text-2xl text-gray-800 mb-2">
                    {action.title}
                  </h3>

                  <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">
                    {action.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                      <Sparkles className="w-3 h-3" />
                      {action.badge}
                    </div>

                    <div className="text-[10px] text-emerald-400 font-medium text-right">
                      {action.stat}
                    </div>
                  </div>
                </div>

                {/* Shine Effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              </div>
            </div>
          ))}
        </div>

        {/* Team Info Section - Premium Nature Card */}
        {myTeam && (
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400 rounded-3xl blur-xl opacity-0 group-hover:opacity-50 transition duration-700" />

            <div
              className="relative rounded-3xl overflow-hidden transition-all duration-500 group-hover:shadow-3xl"
              style={{ background: gradients.card }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent" />

              <div
                className="absolute inset-x-0 top-0 h-1.5"
                style={{ background: gradients.brand }}
              />

              <div className="relative px-5 sm:px-6 md:px-7 py-4 sm:py-5 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>

                  <div>
                    <h3 className="font-bold text-xl sm:text-2xl text-gray-800">
                      {myTeam.name}
                    </h3>

                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />

                      {myTeam.members?.filter(
                        (m) => m.status === 'ACTIVE'
                      ).length || 0}{' '}
                      active members
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    {myTeam.status}
                  </span>

                  {myTeam.isFrozen && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                      <Shield className="w-3 h-3" />
                      FROZEN
                    </span>
                  )}
                </div>
              </div>

              <div className="relative p-5 sm:p-6 md:p-7">
                {myTeam.project && (
                  <div className="mb-5 rounded-xl p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md">
                        <BookOpen className="w-4 h-4 text-white" />
                      </div>

                      <div className="flex-1">
                        <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Selected Project
                        </p>

                        <p className="font-bold text-gray-800 mt-1 text-base break-words">
                          {myTeam.project.title}
                        </p>

                        <p className="text-xs text-emerald-600 mt-1">
                          {myTeam.project.domain ||
                            'No domain specified'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 rounded-lg bg-gradient-to-r from-emerald-100 to-teal-100">
                    <Users className="w-4 h-4 text-emerald-600" />
                  </div>

                  <h4 className="font-semibold text-gray-700">
                    Team Members
                  </h4>

                  <div className="flex-1 h-px bg-gradient-to-r from-emerald-200 to-transparent" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {myTeam.members
                    ?.filter((m) => m.status === 'ACTIVE')
                    .map((m) => (
                      <div
                        key={m.id}
                        className="group/member flex items-center gap-3 rounded-xl p-3 border border-emerald-100 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:border-emerald-300 bg-white/80"
                      >
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                            {m.student.firstName?.[0] || ''}
                            {m.student.lastName?.[0] || ''}
                          </div>

                          {m.role === 'LEADER' && (
                            <div className="absolute -top-1 -right-1">
                              <div className="bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full p-0.5 shadow-lg">
                                <Crown className="w-2.5 h-2.5 text-white" />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-sm text-gray-800 truncate">
                              {m.student.firstName}{' '}
                              {m.student.lastName}
                            </span>

                            {m.role === 'LEADER' && (
                              <span className="text-[9px] bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">
                                Leader
                              </span>
                            )}
                          </div>

                          <p className="text-[10px] text-gray-500 font-mono truncate">
                            {m.student.enrollmentNo}
                          </p>
                        </div>

                        <div className="opacity-0 group-hover/member:opacity-100 transition-opacity">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CTA Banner - Stunning Nature Call to Action */}
        <div
          className="relative group overflow-hidden rounded-3xl transition-all duration-500 hover:shadow-2xl"
          style={{ background: gradients.dark }}
        >
          {/* Animated Nature Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl animate-pulse-slow"
              style={{
                background:
                  'radial-gradient(circle, rgba(56,239,125,0.3) 0%, rgba(17,153,142,0.1) 100%)',
              }}
            />

            <div
              className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl animate-pulse-slow delay-1000"
              style={{
                background:
                  'radial-gradient(circle, rgba(168,230,207,0.3) 0%, rgba(17,153,142,0.1) 100%)',
              }}
            />
          </div>

          <div className="absolute -top-10 -right-10 w-40 h-40 opacity-10 animate-float">
            <Leaf className="w-full h-full text-white" />
          </div>

          <div className="absolute -bottom-10 -left-10 w-32 h-32 opacity-10 animate-float-delayed">
            <Flower2 className="w-full h-full text-white" />
          </div>

          <div className="relative z-10 p-8 sm:p-10 md:p-12 text-center">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 blur-xl animate-pulse" />

              <div className="relative w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-white/30 animate-ping" />

                  <Brain className="w-8 h-8 text-white relative z-10" />
                </div>
              </div>
            </div>

            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
              🌟 Ready to Start Your Journey? 🌟
            </h3>

            <p className="text-white/80 mb-6 max-w-lg mx-auto text-base sm:text-lg">
              Read our comprehensive guide to understand team formation and project selection
            </p>

            <button
              onClick={() => navigate('/what-to-do')}
              className="group relative inline-flex items-center gap-2 px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-bold transition-all duration-300 hover:scale-105 overflow-hidden text-base sm:text-lg"
              style={{
                background: gradients.brand,
                color: 'white',
                boxShadow:
                  '0 20px 40px -12px rgba(17,153,142,0.5)',
              }}
            >
              <span className="relative z-10 flex items-center gap-2">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform" />

                Discover What To Do

                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </span>

              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </button>
          </div>
        </div>

        {/* Bottom Decoration */}
        <div className="text-center mt-6 sm:mt-8">
          <div className="inline-flex items-center gap-2 text-xs text-emerald-600/60">
            <div className="w-1 h-1 rounded-full bg-emerald-400" />

            <span>
              🌿 Powered by Project Allocation System
            </span>

            <div className="w-1 h-1 rounded-full bg-emerald-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;