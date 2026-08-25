// frontend/src/pages/student/BrowseProjectsPage.tsx
import React, { useState, useEffect } from 'react';
import { projectService } from '@/services/projectService';
import { teamService } from '@/services/teamService';
import { poolService } from '@/services/poolService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Search, Eye, Users, Clock, Sparkles, ChevronRight, BookOpen, Code, Cpu, Network, Heart, Zap, TrendingUp, CheckCircle2} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import type { Project, Team } from '@/types';
import { getErrorMessage } from '@/types';

type FilterType = 'all' | 'available' | 'taken';

// Domain icons mapping
const getDomainIcon = (domain?: string) => {
  const domainLower = domain?.toLowerCase() || '';
  if (domainLower.includes('ai') || domainLower.includes('ml') || domainLower.includes('machine')) return <Cpu className="w-3.5 h-3.5" />;
  if (domainLower.includes('web') || domainLower.includes('platform')) return <Code className="w-3.5 h-3.5" />;
  if (domainLower.includes('health') || domainLower.includes('medical')) return <Heart className="w-3.5 h-3.5" />;
  if (domainLower.includes('network') || domainLower.includes('cloud')) return <Network className="w-3.5 h-3.5" />;
  if (domainLower.includes('research')) return <BookOpen className="w-3.5 h-3.5" />;
  return <Zap className="w-3.5 h-3.5" />;
};

// Get domain badge color
const getDomainColor = (domain?: string) => {
  const domainLower = domain?.toLowerCase() || '';
  if (domainLower.includes('ai') || domainLower.includes('ml')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (domainLower.includes('web')) return 'bg-teal-100 text-teal-700 border-teal-200';
  if (domainLower.includes('health')) return 'bg-green-100 text-green-700 border-green-200';
  if (domainLower.includes('network') || domainLower.includes('cloud')) return 'bg-cyan-100 text-cyan-700 border-cyan-200';
  if (domainLower.includes('research')) return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-gray-100 text-gray-700 border-gray-200';
};

// Gradient brand colors
const gradientBrand = 'linear-gradient(135deg, #11998e 0%, #38ef7d 50%, #a8e6cf 100%)';
const gradientCard = 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(245,255,250,0.95) 100%)';

// Caution Dialog Component - FULLY FUNCTIONAL
const CautionDialog: React.FC<{
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ open, onConfirm, onCancel }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
        <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-t-2xl px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white">Caution – Read Carefully</h3>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
            {/* <p className="text-amber-800 text-sm font-medium">
             ⭐  Once you select a project, you cannot change it.
            </p> */}
            <div className="text-amber-800 text-sm font-medium space-y-2">
              <div className="flex items-start gap-2">
                <span className="mt-[2px]">⭐</span>
                <p>Once you select a project, you cannot change it.</p>
              </div>

              <div className="flex items-start gap-2">
                <span className="mt-[2px]">⭐</span>
                <p>
                  Changes may only be considered subject to PQAC approval and project
                  availability.
                </p>
              </div>
            </div>
            
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-gray-700">
              <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <p className="text-sm">There is <strong>NO automatic option</strong> to switch projects or teams.</p>
            </div>
            
            <div className="flex items-start gap-2 text-gray-700">
              <svg className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">If you want to change: You must contact the <strong>Project Head / Admin</strong> directly.</p>
            </div>
            
            <div className="flex items-start gap-2 text-gray-700">
              <svg className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">Approval is <strong>not guaranteed</strong>.</p>
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-3">
            <p className="text-red-700 text-xs text-center font-medium">
              ⚠️ Avoid making decisions in a hurry.
            </p>
          </div>
        </div>
        
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-orange-600 rounded-xl hover:from-red-700 hover:to-orange-700 transition-all shadow-lg"
          >
            I Understand, Proceed
          </button>
        </div>
      </div>
    </div>
  );
};

