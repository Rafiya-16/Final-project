// frontend/src/pages/student/MyTeamPage.tsx
import React, { useState, useEffect } from 'react';
import { teamService } from '@/services/teamService';
import { poolService } from '@/services/poolService';
import { userService } from '@/services/userService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Plus, UserPlus, LogOut, Trash2, Mail, CheckCircle2, XCircle, Users, Crown, Shield, Sparkles, TrendingUp, X, Send, BookOpen, Target, Award, Rocket } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import type { Team, TeamInvite, User, TeamMember } from '@/types';
import { getErrorMessage } from '@/types';

// Gradient brand colors - KEEPING YOUR ORIGINAL COLORS
const gradientBrand = 'linear-gradient(135deg, #11998e 0%, #38ef7d 50%, #a8e6cf 100%)';
const gradientCard = 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(245,255,250,0.95) 100%)';

const MyTeamPage: React.FC = () => {
  const { user } = useAuthStore();
  const [poolId, setPoolId] = useState('');
  const [team, setTeam] = useState<Team | null>(null);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [students, setStudents] = useState<User[]>([]);
  const [confirm, setConfirm] = useState<{ action: string; id: string; msg: string } | null>(null);
  const [hoveredMember, setHoveredMember] = useState<string | null>(null);

  useEffect(() => {
    poolService.list().then(async r => {
      const pool = r.data?.[0];
      if (pool) {
        setPoolId(pool.id);
        await load(pool.id);
      }
    }).finally(() => setLoading(false));
  }, []);

  const load = async (pid: string) => {
    const [t, inv] = await Promise.all([teamService.getMyTeam(pid), teamService.getMyInvites(pid)]);
    setTeam(t); setInvites(inv || []);
  };

  // const createTeam = async () => {
  //   if (!teamName.trim()) return;
  //   try { 
  //     await teamService.create(poolId, teamName); 
  //     toast.success('🎉 Team created successfully!'); 
  //     setShowCreate(false); 
  //     setTeamName(''); 
  //     load(poolId); 
  //   }
  //   catch (e: unknown) { toast.error(getErrorMessage(e)); }
  // };

  const createTeam = async () => {
  // 🚫 Block if pending invites exist
    if (hasPendingInvites) {
      toast.error('❌ Please respond to pending invites before creating a team');
      return;
    }

    if (!teamName.trim()) return;

    try { 
      await teamService.create(poolId, teamName); 
      toast.success('🎉 Team created successfully!'); 
      setShowCreate(false); 
      setTeamName(''); 
      load(poolId); 
    }
    catch (e: unknown) { 
      toast.error(getErrorMessage(e)); 
    }
  };

  const loadStudents = async () => {
    const res = await userService.list({ role: 'STUDENT', isActive: 'true', limit: '200' });
    setStudents(res.data || []); 
    setShowInvite(true);
  };

  const sendInvite = async (studentId: string) => {
    if (!team) return;
    try { 
      await teamService.invite(poolId, team.id, studentId); 
      toast.success('✨ Invite sent successfully!'); 
      load(poolId); 
      setShowInvite(false); 
    }
    catch (e: unknown) { toast.error(getErrorMessage(e)); }
  };

  const respondInvite = async (inviteId: string, accept: boolean) => {
    try { 
      await teamService.respond(poolId, inviteId, accept); 
      toast.success(accept ? '🎊 Joined team successfully!' : 'Invite declined'); 
      load(poolId); 
    }
    catch (e: unknown) { toast.error(getErrorMessage(e)); }
  };

  const doConfirm = async () => {
    if (!confirm || !team) return;
    try {
      if (confirm.action === 'leave') await teamService.leave(poolId, team.id);
      else if (confirm.action === 'remove') await teamService.removeMember(poolId, team.id, confirm.id);
      else if (confirm.action === 'dissolve') await teamService.dissolve(poolId, team.id);
      toast.success('✅ Action completed successfully'); 
      load(poolId);
    } catch (e: unknown) { toast.error(getErrorMessage(e)); }
    setConfirm(null);
  };

  if (loading) return <LoadingSpinner />;

  const isLeader = team?.leaderId === user?.id;
  const hasPendingInvites = invites && invites.length > 0;
  const inviteIds = new Set(team?.invites?.map(i => i.inviteeId));
  const memberIds = new Set(team?.members?.map(m => m.studentId));
  const takenMap = new Map(team?.allMembersInPool?.map((m: any) => [m.studentId, m.teamId]));

  const activeMemberCount = team?.members?.filter((m: TeamMember) => m.status === 'ACTIVE').length || 0;
  const maxTeamSize = (team?.project as any)?.maxTeamSize || 5;

  const teamStats = [
    { label: 'Members', value: activeMemberCount, icon: <Users className="w-4 h-4" /> },
    { label: 'Slots Available', value: maxTeamSize - activeMemberCount, icon: <Target className="w-4 h-4" /> },
    { label: 'Pending Invites', value: team?.invites?.length || 0, icon: <Mail className="w-4 h-4" /> },
    { label: team?.project ? 'Project Status' : 'Team Status', value: team?.project ? 'Selected' : 'Active', icon: team?.project ? <Award className="w-4 h-4" /> : <Rocket className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(circle at 10% 20%, #e8f5e9 0%, #c8e6c9 50%, #a5d6a7 100%)' }}>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        
        {/* Hero Section */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 rounded-2xl sm:rounded-3xl blur-2xl opacity-25 group-hover:opacity-40 transition duration-700" />
          <div className="relative backdrop-blur-xl bg-white/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 border border-white/40 shadow-2xl overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full blur-3xl opacity-20" />
            <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-medium px-3 sm:px-4 py-1.5 rounded-full bg-white/40 backdrop-blur-sm border border-white/60 mb-3 sm:mb-4">
                  <Rocket className="h-3 w-3 text-emerald-600" />
                  <span className="text-emerald-800 text-xs sm:text-sm">Team Collaboration Hub</span>
                  <Sparkles className="h-3 w-3 text-emerald-600 animate-pulse" />
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-[1.1]">
                  <span className="text-gray-900">Your</span>
                  <br />
                  <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 bg-clip-text text-transparent">Dream Team</span>
                </h1>
                <p className="mt-3 sm:mt-4 text-gray-600 text-sm sm:text-base lg:text-lg max-w-xl">Manage your team members, send invitations, and collaborate on your final year project.</p>
              </div>
              
              {/* {!team && !showCreate && (
                <button onClick={() => setShowCreate(true)} className="group relative inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold transition-all duration-300 hover:scale-105 overflow-hidden shadow-2xl" style={{ background: gradientBrand, color: 'white' }}>
                  <span className="relative z-10 flex items-center gap-2"><Plus className="w-5 h-5" />Create New Team<Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" /></span>
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                </button>
              )} */}
             {!team && !showCreate && (
              <button
                onClick={() => {
                  if (hasPendingInvites) {
                    toast.error('⚠️ First respond to your team invite before creating a team');
                    return;
                  }
                  setShowCreate(true);
                }}
                className={`group relative inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold transition-all duration-300 hover:scale-105 overflow-hidden shadow-2xl ${
                  hasPendingInvites ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{ background: gradientBrand, color: 'white' }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Create New Team
                  <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                </span>

                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              </button>
            )}
            </div>
          </div>
        </div>

        {/* Pending Invites Section */}
        {invites.length > 0 && (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500"><Mail className="w-4 h-4 text-white" /></div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Pending Invites</h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">{invites.length}</span>
            </div>
            <div className="grid gap-3 sm:gap-4">
              {invites.map(inv => (
                <div key={inv.id} className="group relative rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl" style={{ background: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)' }}>
                  <div className="absolute inset-x-0 top-0 h-0.5 sm:h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 shadow-md"><Mail className="w-5 h-5 text-white" /></div>
                      <div>
                        <p className="font-bold text-gray-900 text-base sm:text-lg">{inv.team?.name}</p>
                        <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1"><Sparkles className="w-3 h-3" />From: {inv.invitedBy?.firstName} {inv.invitedBy?.lastName}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button onClick={() => respondInvite(inv.id, true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm rounded-xl font-medium hover:scale-105 transition-all shadow-md"><CheckCircle2 className="w-4 h-4" />Accept</button>
                      <button onClick={() => respondInvite(inv.id, false)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm rounded-xl font-medium hover:scale-105 transition-all shadow-md"><XCircle className="w-4 h-4" />Decline</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Team State */}
        {!team && (
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 rounded-2xl sm:rounded-3xl blur-2xl opacity-20" />
            <div className="relative rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center" style={{ background: gradientCard, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)' }}>
              <div className="relative inline-block mb-4 sm:mb-6">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 blur-xl animate-pulse" />
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl">
                  <Users className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No Team Yet</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto text-sm sm:text-base">You're not part of any team. Create a new team or accept an invite from someone.</p>
              
              {/* {showCreate ? (
                <div className="max-w-sm mx-auto space-y-4">
                  <input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Enter your team name" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
                  <div className="flex gap-3">
                    <button onClick={createTeam} className="flex-1 py-3 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg" style={{ background: gradientBrand, color: 'white' }}>Create Team</button>
                    <button onClick={() => setShowCreate(false)} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg" style={{ background: gradientBrand, color: 'white' }}><Plus className="w-5 h-5" />Create New Team</button>
              )} */}
              {showCreate ? (
                <div className="max-w-sm mx-auto space-y-4">
                  <input
                    value={teamName}
                    onChange={e => setTeamName(e.target.value)}
                    placeholder="Enter your team name"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        if (hasPendingInvites) {
                          toast.error('⚠️ First respond to your team invite before creating a team');
                          return;
                        }
                        createTeam();
                      }}
                      className={`flex-1 py-3 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg ${
                        hasPendingInvites ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      style={{ background: gradientBrand, color: 'white' }}
                    >
                      Create Team
                    </button>

                    <button
                      onClick={() => setShowCreate(false)}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>

                  {hasPendingInvites && (
                    <p className="text-red-500 text-sm">
                      Please accept or reject your team invites first.
                    </p>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (hasPendingInvites) {
                      toast.error('⚠️ First respond to your team invite before creating a team');
                      return;
                    }
                    setShowCreate(true);
                  }}
                  className={`inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg ${
                    hasPendingInvites ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  style={{ background: gradientBrand, color: 'white' }}
                >
                  <Plus className="w-5 h-5" />
                  Create New Team
                </button>
              )}

            </div>
          </div>
        )}

        {/* Team Details */}
        {team && (
          <div className="space-y-6 sm:space-y-8">
            {/* Team Header Card */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 rounded-2xl sm:rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition duration-700" />
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-500 group-hover:shadow-2xl" style={{ background: gradientCard }}>
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                
                <div className="p-5 sm:p-6 lg:p-8">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 shadow-lg"><Users className="w-6 h-6 text-white" /></div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{team.name}</h2>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200"><CheckCircle2 className="w-3 h-3" />{team.status}</span>
                        {team.isFrozen && <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border border-red-200"><Shield className="w-3 h-3" />FROZEN</span>}
                      </div>
                    </div>
                    
                    {/* ACTION BUTTONS - ALL PRESENT AND WORKING */}
                    <div className="flex flex-wrap gap-3">
                      {isLeader && !team.isFrozen && (
                        <button onClick={loadStudents} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105 shadow-lg" style={{ background: gradientBrand, color: 'white' }}>
                          <UserPlus className="w-4 h-4" />Invite Member
                        </button>
                      )}
                      {!isLeader && !team.isFrozen && (
                        <button onClick={() => setConfirm({ action: 'leave', id: '', msg: 'Are you sure you want to leave this team?' })} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-100 to-pink-100 text-red-700 rounded-xl text-sm font-medium hover:scale-105 transition-all">
                          <LogOut className="w-4 h-4" />Leave Team
                        </button>
                      )}
                      {isLeader && !team.isFrozen && (
                        <button onClick={() => setConfirm({ action: 'dissolve', id: '', msg: 'This will remove all members and release the project. This action cannot be undone!' })} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl text-sm font-medium hover:scale-105 transition-all shadow-lg">
                          <Trash2 className="w-4 h-4" />Dissolve Team
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Team Stats */}
                  <div className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    {teamStats.map((stat, idx) => (
                      <div key={idx} className="group/stat relative rounded-xl bg-gradient-to-br from-gray-50 to-white p-3 sm:p-4 text-center hover:scale-105 transition-all duration-300 cursor-pointer border border-gray-100 shadow-sm">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-xl opacity-0 group-hover/stat:opacity-10 transition-opacity" />
                        <div className="p-1.5 rounded-lg bg-gradient-to-r from-emerald-400 to-teal-500 inline-flex mb-2">{stat.icon}</div>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500 font-medium">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Selected Project */}
                  {team.project && (
                    <div className="mt-5 sm:mt-6 rounded-xl p-4 border border-emerald-200" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' }}>
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md"><BookOpen className="w-4 h-4 text-white" /></div>
                        <div className="flex-1">
                          <p className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-1"><Sparkles className="w-3 h-3" />SELECTED PROJECT</p>
                          <p className="font-bold text-gray-900 mt-1 text-sm sm:text-base">{team.project.title}</p>
                          <p className="text-[10px] sm:text-xs text-emerald-600 mt-0.5">{team.project.domain || 'No domain specified'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Members List */}
            <div>
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-r from-emerald-400 to-teal-500"><Users className="w-4 h-4 text-white" /></div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Team Members</h3>
                </div>
                <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs sm:text-sm font-bold">{activeMemberCount} / {maxTeamSize} Members</div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {team.members?.filter((m: TeamMember) => m.status === 'ACTIVE').map((m: TeamMember) => (
                  <div key={m.id} className="group relative transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-xl sm:rounded-2xl blur-md opacity-0 group-hover:opacity-30 transition duration-500" />
                    <div className="relative rounded-xl sm:rounded-2xl p-4 sm:p-5 transition-all duration-300 group-hover:shadow-xl border border-gray-100" style={{ background: gradientCard }}>
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg">
                            {m.student.firstName[0]}{m.student.lastName?.[0]}
                          </div>
                          {m.role === 'LEADER' && (
                            <div className="absolute -top-1 -right-1">
                              <div className="bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full p-1 shadow-lg"><Crown className="w-3 h-3 text-white" /></div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-900 text-sm sm:text-base truncate">{m.student.firstName} {m.student.lastName}</span>
                            {m.role === 'LEADER' && (
                              <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 px-2 py-0.5 rounded-full font-bold"><Crown className="w-2.5 h-2.5" />Leader</span>
                            )}
                          </div>
                          <p className="text-[10px] sm:text-xs text-gray-500 font-mono mt-0.5 truncate">{m.student.enrollmentNo}</p>
                          <p className="text-[9px] sm:text-[10px] text-gray-400 truncate hidden sm:block">{m.student.email}</p>
                        </div>
                        
                        {isLeader && m.studentId !== user?.id && !team.isFrozen && (
                          <button onClick={() => setConfirm({ action: 'remove', id: m.studentId, msg: `Remove ${m.student.firstName} from the team?` })} className="p-2 rounded-lg hover:bg-red-50 transition-all duration-300 group/remove">
                            <Trash2 className="w-4 h-4 text-gray-400 group-hover/remove:text-red-500 transition-colors" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Invite Modal */}
        {showInvite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInvite(false)} />
            
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-5 sm:px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md"><UserPlus className="w-5 h-5 text-white" /></div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Invite Teammate</h2>
                </div>
                <button onClick={() => setShowInvite(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="p-5 sm:p-6 space-y-4">
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-100">
                  <p className="text-xs text-emerald-700 flex items-center gap-1"><Sparkles className="w-3 h-3" />Invite students to join your team. They will receive a notification.</p>
                </div>
                
                <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="🔍 Search by name or enrollment number" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
                
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {students.filter(s => (!inviteEmail || s.firstName.toLowerCase().includes(inviteEmail.toLowerCase()) || s.enrollmentNo?.includes(inviteEmail)) && s.id !== user?.id).map(s => {
                    let statusText = 'Invite', statusClass = 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:scale-105', disabled = false;
                    if (memberIds.has(s.id)) { statusText = 'In Team'; statusClass = 'bg-gradient-to-r from-green-500 to-emerald-500'; disabled = true; }
                    else if (inviteIds.has(s.id)) { statusText = 'Pending'; statusClass = 'bg-gradient-to-r from-amber-500 to-orange-500'; disabled = true; }
                    else if (takenMap.has(s.id) && takenMap.get(s.id) !== team?.id) { statusText = 'In Other Team'; statusClass = 'bg-gray-400'; disabled = true; }
                    return (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
                        <div><p className="text-sm font-semibold text-gray-900">{s.firstName} {s.lastName}</p><p className="text-xs text-gray-500">{s.enrollmentNo}</p></div>
                        <button onClick={() => sendInvite(s.id)} disabled={disabled} className={`px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-all ${statusClass} ${!disabled ? 'hover:scale-105' : 'cursor-not-allowed'}`}>{statusText}</button>
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => setShowInvite(false)} className="w-full py-2.5 bg-gray-100 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        {confirm && <ConfirmDialog open title="Confirm Action" message={confirm.msg} variant="warning" confirmText="Confirm" onConfirm={doConfirm} onCancel={() => setConfirm(null)} />}
      </div>
    </div>
  );
};

export default MyTeamPage;