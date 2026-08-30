// frontend/src/pages/faculty/MyProjects.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectService } from '@/services/projectService';
import { poolService } from '@/services/poolService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  Users2, Calendar, ChevronRight, Mail, 
  Award, BookOpen, Target, Clock, 
  CheckCircle, User, GraduationCap, 
  Briefcase, Sparkles, Search,
  Filter, X, SlidersHorizontal, ChevronDown,
  ArrowLeft, Info, CalendarDays, Crown, Globe,
  AlertCircle, FileText, Send, Plus, LayoutGrid, List,
  TrendingUp, Zap, Gift, Star, Eye,
  Hash
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Project, TeamMember, Pool } from '@/types';

interface ProjectWithDetails extends Project {
  pool?: Pool;
}

const MyProjects: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectWithDetails[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ProjectWithDetails | null>(null);
  const [pools, setPools] = useState<Record<string, Pool>>({});
  const [activePool, setActivePool] = useState<Pool | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPool, setSelectedPool] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Get unique values for filters
  const [domains, setDomains] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [poolNames, setPoolNames] = useState<{id: string, name: string}[]>([]);
  const [academicYears, setAcademicYears] = useState<string[]>([]);

  useEffect(() => {
    fetchMyProjects();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedDomain, selectedStatus, selectedPool, selectedYear, projects]);

  const fetchMyProjects = async () => {
    setLoading(true);
    try {
      const poolsResponse = await poolService.list();
      const poolsList = poolsResponse.data || [];
      const poolsMap: Record<string, Pool> = {};
      
      const active = poolsList.find((pool: Pool) => pool.status === 'SUBMISSION_OPEN');
      setActivePool(active || null);
      
      poolsList.forEach((pool: Pool) => {
        poolsMap[pool.id] = pool;
      });
      setPools(poolsMap);

      const uniquePools = poolsList.map((pool: Pool) => ({
        id: pool.id,
        name: pool.name
      }));
      setPoolNames(uniquePools);

      const uniqueYears = [...new Set(poolsList.map((pool: Pool) => pool.academicYear))];
      setAcademicYears(uniqueYears as string[]);

      const allProjects: ProjectWithDetails[] = [];
      
      for (const pool of poolsList) {
        try {
          const projectsResponse = await projectService.listByPool(pool.id);
          const poolProjects = projectsResponse.filter((p: Project) => 
            p.status === 'APPROVED' || p.status === 'SUBMITTED'
          );
          
          poolProjects.forEach((project: Project) => {
            allProjects.push({
              ...project,
              pool: pool
            });
          });
        } catch (error) {
          console.error(`Error fetching projects for pool ${pool.id}:`, error);
        }
      }
      
      setProjects(allProjects);
      
      const uniqueDomains = [...new Set(allProjects.map(p => p.domain).filter(Boolean))];
      const uniqueStatuses = [...new Set(allProjects.map(p => p.status))];
      setDomains(uniqueDomains as string[]);
      setStatuses(uniqueStatuses);
      
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...projects];

    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.domain?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedDomain !== 'ALL') {
      filtered = filtered.filter(project => project.domain === selectedDomain);
    }

    if (selectedStatus !== 'ALL') {
      filtered = filtered.filter(project => project.status === selectedStatus);
    }

    if (selectedPool !== 'ALL') {
      filtered = filtered.filter(project => project.pool?.id === selectedPool);
    }

    if (selectedYear !== 'ALL') {
      filtered = filtered.filter(project => project.pool?.academicYear === selectedYear);
    }

    setFilteredProjects(filtered);
    
    let count = 0;
    if (searchTerm) count++;
    if (selectedDomain !== 'ALL') count++;
    if (selectedStatus !== 'ALL') count++;
    if (selectedPool !== 'ALL') count++;
    if (selectedYear !== 'ALL') count++;
    setActiveFiltersCount(count);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedDomain('ALL');
    setSelectedStatus('ALL');
    setSelectedPool('ALL');
    setSelectedYear('ALL');
    setShowFilters(false);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-3.5 h-3.5" />;
      case 'SUBMITTED':
        return <Clock className="w-3.5 h-3.5" />;
      default:
        return <Clock className="w-3.5 h-3.5" />;
    }
  };

  const currentProjects = filteredProjects.filter(p => p.status === 'SUBMITTED');
  const archivedProjects = filteredProjects.filter(p => p.status === 'APPROVED');

  // Project Details View
  if (selectedProject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#DEFCF9]/30 via-[#CADEFC]/20 to-[#C3BEF0]/30">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <button
            onClick={() => setSelectedProject(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-[#7C3AED] mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Projects
          </button>

          {/* Project Header - Pastel Gradient */}
          <div className="bg-gradient-to-r from-[#C3BEF0] to-[#CCA8E9] rounded-2xl p-8 text-gray-800 mb-8 shadow-xl">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${getStatusColor(selectedProject.status)}`}>
                    {getStatusIcon(selectedProject.status)}
                    {selectedProject.status}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold mb-3">{selectedProject.title}</h1>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/40 rounded-lg text-sm">
                    <Globe className="w-3.5 h-3.5" />
                    {selectedProject.domain || 'Not specified'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/40 rounded-lg text-sm">
                    <Hash className="w-3.5 h-3.5" />
                    {selectedProject.projectCode || 'Not assigned'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/40 rounded-lg text-sm">
                    <Users2 className="w-3.5 h-3.5" />
                    Team Size: {selectedProject.maxTeamSize}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/40 rounded-lg text-sm">
                    <Calendar className="w-3.5 h-3.5" />
                    {selectedProject.pool?.academicYear} • {selectedProject.pool?.semester}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-[#CADEFC]/50 p-6 shadow-lg shadow-[#C3BEF0]/20">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-gray-800">
                  <BookOpen className="w-5 h-5 text-[#7C3AED]" />
                  Description
                </h2>
                <p className="text-gray-700 leading-relaxed">{selectedProject.description}</p>
              </div>

              {(selectedProject.prerequisites || selectedProject.expectedOutcome) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedProject.prerequisites && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-[#CADEFC]/50 p-6 shadow-lg shadow-[#C3BEF0]/20">
                      <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-gray-800">
                        <GraduationCap className="w-5 h-5 text-[#7C3AED]" />
                        Prerequisites
                      </h2>
                      <p className="text-gray-700">{selectedProject.prerequisites}</p>
                    </div>
                  )}
                  {selectedProject.expectedOutcome && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-[#CADEFC]/50 p-6 shadow-lg shadow-[#C3BEF0]/20">
                      <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-gray-800">
                        <Award className="w-5 h-5 text-[#7C3AED]" />
                        Expected Outcome
                      </h2>
                      <p className="text-gray-700">{selectedProject.expectedOutcome}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-[#C3BEF0] to-[#CCA8E9] rounded-xl p-6 text-gray-800 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Users2 className="w-6 h-6" />
                  <h2 className="text-xl font-bold">Team Members</h2>
                </div>
                <p className="text-gray-700 text-sm">
                  {selectedProject.team?.members?.length || 0} members assigned
                </p>
              </div>

              {selectedProject.team && selectedProject.team.members ? (
                <div className="space-y-3">
                  {selectedProject.team.members.map((member: TeamMember) => (
                    <div key={member.id} className={`bg-white/80 backdrop-blur-sm rounded-xl border p-4 shadow-md ${
                      member.role === 'LEADER' 
                        ? 'border-amber-200 bg-amber-50/50'
                        : 'border-[#CADEFC]/50'
                    }`}>
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md ${
                          member.role === 'LEADER'
                            ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                            : 'bg-gradient-to-br from-[#C3BEF0] to-[#CCA8E9] text-gray-800'
                        }`}>
                          {member.student.firstName[0]}{member.student.lastName[0]}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-800">
                              {member.student.firstName} {member.student.lastName}
                            </h3>
                            {member.role === 'LEADER' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold">
                                <Crown className="w-3 h-3" />
                                Leader
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                            <GraduationCap className="w-3.5 h-3.5" />
                            {member.student.enrollmentNo}
                          </p>
                          {member.student.email && (
                            <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                              <Mail className="w-3.5 h-3.5" />
                              {member.student.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-[#CADEFC]/50 p-8 text-center">
                  <Users2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No team assigned yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#DEFCF9]/30 via-[#CADEFC]/20 to-[#C3BEF0]/30 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const hasActivePool = activePool !== null;
  const hasProjectsInActivePool = currentProjects.some(p => p.pool?.id === activePool?.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#DEFCF9]/30 via-[#CADEFC]/20 to-[#C3BEF0]/30">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#7C3AED] to-[#A855F7] bg-clip-text text-transparent">
                My Projects
              </h1>
              <p className="text-gray-500 mt-1">Track and manage your submitted projects</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-white/50 backdrop-blur-sm rounded-lg p-1 border border-[#CADEFC]/50">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-md' : 'text-gray-500'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-md' : 'text-gray-500'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              <div className="px-4 py-2 bg-gradient-to-r from-[#C3BEF0]/50 to-[#CCA8E9]/50 rounded-xl shadow-md">
                <span className="text-sm font-semibold text-gray-700">
                  Total: {filteredProjects.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, description, or domain..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/80 backdrop-blur-sm border border-[#CADEFC]/50 rounded-xl text-sm outline-none focus:border-[#CCA8E9] focus:ring-2 focus:ring-[#C3BEF0]/50"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-gradient-to-r from-[#C3BEF0] to-[#CCA8E9] text-gray-800 shadow-md'
                  : 'bg-white/80 backdrop-blur-sm border border-[#CADEFC]/50 text-gray-700 hover:bg-white'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-gray-700/20 rounded-full text-xs">
                  {activeFiltersCount}
                </span>
              )}
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 rounded-xl font-semibold text-sm hover:bg-red-100 transition-all"
              >
                <X className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>

          {showFilters && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-[#CADEFC]/50 p-5 shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-2 block">Domain</label>
                  <select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#CADEFC]/50 rounded-lg text-sm outline-none focus:border-[#CCA8E9]"
                  >
                    <option value="ALL">All Domains</option>
                    {domains.map(domain => <option key={domain} value={domain}>{domain}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-2 block">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#CADEFC]/50 rounded-lg text-sm outline-none focus:border-[#CCA8E9]"
                  >
                    <option value="ALL">All Status</option>
                    {statuses.map(status => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-2 block">Pool</label>
                  <select
                    value={selectedPool}
                    onChange={(e) => setSelectedPool(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#CADEFC]/50 rounded-lg text-sm outline-none focus:border-[#CCA8E9]"
                  >
                    <option value="ALL">All Pools</option>
                    {poolNames.map(pool => <option key={pool.id} value={pool.id}>{pool.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-2 block">Academic Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#CADEFC]/50 rounded-lg text-sm outline-none focus:border-[#CCA8E9]"
                  >
                    <option value="ALL">All Years</option>
                    {academicYears.map(year => <option key={year} value={year}>{year}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Active Pool Warning */}
        {hasActivePool && !hasProjectsInActivePool && (
          <div className="mb-6 p-4 bg-amber-50/80 backdrop-blur-sm border border-amber-200 rounded-xl flex items-center justify-between flex-wrap gap-4 shadow-md">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Action Required</p>
                <p className="text-sm text-amber-700">You haven't submitted any projects for the active pool: {activePool.name}</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/faculty/proposals')}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:from-amber-600 hover:to-orange-600 transition-all flex items-center gap-2 shadow-md"
            >
              <Plus className="w-4 h-4" />
              Create Projects
            </button>
          </div>
        )}

        {/* Current Projects Section */}
        {currentProjects.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-gradient-to-b from-[#C3BEF0] to-[#CCA8E9] rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-800">Current Projects</h2>
              <span className="px-2 py-0.5 bg-[#C3BEF0]/50 text-gray-700 rounded-full text-xs font-medium">
                {currentProjects.length}
              </span>
            </div>
            
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentProjects.map((project, index) => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    index={index}
                    onClick={() => setSelectedProject(project)}
                    getStatusColor={getStatusColor}
                    getStatusIcon={getStatusIcon}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {currentProjects.map((project) => (
                  <ProjectListItem 
                    key={project.id} 
                    project={project}
                    onClick={() => setSelectedProject(project)}
                    getStatusColor={getStatusColor}
                    getStatusIcon={getStatusIcon}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Archived Projects Section */}
        {archivedProjects.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-gray-400 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-800">Archived Projects</h2>
              <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full text-xs font-medium">
                {archivedProjects.length}
              </span>
            </div>
            
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {archivedProjects.map((project, index) => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    index={index}
                    onClick={() => setSelectedProject(project)}
                    getStatusColor={getStatusColor}
                    getStatusIcon={getStatusIcon}
                    isArchived
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {archivedProjects.map((project) => (
                  <ProjectListItem 
                    key={project.id} 
                    project={project}
                    onClick={() => setSelectedProject(project)}
                    getStatusColor={getStatusColor}
                    getStatusIcon={getStatusIcon}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-xl border border-[#CADEFC]/50 shadow-lg">
            <div className="w-20 h-20 bg-[#C3BEF0]/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-[#7C3AED]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No projects found</h3>
            <p className="text-gray-500">
              {searchTerm || activeFiltersCount > 0 
                ? "Try adjusting your search or filter criteria" 
                : "No approved or submitted projects yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Project Card Component - Pastel Themed
const ProjectCard: React.FC<{
  project: ProjectWithDetails;
  index: number;
  onClick: () => void;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  isArchived?: boolean;
}> = ({ project, index, onClick, getStatusColor, getStatusIcon, isArchived }) => (
  <div
    onClick={onClick}
    className="group bg-white/80 backdrop-blur-sm rounded-xl border border-[#CADEFC]/50 hover:border-[#CCA8E9] overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer"
  >
    <div className={`relative h-24 p-4 ${isArchived ? 'bg-gradient-to-r from-gray-500 to-gray-600' : 'bg-gradient-to-r from-[#C3BEF0] to-[#CCA8E9]'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/30 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <span className="text-gray-800 font-bold text-sm">{index + 1}</span>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold ${getStatusColor(project.status)}`}>
          {getStatusIcon(project.status)}
          {project.status}
        </span>
      </div>
      <h3 className="text-gray-800 font-semibold text-sm mt-2 line-clamp-2">{project.title}</h3>
    </div>
    <div className="p-4">
      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{project.description}</p>
      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <span className="flex items-center gap-1">
          <Target className="w-3 h-3" />
          {project.domain || 'No domain'}
        </span>
        <span className="flex items-center gap-1">
          <Users2 className="w-3 h-3" />
          {project.team?.members?.length || 0}/{project.maxTeamSize}
        </span>
      </div>
      <button className="w-full py-1.5 bg-gradient-to-r from-[#C3BEF0]/50 to-[#CCA8E9]/50 text-gray-700 rounded-lg text-xs font-medium hover:from-[#C3BEF0] hover:to-[#CCA8E9] transition-all">
        View Details
      </button>
    </div>
  </div>
);

// Project List Item Component
const ProjectListItem: React.FC<{
  project: ProjectWithDetails;
  onClick: () => void;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
}> = ({ project, onClick, getStatusColor, getStatusIcon }) => (
  <div
    onClick={onClick}
    className="bg-white/80 backdrop-blur-sm rounded-xl border border-[#CADEFC]/50 p-4 hover:border-[#CCA8E9] hover:shadow-md transition-all cursor-pointer"
  >
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="font-semibold text-gray-800">{project.title}</h3>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold ${getStatusColor(project.status)}`}>
            {getStatusIcon(project.status)}
            {project.status}
          </span>
        </div>
        <p className="text-sm text-gray-500 line-clamp-1">{project.description}</p>
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Target className="w-3 h-3" />
            {project.domain || 'No domain'}
          </span>
          <span className="flex items-center gap-1">
            <Users2 className="w-3 h-3" />
            {project.team?.members?.length || 0}/{project.maxTeamSize}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {project.pool?.academicYear}
          </span>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#7C3AED] transition-colors" />
    </div>
  </div>
);

export default MyProjects;