// Project Details Modal Component
const ProjectDetailsModal: React.FC<{
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (projectId: string) => void;
  canSelect: boolean;
  isTaken: boolean;
}> = ({ project, isOpen, onClose, onSelect, canSelect, isTaken }) => {
  if (!project || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${getDomainColor(project.domain)}`}>
              {getDomainIcon(project.domain)}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{project.title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Description</h3>
            <p className="text-gray-700 leading-relaxed">{project.description}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {project.domain && (
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Domain</h3>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full ${getDomainColor(project.domain)}`}>
                  {getDomainIcon(project.domain)}
                  {project.domain}
                </span>
              </div>
            )}
            {project.maxTeamSize && (
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Team Size</h3>
                <div className="flex items-center gap-1.5 text-sm text-gray-700">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>Up to {project.maxTeamSize} members</span>
                </div>
              </div>
            )}
            {project.prerequisites && (
              <div className="col-span-2">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Prerequisites</h3>
                <span className="inline-block px-3 py-1.5 text-xs bg-yellow-50 text-yellow-700 rounded-full border border-yellow-200">
                  {project.prerequisites}
                </span>
              </div>
            )}
          </div>
          
          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            {isTaken ? (
              <button disabled className="px-4 py-2 text-sm font-medium text-white bg-gray-400 rounded-xl cursor-not-allowed">
                Already Taken
              </button>
            ) : canSelect ? (
              <button onClick={() => onSelect(project.id)} className="px-4 py-2 text-sm font-medium text-white rounded-xl transition-all shadow-lg" style={{ background: gradientBrand }}>
                Select Project
              </button>
            ) : (
              <button disabled className="px-4 py-2 text-sm font-medium text-white bg-gray-400 rounded-xl cursor-not-allowed">
                Cannot Select
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const BrowseProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [poolId, setPoolId] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectId, setSelectId] = useState<string | null>(null);
  const [selectedProjectForModal, setSelectedProjectForModal] = useState<Project | null>(null);
  
  // Caution dialog states - EXACTLY AS YOUR ORIGINAL CODE
  const [showCaution, setShowCaution] = useState(false);
  const [pendingProjectId, setPendingProjectId] = useState<string | null>(null);

  useEffect(() => {
    poolService.list().then(async r => {
      const pool = r.data?.[0];
      if (pool) {
        setPoolId(pool.id);
        const [p, t] = await Promise.all([projectService.listByPool(pool.id), teamService.getMyTeam(pool.id)]);
        setProjects(p); setMyTeam(t);
      }
    }).finally(() => setLoading(false));
  }, []);

  const selectProject = async () => {
    if (!selectId || !myTeam) return;
    try {
      await teamService.selectProject(poolId, myTeam.id, selectId);
      toast.success('Project selected successfully!');
      const [p, t] = await Promise.all([projectService.listByPool(poolId), teamService.getMyTeam(poolId)]);
      setProjects(p); setMyTeam(t);
      setSelectedProjectForModal(null);
    } catch (e: unknown) { 
      toast.error(getErrorMessage(e)); 
    }
    setSelectId(null);
  };

  const handleViewProject = (project: Project) => {
    setSelectedProjectForModal(project);
  };

  const handleSelectFromModal = (projectId: string) => {
    setPendingProjectId(projectId);
    setShowCaution(true);
    setSelectedProjectForModal(null);
  };

  const handleCautionConfirm = () => {
    if (pendingProjectId) {
      setSelectId(pendingProjectId);
      setPendingProjectId(null);
    }
    setShowCaution(false);
  };

  const handleCautionCancel = () => {
    setPendingProjectId(null);
    setShowCaution(false);
  };

  const getFilteredProjects = () => {
    let filtered = projects.filter(p => 
      !search || 
      p.title.toLowerCase().includes(search.toLowerCase()) || 
      p.domain?.toLowerCase().includes(search.toLowerCase())
    );
    
    if (activeFilter === 'available') {
      filtered = filtered.filter(p => !p.team);
    } else if (activeFilter === 'taken') {
      filtered = filtered.filter(p => p.team);
    }
    
    return filtered;
  };

  const filteredProjects = getFilteredProjects();
  const totalProjects = projects.length;
  const availableCount = projects.filter(p => !p.team).length;
  const takenCount = projects.filter(p => p.team).length;
  const canSelect = myTeam && !myTeam.projectId && myTeam.leaderId;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(circle at 10% 20%, #e8f5e9 0%, #c8e6c9 50%, #a5d6a7 100%)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl border border-border p-8 lg:p-10" style={{ background: gradientCard, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-30 blur-3xl" style={{ background: gradientBrand }} />
          <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-accent text-accent-foreground border border-border">
                <TrendingUp className="h-3 w-3" style={{ color: '#11998e' }} /> Spring 2026 cohort · Allocation open
              </div>
              <h1 className="mt-4 text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.05] text-gray-900">
                Discover your{" "}
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: gradientBrand }}>
                  next project
                </span>
              </h1>
              <p className="mt-3 text-muted-foreground leading-relaxed text-gray-500">
                Curated capstone opportunities matched to your skills, interests and faculty preferences.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 lg:gap-4">
              {[
                { label: "Total", value: totalProjects },
                { label: "Available", value: availableCount, accent: true },
                { label: "Taken", value: takenCount },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-border bg-white px-5 py-4 min-w-[110px] shadow-sm">
                  <p className="text-[11px] uppercase tracking-widest text-gray-400">{s.label}</p>
                  <p className="text-2xl font-semibold mt-1 text-gray-900"
                    style={s.accent ? {
                      backgroundImage: gradientBrand,
                      WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
                    } : undefined}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Filter Tabs */}
        <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="inline-flex p-1 rounded-2xl border border-gray-200 bg-white shadow-sm">
            {[
              { k: "all", label: "All Projects", n: totalProjects },
              { k: "available", label: "Available", n: availableCount },
              { k: "taken", label: "Taken", n: takenCount },
            ].map((t) => {
              const active = activeFilter === t.k;
              return (
                <button key={t.k} onClick={() => setActiveFilter(t.k as FilterType)}
                  // className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    //active ? "text-white shadow-md" : "text-gray-500 hover:text-gray-700"
                    active 
                    ? "text-white shadow-md hover:shadow-xl hover:scale-[1.02] border border-white/20" 
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  }`}
                  style={active ? { background: 'linear-gradient(135deg, #16a34a, #059669)' } : undefined}>
                  {t.label}
                  <span className={`ml-2 text-[11px] px-1.5 py-0.5 rounded-md ${active ? "bg-white/20" : "bg-gray-100 text-gray-500"}`}>
                    {t.n}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects, tags, faculty…"
              className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-shadow shadow-sm" 
            />
          </div>
        </section>

        {/* Team Selection Status Banner */}
        {myTeam?.projectId && (
          <div className="rounded-2xl border border-green-200 p-4 flex items-center" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' }}>
            <div className="rounded-full p-1 mr-3" style={{ background: gradientBrand }}>
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-green-700">
              Your team has selected a project: <strong>{myTeam.project?.title}</strong>
            </span>
          </div>
        )}

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <EmptyState 
            title="No projects available" 
            subtitle={search ? "Try adjusting your search terms" : "Check back later for new projects"}
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map(project => {
              const isTaken = !!project.team;
              return (
                <article 
                  key={project.id} 
                  className="group relative rounded-3xl border border-gray-200 overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  style={{ background: gradientCard, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}
                >
                  <div className="absolute inset-x-0 top-0 h-1 opacity-80" style={{ background: gradientBrand }} />
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[11px] font-medium uppercase tracking-widest px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 border border-gray-200">
                        {project.domain || 'General'}
                      </span>
                      {isTaken ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">
                          <Clock className="h-3 w-3" /> Taken
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-600 border border-green-200">
                          <CheckCircle2 className="h-3 w-3" /> Available
                        </span>
                      )}
                    </div>
                    <h3 className="mt-5 text-lg font-semibold tracking-tight leading-snug text-gray-900 line-clamp-2">{project.title}</h3>
                    <p className="mt-2 text-sm text-gray-500 leading-relaxed line-clamp-3">{project.description}</p>
                    <div className="mt-6 flex items-center gap-4 text-xs text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        <span className="font-medium text-gray-600">{project.maxTeamSize || 3}</span> members
                      </div>
                      <span className="h-1 w-1 rounded-full bg-gray-300" />
                      <span>Lead · Faculty</span>
                    </div>
                  </div>
                  
                  <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex -space-x-2">
                      {Array.from({ length: Math.min(project.maxTeamSize || 3, 4) }).map((_, i) => (
                        <div key={i} className="h-7 w-7 rounded-full border-2 border-white grid place-items-center text-[10px] font-semibold text-white shadow-sm"
                          style={{ background: gradientBrand }}>
                          {String.fromCharCode(65 + i)}
                        </div>
                      ))}
                    </div>
                    
                   <button 
                      onClick={() => handleViewProject(project)}
                      disabled={isTaken}
                      className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl text-white 
                      disabled:opacity-50 disabled:cursor-not-allowed 
                      shadow-md hover:shadow-xl hover:scale-[1.02] transition-all border border-white/20"
                      style={!isTaken 
                        ? { background: 'linear-gradient(135deg, #16a34a, #059669)' } 
                        : { background: '#9ca3af' }
                      }
                    >
                      <Eye className="h-4 w-4" />
                      {isTaken ? "View" : "View & Apply"}
                  </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Project Details Modal */}
        <ProjectDetailsModal
          project={selectedProjectForModal}
          isOpen={!!selectedProjectForModal}
          onClose={() => setSelectedProjectForModal(null)}
          onSelect={handleSelectFromModal}
          canSelect={!!(canSelect && !myTeam?.projectId)}
          isTaken={!!(selectedProjectForModal && selectedProjectForModal.team)}
        />

        {/* Caution Dialog - FULLY FUNCTIONAL */}
        <CautionDialog
          open={showCaution}
          onConfirm={handleCautionConfirm}
          onCancel={handleCautionCancel}
        />

        {/* Selection Confirmation Dialog */}
        {selectId && (
          <ConfirmDialog 
            open 
            title="Confirm Project Selection" 
            message="Are you sure you want to select this project for your team?" 
            variant="info" 
            confirmText="Yes, Confirm Selection" 
            onConfirm={selectProject} 
            onCancel={() => setSelectId(null)} 
          />
        )}
      </div>
    </div>
  );
};

export default BrowseProjectsPage;
