import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { poolService } from '@/services/poolService';
import { teamService } from '@/services/teamService';
import { Badge } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  GraduationCap, Users, Lightbulb, Mail, ArrowRight,
  Sparkles, BookOpen, Clock, CheckCircle2, Zap, TrendingUp,
  Target, Award, Star, Crown, Shield, Gem, Rocket, 
  Palette, Compass, Trophy, Coffee, Brain, Activity, 
  Leaf, Flower2, Trees, Droplets, Sun, Wind,
  Bell
} from 'lucide-react';
import type { Pool, Team } from '@/types';

// Premium Nature-Inspired Gradient Colors
const gradients = {
  brand: 'linear-gradient(135deg, #11998e 0%, #38ef7d 50%, #a8e6cf 100%)',
  brandAlt: 'linear-gradient(135deg, #52c234 0%, #061700 50%, #2ecc71 100%)',
  card: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(245,255,250,0.95) 100%)',
  dark: 'linear-gradient(135deg, #0a2e1f 0%, #1a5c3a 50%, #0d3b24 100%)',
  emerald: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  mint: 'linear-gradient(135deg, #a8e6cf 0%, #d4f1f4 100%)',
  sage: 'linear-gradient(135deg, #9cb380 0%, #e4f0c5 100%)',
  forest: 'linear-gradient(135deg, #2d5a27 0%, #4c9f38 100%)',
  lime: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)',
  teal: 'linear-gradient(135deg, #00b4db 0%, #0083b0 100%)',
  gold: 'linear-gradient(135deg, #f5af19 0%, #f12711 50%, #f5af19 100%)',
};

