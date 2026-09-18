// frontend/src/pages/faculty/FacultyDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { poolService } from '@/services/poolService';
import { projectService } from '@/services/projectService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import FacultyGreeting from '@/pages/faculty/FacultyGreeting';
import {
  Plus, Send, Trash2, Edit3, BookOpen, FilePlus,
  CheckCircle, Clock, XCircle, AlertCircle, Users2, Calendar,
  ChevronDown, ChevronUp, Sparkles, Target, Trophy, Shield,
  Search, TrendingUp, AlertTriangle, Gift, Star, Zap,
  BarChart3, Layers, Eye, Flame, Award, Rocket, 
  Lightbulb, ListTodo, Calendar as CalendarIcon, CheckSquare,
  Circle, Upload, ClipboardList, Timer, ArrowRight,
  Crown, Mail, Phone
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Pool, Project, TeamMember } from '@/types';
import { getErrorMessage } from '@/types';

const FacultyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [pools, setPools] = useState<Pool[]>([]);
  const [selectedPool, setSelectedPool] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [fullPool, setFullPool] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', domain: '', prerequisites: '', expectedOutcome: '', maxTeamSize: 3 });

  useEffect(() => { 
    poolService.list().then(r => { 
      setPools(r.data || []); 
      if (r.data?.length) setSelectedPool(r.data[0].id); 
    }).finally(() => setLoading(false)); 
  }, []);
  
  useEffect(() => {
    if (!selectedPool) return;
    setLoading(true);
    Promise.all([
      poolService.getById(selectedPool),
      projectService.listByPool(selectedPool),
    ])
      .then(([pool, projects]) => {
        setFullPool(pool);
        setProjects(projects);
      })
      .catch(() => {
        setProjects([]);
      })
      .finally(() => setLoading(false));
  }, [selectedPool]);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [pool, projects] = await Promise.all([
        poolService.getById(selectedPool),
        projectService.listByPool(selectedPool),
      ]);
      setFullPool(pool);
      setProjects(projects);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const submitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) { 
        await projectService.edit(selectedPool, editingId, form); 
        toast.success('Proposal updated successfully!'); 
      } else { 
        await projectService.submit(selectedPool, form); 
        toast.success('Proposal created successfully!'); 
      }
      setShowForm(false); 
      setEditingId(null); 
      setForm({ title: '', description: '', domain: '', prerequisites: '', expectedOutcome: '', maxTeamSize: 3 });
      await refreshData();
    } catch (e: unknown) { 
      toast.error(getErrorMessage(e)); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const finalize = async () => {
    try { 
      await projectService.finalize(selectedPool); 
      toast.success('All proposals submitted for review!');
      await refreshData();
    } catch (e: unknown) { 
      toast.error(getErrorMessage(e)); 
    }
  };

  const deleteProposal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this proposal?')) return;
    try { 
      await projectService.remove(selectedPool, id); 
      toast.success('Proposal deleted successfully');
      await refreshData();
    } catch (e: unknown) { 
      toast.error(getErrorMessage(e)); 
    }
  };

  const startEdit = (p: Project) => {
    setForm({ 
      title: p.title, 
      description: p.description, 
      domain: p.domain || '', 
      prerequisites: p.prerequisites || '', 
      expectedOutcome: p.expectedOutcome || '', 
      maxTeamSize: p.maxTeamSize 
    });
    setEditingId(p.id); 
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateProposal = () => {
    if (!selectedPool) {
      toast.error('Please select a pool first');
      return;
    }
    navigate(`/faculty/proposals`);
  };

  const getTimeRemaining = (endDate: string | undefined) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24));
    if (daysLeft < 0) return { text: 'Ended', color: 'text-red-600', bg: 'bg-red-100' };
    if (daysLeft === 0) return { text: 'Ends today', color: 'text-orange-600', bg: 'bg-orange-100' };
    if (daysLeft <= 3) return { text: `${daysLeft} days left`, color: 'text-red-600', bg: 'bg-red-100' };
    if (daysLeft <= 7) return { text: `${daysLeft} days left`, color: 'text-orange-600', bg: 'bg-orange-100' };
    return { text: `${daysLeft} days left`, color: 'text-green-600', bg: 'bg-green-100' };
  };

  const getProgressPercentage = () => (projects.length / 4) * 100;

  const getCompletionColor = () => {
    const percent = getProgressPercentage();
    if (percent === 100) return 'from-[#CCA8E9] to-[#C3BEF0]';
    if (percent >= 75) return 'from-[#C3BEF0] to-[#CADEFC]';
    if (percent >= 50) return 'from-[#CADEFC] to-[#DEFCF9]';
    return 'from-[#DEFCF9] to-[#CADEFC]';
  };

  const getCurrentPhase = () => {
    if (!fullPool) return null;
    const now = new Date();
    const submissionStart = new Date(fullPool.submissionStart);
    const submissionEnd = new Date(fullPool.submissionEnd);
    const reviewStart = new Date(fullPool.reviewStart);
    const reviewEnd = new Date(fullPool.reviewEnd);
    const selectionStart = new Date(fullPool.selectionStart);
    const selectionEnd = new Date(fullPool.selectionEnd);
    const freezeDate = new Date(fullPool.teamFreezeDate);

    if (now < submissionStart) return 'upcoming';
    if (now >= submissionStart && now <= submissionEnd) return 'submission';
    if (now >= reviewStart && now <= reviewEnd) return 'review';
    if (now >= selectionStart && now <= selectionEnd) return 'selection';
    if (now > selectionEnd && now < freezeDate) return 'team-formation';
    if (now >= freezeDate) return 'closed';
    return 'active';
  };

  const getPhaseDetails = () => {
    const phase = getCurrentPhase();
    const draftCount = projects.filter(p => p.status === 'DRAFT').length;
    const submittedCount = projects.filter(p => p.status === 'SUBMITTED').length;
    const remainingSlots = 4 - projects.length;

    switch (phase) {
      case 'submission':
        return {
          title: '📝 Submission Phase',
          icon: <Rocket className="w-6 h-6" />,
          gradient: 'from-[#C3BEF0] to-[#CCA8E9]',
          todos: [
            { text: `Create ${remainingSlots} more proposal(s) to reach 4`, completed: projects.length === 4, action: projects.length < 4 ? 'Create Project' : null, actionHandler: handleCreateProposal },
            { text: `Review and finalize ${draftCount} draft(s)`, completed: draftCount === 0 },
            {
  text: `Submit before ${
    fullPool?.submissionEnd
      ? new Date(fullPool.submissionEnd).toLocaleDateString()
      : '—'
  }`,
  completed: submittedCount === 4,
},
          ]
        };
      case 'review':
        return {
          title: '🔍 Review Phase',
          icon: <Eye className="w-6 h-6" />,
          gradient: 'from-[#CADEFC] to-[#C3BEF0]',
          todos: [
            { text: 'Monitor review feedback', completed: false },
            { text: 'Respond to clarifications', completed: false },
          ]
        };
      case 'selection':
        return {
          title: '🏆 Selection Phase',
          icon: <Award className="w-6 h-6" />,
          gradient: 'from-[#C3BEF0] to-[#CCA8E9]',
          todos: [
            { text: 'Review approved projects', completed: false },
            { text: 'Prepare team allocation', completed: false },
          ]
        };
      case 'team-formation':
        return {
          title: '👥 Team Formation',
          icon: <Users2 className="w-6 h-6" />,
          gradient: 'from-[#DEFCF9] to-[#CADEFC]',
          todos: [
            { text: 'Review applications', completed: false },
            { text: 'Finalize team allocations', completed: false },
          ]
        };
      default:
        return {
          title: '⏳ Upcoming Phase',
          icon: <CalendarIcon className="w-6 h-6" />,
          gradient: 'from-[#CADEFC] to-[#DEFCF9]',
          todos: [
            {
  text: `Phase starts on ${
    fullPool?.submissionStart
      ? new Date(fullPool.submissionStart).toLocaleDateString()
      : '—'
  }`,
  completed: false,
},
            { text: 'Prepare proposals', completed: false },
          ]
        };
    }
  };

  if (loading) return <LoadingSpinner />;

  const pool = pools.find(p => p.id === selectedPool);
  const draftCount = projects.filter(p => p.status === 'DRAFT').length;
  const canSubmit = pool?.status === 'SUBMISSION_OPEN';
  const timeRemaining = getTimeRemaining(pool?.submissionEnd);
  const phaseDetails = getPhaseDetails();

  const filteredProjects = projects
    .filter(p => statusFilter === 'ALL' || p.status === statusFilter)
    .filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  p.description.toLowerCase().includes(searchTerm.toLowerCase()));

  const statusIcon = (s: string) => {
    switch (s) {
      case 'DRAFT': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'SUBMITTED': return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'APPROVED': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const statusStyle = (s: string) => {
    switch (s) {
      case 'DRAFT': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'SUBMITTED': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'APPROVED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };
  
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  const statusCounts = projects.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#DEFCF9]/30 via-[#CADEFC]/20 to-[#C3BEF0]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Greeting and Quotes Section */}
        <FacultyGreeting />
        
        {/* Phase Info Banner */}
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${phaseDetails.gradient} p-6 text-gray-800 shadow-xl`}>
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-white/40 rounded-xl backdrop-blur-sm">
                    {phaseDetails.icon}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{phaseDetails.title}</h2>
                    <p className="text-gray-600 text-sm mt-0.5">
                      {fullPool?.name} • {fullPool?.academicYear} - {fullPool?.semester}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <ListTodo className="w-4 h-4" />
                    Action Items
                  </p>
                  {phaseDetails.todos.map((todo, idx) => (
                    <div key={idx} className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        {todo.completed ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-500" />
                        )}
                        <span className={`text-sm ${todo.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                          {todo.text}
                        </span>
                      </div>
                      {todo.action && todo.actionHandler && (
                        <button
                          onClick={todo.actionHandler}
                          className="text-xs px-3 py-1 bg-white/40 hover:bg-white/60 rounded-lg transition-colors flex items-center gap-1 text-gray-700"
                        >
                          {todo.action}
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col items-start lg:items-end gap-3">
                <div className="flex flex-wrap gap-2">
                  {timeRemaining && canSubmit && (
                    <div className={`px-3 py-1.5 ${timeRemaining.bg} rounded-lg backdrop-blur-sm`}>
                      <span className={`text-sm font-semibold ${timeRemaining.color}`}>
                        <Timer className="w-3 h-3 inline mr-1" />
                        {timeRemaining.text}
                      </span>
                    </div>
                  )}
                  <div className="px-3 py-1.5 bg-white/40 rounded-lg backdrop-blur-sm">
                    <span className="text-sm font-semibold text-gray-700">
                      {projects.length}/4 Proposals
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-[#CADEFC]/50 p-4 shadow-lg shadow-[#C3BEF0]/20">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-[#C3BEF0]/30 rounded-xl">
                <FilePlus className="w-5 h-5 text-[#7C3AED]" />
              </div>
              <span className="text-xs text-gray-400">/4</span>
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-2">{projects.length}</p>
            <p className="text-xs text-gray-500">Total Proposals</p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-[#CADEFC]/50 p-4 shadow-lg shadow-[#C3BEF0]/20">
            <div className="p-2 bg-amber-100/50 rounded-xl w-fit">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-2">{draftCount}</p>
            <p className="text-xs text-gray-500">Draft</p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-[#CADEFC]/50 p-4 shadow-lg shadow-[#C3BEF0]/20">
            <div className="p-2 bg-blue-100/50 rounded-xl w-fit">
              <Send className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-2">{statusCounts['SUBMITTED'] || 0}</p>
            <p className="text-xs text-gray-500">Submitted</p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-[#CADEFC]/50 p-4 shadow-lg shadow-[#C3BEF0]/20">
            <div className="p-2 bg-emerald-100/50 rounded-xl w-fit">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-2">{statusCounts['APPROVED'] || 0}</p>
            <p className="text-xs text-gray-500">Approved</p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-[#CADEFC]/50 p-4 shadow-lg shadow-[#C3BEF0]/20">
            <div className="p-2 bg-[#CCA8E9]/30 rounded-xl w-fit">
              <TrendingUp className="w-5 h-5 text-[#7C3AED]" />
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-2">{Math.round((projects.length / 4) * 100)}%</p>
            <p className="text-xs text-gray-500">Completion</p>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3">
            {pools.length > 0 && (
              <div className="relative">
                <select
                  value={selectedPool}
                  onChange={e => setSelectedPool(e.target.value)}
                  className="appearance-none px-5 py-2.5 bg-white/80 backdrop-blur-sm border border-[#CADEFC]/50 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:border-[#CCA8E9] focus:ring-2 focus:ring-[#C3BEF0]/50 cursor-pointer pr-10 shadow-sm"
                >
                  {pools.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            )}
            <button
              onClick={() => setShowStats(!showStats)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-[#CADEFC]/50 rounded-xl text-sm font-medium text-gray-700 hover:bg-white/90 transition-all"
            >
              <BarChart3 className="w-4 h-4" />
              {showStats ? 'Hide Analytics' : 'Show Analytics'}
            </button>
          </div>
          {canSubmit && projects.length < 4 && (
            <button
              onClick={handleCreateProposal}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#C3BEF0] to-[#CCA8E9] text-gray-800 rounded-xl font-semibold hover:from-[#CADEFC] hover:to-[#C3BEF0] transition-all transform hover:scale-105 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Create Project
            </button>
          )}
        </div>

        {/* Analytics Dashboard */}
        {showStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fadeIn">
            <div className="bg-gradient-to-br from-[#DEFCF9] to-[#CADEFC] rounded-2xl p-5 text-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Total Capacity</p>
                  <p className="text-3xl font-bold mt-1">4</p>
                </div>
                <div className="w-12 h-12 bg-white/40 rounded-xl flex items-center justify-center">
                  <Layers className="w-6 h-6" />
                </div>
              </div>
              <p className="text-xs opacity-80 mt-2">Maximum proposals allowed</p>
            </div>
            
            <div className="bg-gradient-to-br from-[#CADEFC] to-[#C3BEF0] rounded-2xl p-5 text-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Used Slots</p>
                  <p className="text-3xl font-bold mt-1">{projects.length}</p>
                </div>
                <div className="w-12 h-12 bg-white/40 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>
              <p className="text-xs opacity-80 mt-2">{4 - projects.length} slots remaining</p>
            </div>
            
            <div className="bg-gradient-to-br from-[#C3BEF0] to-[#CCA8E9] rounded-2xl p-5 text-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Draft Proposals</p>
                  <p className="text-3xl font-bold mt-1">{draftCount}</p>
                </div>
                <div className="w-12 h-12 bg-white/40 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
              <p className="text-xs opacity-80 mt-2">Ready to finalize</p>
            </div>
            
            <div className="bg-gradient-to-br from-[#CCA8E9] to-[#C3BEF0] rounded-2xl p-5 text-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Completion Rate</p>
                  <p className="text-3xl font-bold mt-1">{Math.round((projects.length / 4) * 100)}%</p>
                </div>
                <div className="w-12 h-12 bg-white/40 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
              <p className="text-xs opacity-80 mt-2">Overall progress</p>
            </div>
          </div>
        )}

        {/* Timeline Section */}
        {fullPool && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-50/80 via-rose-50/80 to-red-50/80 backdrop-blur-sm p-6 shadow-md border border-red-200">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-xl">
                  <Flame className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-red-800">Important Deadlines</h3>
                  <p className="text-red-600/70 text-sm">Track your key milestones</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-red-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-red-500" />
                    <p className="text-sm font-semibold text-gray-700">Submission Period</p>
                  </div>
                  <p className="text-gray-800 font-medium text-sm">
                    {formatDate(fullPool.submissionStart)} - {formatDate(fullPool.submissionEnd)}
                  </p>
                  {timeRemaining && canSubmit && (
                    <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 ${timeRemaining.bg} rounded-lg`}>
                      <AlertTriangle className={`w-3 h-3 ${timeRemaining.color}`} />
                      <span className={`text-xs font-medium ${timeRemaining.color}`}>{timeRemaining.text}</span>
                    </div>
                  )}
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-red-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-red-500" />
                    <p className="text-sm font-semibold text-gray-700">Review Period</p>
                  </div>
                  <p className="text-gray-800 font-medium text-sm">
                    {formatDate(fullPool.reviewStart)} - {formatDate(fullPool.reviewEnd)}
                  </p>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-red-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-red-500" />
                    <p className="text-sm font-semibold text-gray-700">Selection Period</p>
                  </div>
                  <p className="text-gray-800 font-medium text-sm">
                    {formatDate(fullPool.selectionStart)} - {formatDate(fullPool.selectionEnd)}
                  </p>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-red-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Users2 className="w-4 h-4 text-red-500" />
                    <p className="text-sm font-semibold text-gray-700">Team Freeze Date</p>
                  </div>
                  <p className="text-gray-800 font-medium text-sm">
                    {formatDate(fullPool.teamFreezeDate)}
                  </p>
                  <p className="text-red-500 text-xs mt-1">⚠️ No team changes after this</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hero Action Card */}
        {pool && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#C3BEF0] to-[#CCA8E9] p-6 text-gray-800 transition-all duration-300 hover:shadow-2xl">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/30 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Star className="w-7 h-7 text-gray-700" />
                </div>
                <div>
                  <p className="font-bold text-xl">Ready to submit your proposals?</p>
                  <p className="text-gray-700 text-sm mt-0.5">
                    {projects.length}/4 proposals created • {draftCount} draft(s) pending
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {canSubmit && projects.length < 4 && (
                  <button
                    onClick={handleCreateProposal}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white/80 text-gray-800 rounded-xl font-semibold hover:bg-white transition-all transform hover:scale-105 shadow-lg"
                  >
                    <Plus className="w-4 h-4" /> Create Projects
                  </button>
                )}
                {canSubmit && draftCount === 4 && (
                  <button onClick={finalize} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-all transform hover:scale-105 shadow-lg">
                    <Send className="w-4 h-4" /> Finalize All
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter Bar */}
        {projects.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-[#CADEFC]/50">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search proposals by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-[#CADEFC]/50 rounded-xl text-sm outline-none focus:border-[#CCA8E9] focus:ring-2 focus:ring-[#C3BEF0]/50 bg-white/50"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <FilterButton
                  label="All"
                  count={projects.length}
                  active={statusFilter === 'ALL'}
                  onClick={() => setStatusFilter('ALL')}
                />
                {['DRAFT', 'SUBMITTED', 'APPROVED'].map(status => (
                  statusCounts[status] > 0 && (
                    <FilterButton
                      key={status}
                      label={status}
                      count={statusCounts[status]}
                      active={statusFilter === status}
                      onClick={() => setStatusFilter(status)}
                    />
                  )
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Proposal Cards */}
        <div className="space-y-4">
          {filteredProjects.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#CADEFC]/50 p-12 text-center">
              <div className="w-24 h-24 bg-[#C3BEF0]/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-12 h-12 text-[#7C3AED]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No proposals found</h3>
              <p className="text-gray-500">
                {canSubmit ? 'Click "Create Proposals" to get started' : 'Submissions are not open'}
              </p>
            </div>
          ) : (
            filteredProjects.map((p, i) => (
              <ProposalCard
                key={p.id}
                project={p}
                index={i}
                canSubmit={canSubmit}
                expanded={expandedProject === p.id}
                onExpand={() => setExpandedProject(expandedProject === p.id ? null : p.id)}
                onEdit={startEdit}
                onDelete={deleteProposal}
                statusIcon={statusIcon}
                statusStyle={statusStyle}
              />
            ))
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={() => { setShowForm(false); setEditingId(null); }}>
          <div className="bg-white rounded-2xl border border-[#CADEFC]/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-[#CADEFC]/50 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#C3BEF0]/30 rounded-xl">
                    <FilePlus className="w-5 h-5 text-[#7C3AED]" />
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg">{editingId ? 'Edit Proposal' : 'Create New Proposal'}</h3>
                </div>
                <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <XCircle className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
            <form onSubmit={submitProposal} className="p-6 space-y-5">
              <div>
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">Title <span className="text-red-500">*</span></label>
                <input 
                  value={form.title} 
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} 
                  required
                  className="w-full mt-1.5 px-4 py-2.5 border border-[#CADEFC]/50 rounded-xl text-sm outline-none focus:border-[#CCA8E9] focus:ring-2 focus:ring-[#C3BEF0]/50 bg-white" 
                  placeholder="e.g., AI-Powered Student Performance Prediction System"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">Description <span className="text-red-500">*</span></label>
                <textarea 
                  value={form.description} 
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
                  required 
                  rows={5}
                  className="w-full mt-1.5 px-4 py-2.5 border border-[#CADEFC]/50 rounded-xl text-sm outline-none focus:border-[#CCA8E9] focus:ring-2 focus:ring-[#C3BEF0]/50 resize-none bg-white" 
                  placeholder="Describe your project proposal in detail..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Domain</label>
                  <input 
                    value={form.domain} 
                    onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}
                    className="w-full mt-1.5 px-4 py-2.5 border border-[#CADEFC]/50 rounded-xl text-sm outline-none focus:border-[#CCA8E9] focus:ring-2 focus:ring-[#C3BEF0]/50 bg-white" 
                    placeholder="e.g., AI, Web, IoT"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Prerequisites</label>
                  <input 
                    value={form.prerequisites} 
                    onChange={e => setForm(f => ({ ...f, prerequisites: e.target.value }))}
                    className="w-full mt-1.5 px-4 py-2.5 border border-[#CADEFC]/50 rounded-xl text-sm outline-none focus:border-[#CCA8E9] focus:ring-2 focus:ring-[#C3BEF0]/50 bg-white" 
                    placeholder="Required skills or courses"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Expected Outcome</label>
                  <input 
                    value={form.expectedOutcome} 
                    onChange={e => setForm(f => ({ ...f, expectedOutcome: e.target.value }))}
                    className="w-full mt-1.5 px-4 py-2.5 border border-[#CADEFC]/50 rounded-xl text-sm outline-none focus:border-[#CCA8E9] focus:ring-2 focus:ring-[#C3BEF0]/50 bg-white" 
                    placeholder="What will be delivered?"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Max Team Size *</label>
                <select 
                  value={form.maxTeamSize} 
                  onChange={e => setForm(f => ({ ...f, maxTeamSize: Number(e.target.value) }))}
                  className="w-full mt-1.5 px-4 py-2.5 border border-[#CADEFC]/50 rounded-xl text-sm outline-none focus:border-[#CCA8E9] focus:ring-2 focus:ring-[#C3BEF0]/50 bg-white"
                >
                  <option value={3}>3 members</option>
                  <option value={4}>4 members</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-2.5 bg-gradient-to-r from-[#C3BEF0] to-[#CCA8E9] text-gray-800 rounded-xl font-semibold hover:from-[#CADEFC] hover:to-[#C3BEF0] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : (editingId ? 'Update Proposal' : 'Create Proposal')}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="flex-1 px-6 py-2.5 bg-white border border-[#CADEFC]/50 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Components
const FilterButton: React.FC<{ label: string; count: number; active: boolean; onClick: () => void }> = 
  ({ label, count, active, onClick }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
        active 
          ? 'bg-gradient-to-r from-[#C3BEF0] to-[#CCA8E9] text-gray-800 shadow-md' 
          : 'bg-white/50 text-gray-600 hover:bg-white/80 border border-[#CADEFC]/50'
      }`}
    >
      {label} ({count})
    </button>
  );

const ProposalCard: React.FC<{
  project: Project;
  index: number;
  canSubmit: boolean;
  expanded: boolean;
  onExpand: () => void;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  statusIcon: (status: string) => React.ReactNode;
  statusStyle: (status: string) => string;
}> = ({ project, index, canSubmit, expanded, onExpand, onEdit, onDelete, statusIcon, statusStyle }) => (
  <div className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-[#CADEFC]/50 hover:border-[#CCA8E9]/80 transition-all duration-300 hover:shadow-xl overflow-hidden">
    <div className="p-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex gap-4 flex-1">
          <div className="w-12 h-12 bg-gradient-to-br from-[#C3BEF0] to-[#CCA8E9] rounded-xl flex items-center justify-center text-gray-800 font-bold text-base flex-shrink-0 shadow-md">
            {index + 1}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-800 text-xl">{project.title}</h4>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              {expanded ? project.description : `${project.description.substring(0, 200)}${project.description.length > 200 ? '...' : ''}`}
              {project.description.length > 200 && (
                <button onClick={onExpand} className="ml-2 text-[#7C3AED] hover:underline text-sm font-medium">
                  {expanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {project.domain && (
                <span className="inline-flex items-center gap-1.5 text-xs bg-[#C3BEF0]/30 text-gray-700 px-3 py-1.5 rounded-lg font-medium">
                  <Target className="w-3 h-3" />
                  {project.domain}
                </span>
              )}
              {project.prerequisites && (
                <span className="inline-flex items-center gap-1.5 text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg font-medium">
                  <Shield className="w-3 h-3" />
                  {project.prerequisites}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg font-medium">
                <Users2 className="w-3 h-3" />
                Team Size: {project.maxTeamSize}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${statusStyle(project.status)}`}>
            {statusIcon(project.status)}
            {project.status.replace('_', ' ')}
          </span>
          {project.status === 'DRAFT' && canSubmit && (
            <div className="flex gap-1 ml-2">
              <button onClick={() => onEdit(project)} className="p-2 hover:bg-[#C3BEF0]/30 rounded-lg transition-colors">
                <Edit3 className="w-4 h-4 text-[#7C3AED]" />
              </button>
              <button onClick={() => onDelete(project.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {project.team && project.team.members && (
        <div className="mt-6 bg-gradient-to-r from-[#DEFCF9]/50 to-[#CADEFC]/30 rounded-xl p-5 border border-[#CADEFC]/50">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-[#C3BEF0]/50 rounded-lg">
              <Users2 className="w-4 h-4 text-[#7C3AED]" />
            </div>
            <p className="text-sm font-bold text-gray-700">
              Assigned Team: <span className="font-mono">{project.team.name}</span>
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {project.team.members.map((m: TeamMember) => (
              <div key={m.id} className="flex items-center gap-3 bg-white/80 rounded-xl px-4 py-3 text-sm hover:shadow-md transition-all">
                <div className="w-9 h-9 bg-gradient-to-br from-[#CCA8E9] to-[#C3BEF0] rounded-full flex items-center justify-center text-xs font-bold text-gray-800">
                  {m.student.firstName[0]}{m.student.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-800 truncate">
                      {m.student.firstName} {m.student.lastName}
                    </span>
                    {m.role === 'LEADER' && <Crown className="w-3 h-3 text-amber-500" />}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{m.student.enrollmentNo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);

export default FacultyDashboard;