const StudentDashboard: React.FC = () => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [inviteCount, setInviteCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    poolService.list().then(async r => {
      const p = r.data || [];
      setPools(p);
      if (p.length) {
        const [t, inv] = await Promise.all([teamService.getMyTeam(p[0].id), teamService.getMyInvites(p[0].id)]);
        setMyTeam(t); setInviteCount(inv?.length || 0);
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  const pool = pools[0];

  const phaseInfo = (status: string) => {
    switch (status) {
      case 'SUBMISSION_OPEN': return { label: 'Submissions Open', gradient: gradients.teal, icon: <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />, desc: 'Faculty are submitting proposals' };
      case 'UNDER_REVIEW': return { label: 'Under Review', gradient: gradients.gold, icon: <Clock className="w-4 h-4 sm:w-5 sm:h-5" />, desc: 'Subadmins are reviewing proposals' };
      case 'DECISION_PENDING': return { label: 'Decision Pending', gradient: gradients.gold, icon: <Target className="w-4 h-4 sm:w-5 sm:h-5" />, desc: 'Admin is making final decisions' };
      case 'SELECTION_OPEN': return { label: 'Selection Open', gradient: gradients.emerald, icon: <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />, desc: 'Browse and select your project!' };
      case 'TEAMS_FORMING': return { label: 'Teams Forming', gradient: gradients.forest, icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" />, desc: 'Complete your team now' };
      case 'FROZEN': return { label: 'Frozen', gradient: gradients.sage, icon: <Shield className="w-4 h-4 sm:w-5 sm:h-5" />, desc: 'Allocation complete' };
      default: return { label: status, gradient: gradients.brand, icon: <Zap className="w-4 h-4 sm:w-5 sm:h-5" />, desc: '' };
    }
  };

  const phase = pool ? phaseInfo(pool.status) : null;

  const stats = [
    { label: 'Active Projects', value: '43+', icon: <Gem className="w-3 h-3 sm:w-4 sm:h-4" />, gradient: gradients.emerald, color: 'text-emerald-600' },
    { label: 'Teams Formed', value: '28', icon: <Users className="w-3 h-3 sm:w-4 sm:h-4" />, gradient: gradients.teal, color: 'text-teal-600' },
    { label: 'Success Rate', value: '94%', icon: <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />, gradient: gradients.gold, color: 'text-amber-500' },
  ];

  const quickActions = [
    {
      id: 'browse',
      title: 'Browse Projects',
      description: 'Explore approved projects and find your perfect match',
      icon: <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />,
      gradient: gradients.emerald,
      path: '/projects',
      badge: '43+ Available',
      stat: '🔥 Hot Projects'
    },
    {
      id: 'team',
      title: myTeam ? 'My Team' : 'Form Team',
      description: myTeam ? `Team: ${myTeam.name}` : 'Create or join a team with peers',
      icon: <Users className="w-5 h-5 sm:w-6 sm:h-6" />,
      gradient: gradients.teal,
      path: '/my-team',
      badge: myTeam ? `${myTeam.members?.filter(m => m.status === 'ACTIVE').length || 0} members` : 'Start Building',
      stat: '👥 Team Activity',
      notification: inviteCount
    },
    {
      id: 'ideas',
      title: 'Submit Idea',
      description: 'Propose your own project idea to admins for approval',
      icon: <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6" />,
      gradient: gradients.gold,
      path: '/ideas',
      badge: 'Get Approved',
      stat: '💡 Innovation Hub'
    },
  ];

  const achievements = [
    { label: 'Projects Completed', value: '0', icon: <Award className="w-4 h-4" />, color: 'from-emerald-400 to-teal-500' },
    { label: 'Team Streak', value: '0', icon: <Flower2 className="w-4 h-4" />, color: 'from-teal-400 to-emerald-500' },
    { label: 'Ideas Submitted', value: '0', icon: <Lightbulb className="w-4 h-4" />, color: 'from-amber-400 to-yellow-500' },
  ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden" style={{ 
      background: 'radial-gradient(circle at 10% 20%, #e8f5e9 0%, #c8e6c9 50%, #a5d6a7 100%)',
      position: 'relative'
    }}>
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
                    <span className="text-xs sm:text-sm font-semibold text-emerald-800 uppercase tracking-wider">✨ Welcome Back, Star Student ✨</span>
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
                      <div className={`p-1.5 rounded-xl bg-gradient-to-r ${ach.color} inline-flex mb-1`}>
                        {ach.icon}
                      </div>
                      <p className="text-xl font-bold text-emerald-800">{ach.value}</p>
                      <p className="text-[10px] text-emerald-600 font-medium">{ach.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>


                {/* Notice Alert Banner - For Decision Pending Phase */}
         {pool && (pool.status === 'DECISION_PENDING' || pool.status === 'UNDER_REVIEW') && !myTeam && (
            <div className="relative group animate-fade-in-up">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-2xl blur-xl opacity-70 animate-pulse" />
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 border-2 border-amber-400 shadow-2xl">
                {/* Animated Warning Stripes */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg, #000 0px, #000 2px, transparent 2px, transparent 8px)]" />
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
                        <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] animate-pulse">URGENT</span>
                      </h4>
                      <p className="text-sm sm:text-base text-orange-800 font-semibold mt-1">
                        Fast create your team manually because team and project selection phase will open soon!
                      </p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Don't wait until the last moment - form your team now to be ready for project selection.
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
          <div className="relative group overflow-hidden rounded-3xl shadow-2xl" style={{ background: phase.gradient }}>
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
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-lg tracking-tight">{phase.label}</h2>
                  </div>
                  <p className="text-white/95 text-base sm:text-lg max-w-lg flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    {phase.desc}
                  </p>

                  <button
                    onClick={() => navigate('/what-to-do')}
                    className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 hover:scale-105 overflow-hidden shadow-xl"
                    style={{ background: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)', color: 'white' }}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <Bell className="w-4 h-4 animate-pulse" />
                      ⚠️ DON'T KNOW WHAT TO DO?
                      <Bell className="w-4 h-4 animate-pulse" />
                    </span>
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  </button>
                </div>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {stats.map((stat, idx) => (
                    <div key={idx} className="relative group/stat overflow-hidden rounded-2xl bg-white/20 backdrop-blur-md px-3 sm:px-5 py-2 sm:py-3 transition-all hover:scale-105 hover:bg-white/30 cursor-pointer border border-white/30">
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/stat:translate-x-full transition-transform duration-700" />
                      <div className="relative">
                        <div className="flex items-center gap-2 text-white/90 text-[10px] sm:text-xs uppercase tracking-wider">
                          {stat.icon}
                          <span className="hidden sm:inline">{stat.label}</span>
                        </div>
                        <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white mt-1">
                          {stat.value}
                          <span className="text-xs opacity-70 ml-0.5">↑</span>
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
                    <span className="text-[10px] text-white/90 font-mono">6 STAGES</span>
                    <div className="w-20 h-px bg-white/30" />
                  </div>
                </div>
                

                {/* Modern Stepper Design */}
                <div className="relative">
                
                  {/* Background Track */}
                  <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/20 rounded-full" />
                  
                  <div className="relative flex justify-between items-center">
                    {[
                      { label: 'Submit', icon: <Sparkles className="w-3 h-3" />, stage: 1, emoji: '📝', description: 'Faculty submits proposals' },
                      { label: 'Review', icon: <Clock className="w-3 h-3" />, stage: 2, emoji: '🔍', description: 'Subadmins review' },
                      { label: 'Decision', icon: <Target className="w-3 h-3" />, stage: 3, emoji: '⚖️', description: 'Admin decides' },
                      { label: 'Project Select', icon: <CheckCircle2 className="w-3 h-3" />, stage: 4, emoji: '🎯', description: 'Students select' },
                      { label: 'Team', icon: <Users className="w-3 h-3" />, stage: 5, emoji: '🤝', description: 'Teams form' },
                      { label: 'Final', icon: <Award className="w-3 h-3" />, stage: 6, emoji: '🏆', description: 'Allocation complete' },
                    ]
                    .map((stage, idx) => {
                      const stages = ['SUBMISSION_OPEN', 'UNDER_REVIEW', 'DECISION_PENDING', 'SELECTION_OPEN', 'TEAMS_FORMING', 'FROZEN'];
                      const currentIdx = stages.indexOf(pool.status);
                      const isCompleted = idx < currentIdx;
                      const isActive = idx === currentIdx;
                      const isUpcoming = idx > currentIdx;

                      return (
                        <div key={stage.label} className="flex-1 relative group/step">
                          {/* Connector Line */}
                          {idx > 0 && (
                            <div className={`absolute top-5 left-0 w-full h-0.5 transition-all duration-700 ${
                              isCompleted ? 'bg-white shadow-lg' : 'bg-white/20'
                            }`} style={{ left: '-50%', width: '100%' }} />
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
                                <span className="text-white font-bold text-sm sm:text-base">{stage.stage}</span>
                              )}
                            </div>
                            
                            {/* Label */}
                            <div className="mt-3 text-center">
                              <div className={`flex items-center gap-1 justify-center mb-1 transition-all duration-300 ${
                                isActive ? 'scale-110' : ''
                              }`}>
                                <span className="text-sm sm:text-base">{stage.emoji}</span>
                                <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
                                  isActive ? 'text-white drop-shadow-lg' : isCompleted ? 'text-white/90' : 'text-white/90'
                                }`}>
                                  {stage.label}
                                </span>
                              </div>
                              <p className="text-[8px] sm:text-[10px] text-white/80 hidden sm:block">{stage.description}</p>
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
                            
                            {/* Completion Checkmark for Completed Steps */}
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
                  
                  {/* Supervisor Arrow - Properly Aligned */}
                  {/* <div className="absolute -right-28 top-1/2 -translate-y-1/2 hidden xl:flex items-center gap-2">
                  
                    <div className="w-12 h-0.5 bg-gradient-to-r from-white/60 to-white/20" />
                    <ArrowRight className="w-5 h-5 text-white animate-pulse" />
                    <div className="flex flex-col items-center ml-2">
                      <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm border-2 border-white/60 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div className="mt-2 text-center">
                        <div className="flex items-center gap-1 justify-center">
                          <span className="text-sm">👨‍🏫</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                            SUPERVISOR
                          </span>
                        </div>
                        <p className="text-[9px] text-white/70 whitespace-nowrap">
                          Contact for guidance
                        </p>
                      </div>
                    </div>
                  </div> */}
                </div>
                
                {/* Progress Bar with Percentage
                <div className="mt-10 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-white/70 font-mono">PROGRESS</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        {Math.round((['SUBMISSION_OPEN', 'UNDER_REVIEW', 'DECISION_PENDING', 'SELECTION_OPEN', 'TEAMS_FORMING', 'FROZEN'].indexOf(pool.status) + 1) / 6 * 100)}%
                      </span>
                      <div className="w-16 h-px bg-white/30" />
                      <span className="text-[10px] text-white/60">COMPLETE</span>
                    </div>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white rounded-full transition-all duration-1000 ease-out relative"
                      style={{ width: `${(['SUBMISSION_OPEN', 'UNDER_REVIEW', 'DECISION_PENDING', 'SELECTION_OPEN', 'TEAMS_FORMING', 'FROZEN'].indexOf(pool.status) + 1) / 6 * 100}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
                    </div>
                  </div>
                </div> */}
                {/* Progress Bar with Percentage */}
                <div className="mt-10 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-white/70 font-mono">PROGRESS</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        {Math.round((['SUBMISSION_OPEN', 'UNDER_REVIEW', 'DECISION_PENDING', 'SELECTION_OPEN', 'TEAMS_FORMING', 'FROZEN'].indexOf(pool.status) + 1) / 6 * 100)}%
                      </span>
                      <div className="w-16 h-px bg-white/30" />
                      <span className="text-[10px] text-white/90">COMPLETE</span>
                    </div>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white rounded-full transition-all duration-1000 ease-out relative"
                      style={{ width: `${(['SUBMISSION_OPEN', 'UNDER_REVIEW', 'DECISION_PENDING', 'SELECTION_OPEN', 'TEAMS_FORMING', 'FROZEN'].indexOf(pool.status) + 1) / 6 * 100}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
                    </div>
                  </div>
                </div>
                
                {/* Milestone Completion Summary */}
                <div className="mt-6 pt-3 flex flex-wrap gap-2 justify-center">
                  {['SUBMISSION_OPEN', 'UNDER_REVIEW', 'DECISION_PENDING', 'SELECTION_OPEN', 'TEAMS_FORMING', 'FROZEN'].map((s, idx) => {
                    const currentIdx = ['SUBMISSION_OPEN', 'UNDER_REVIEW', 'DECISION_PENDING', 'SELECTION_OPEN', 'TEAMS_FORMING', 'FROZEN'].indexOf(pool.status);
                    const isCompleted = idx < currentIdx;
                    const isCurrent = idx === currentIdx;
                    
                    if (isCompleted) {
                      return (
                        <div key={s} className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                          <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                          <span className="text-[8px] text-white font-medium capitalize">{s.replace('_', ' ').toLowerCase()}</span>
                        </div>
                      );
                    }
                    if (isCurrent) {
                      return (
                        <div key={s} className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/30 backdrop-blur-sm border border-white/40 animate-pulse">
                          <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          <span className="text-[8px] text-white font-bold capitalize">{s.replace('_', ' ').toLowerCase()}</span>
                        </div>
                      );
                    }
                    return (
                      <div key={s} className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm opacity-50">
                        <div className="w-1 h-1 rounded-full bg-white/50" />
                        <span className="text-[7px] text-white/50 capitalize">{s.replace('_', ' ').toLowerCase()}</span>
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
          {quickActions.map((action, idx) => (
            <div
              key={idx}
              onClick={() => navigate(action.path)}
              onMouseEnter={() => setHoveredCard(action.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className="group relative cursor-pointer transition-all duration-500 hover:-translate-y-3"
            >
              {/* 3D Shadow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition duration-500" />
              
              <div className="relative rounded-2xl overflow-hidden transition-all duration-500 group-hover:shadow-3xl" style={{ background: gradients.card, boxShadow: '0 20px 40px -12px rgba(0,0,0,0.15)' }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-700" style={{ background: action.gradient, filter: 'blur(30px)' }} />
                <div className="absolute inset-px rounded-2xl bg-white/95" />
                <div className="absolute inset-x-0 top-0 h-1" style={{ background: action.gradient }} />
                
                <div className="relative p-5 sm:p-6 md:p-7">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl transition-all duration-500 ${hoveredCard === action.id ? 'scale-110 rotate-3' : ''}`} style={{ background: action.gradient }}>
                      <div className="text-white">
                        {action.icon}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {action.notification && action.notification > 0 && (
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
                  
                  <h3 className="font-bold text-xl sm:text-2xl text-gray-800 mb-2">{action.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">{action.description}</p>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                      <Sparkles className="w-3 h-3" />
                      {action.badge}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-medium">{action.stat}</div>
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
            <div className="relative rounded-3xl overflow-hidden transition-all duration-500 group-hover:shadow-3xl" style={{ background: gradients.card }}>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent" />
              <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: gradients.brand }} />
              
              <div className="relative px-5 sm:px-6 md:px-7 py-4 sm:py-5 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl sm:text-2xl text-gray-800">{myTeam.name}</h3>
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {myTeam.members?.filter(m => m.status === 'ACTIVE').length || 0} active members
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
                        <p className="font-bold text-gray-800 mt-1 text-base break-words">{myTeam.project.title}</p>
                        <p className="text-xs text-emerald-600 mt-1">{myTeam.project.domain || 'No domain specified'}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 rounded-lg bg-gradient-to-r from-emerald-100 to-teal-100">
                    <Users className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h4 className="font-semibold text-gray-700">Team Members</h4>
                  <div className="flex-1 h-px bg-gradient-to-r from-emerald-200 to-transparent" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {myTeam.members?.filter(m => m.status === 'ACTIVE').map((m, idx) => (
                    <div 
                      key={m.id} 
                      className="group/member flex items-center gap-3 rounded-xl p-3 border border-emerald-100 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:border-emerald-300 bg-white/80"
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {m.student.firstName[0]}{m.student.lastName?.[0]}
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
                          <span className="font-semibold text-sm text-gray-800 truncate">{m.student.firstName} {m.student.lastName}</span>
                          {m.role === 'LEADER' && (
                            <span className="text-[9px] bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">Leader</span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500 font-mono truncate">{m.student.enrollmentNo}</p>
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
        <div className="relative group overflow-hidden rounded-3xl transition-all duration-500 hover:shadow-2xl" style={{ background: gradients.dark }}>
          {/* Animated Nature Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl animate-pulse-slow" style={{ background: 'radial-gradient(circle, rgba(56,239,125,0.3) 0%, rgba(17,153,142,0.1) 100%)' }} />
            <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl animate-pulse-slow delay-1000" style={{ background: 'radial-gradient(circle, rgba(168,230,207,0.3) 0%, rgba(17,153,142,0.1) 100%)' }} />
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
              style={{ background: gradients.brand, color: 'white', boxShadow: '0 20px 40px -12px rgba(17,153,142,0.5)' }}
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
            <span>🌿 Powered by Project Allocation System</span>
            <div className="w-1 h-1 rounded-full bg-emerald-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;