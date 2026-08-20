// frontend/src/components/faculty/CreateProposal.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Trash2, CheckCircle, AlertCircle, 
  ChevronLeft, FileText, Tag, Users, Target,
  BookOpen, Layers, Sparkles, ArrowRight, Shield,
  Info, Clock, Calendar as CalendarIcon, Gift, TrendingUp,
  Lightbulb, Crown, Edit3, Send, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { projectService } from '@/services/projectService';
import { poolService } from '@/services/poolService';

interface ProposalFormData {
  title: string;
  description: string;
  domain: string;
  prerequisites: string;
  expectedOutcome: string;
  maxTeamSize: number;
}

const CreateProposal: React.FC = () => {
  const navigate = useNavigate();
  const [poolId, setPoolId] = useState<string | null>(null);
  const [existingProjects, setExistingProjects] = useState<any[]>([]);
  const [existingProjectsCount, setExistingProjectsCount] = useState<number>(0);
  const [proposals, setProposals] = useState<ProposalFormData[]>([
    {
      title: '',
      description: '',
      domain: '',
      prerequisites: '',
      expectedOutcome: '',
      maxTeamSize: 3
    }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});
  const [poolDetails, setPoolDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [availablePools, setAvailablePools] = useState<any[]>([]);
  const [showPoolSelector, setShowPoolSelector] = useState(false);
  
  // Edit mode states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', domain: '', prerequisites: '', expectedOutcome: '', maxTeamSize: 3 });
  
  // Confirmation modal state
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);

  useEffect(() => {
    fetchActivePools();
  }, []);

  const fetchActivePools = async () => {
    setLoading(true);
    try {
      const response = await poolService.list();
      const pools = response.data || [];
      const activePools = pools.filter((pool: any) => 
        pool.status === 'SUBMISSION_OPEN'
      );
      setAvailablePools(activePools);
      
      if (activePools.length === 0) {
        setLoading(false);
        return;
      }
      
      if (activePools.length === 1) {
        await selectPool(activePools[0].id);
      } else {
        setShowPoolSelector(true);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching pools:', error);
      toast.error('Failed to load pools');
      setLoading(false);
    }
  };

  const selectPool = async (selectedPoolId: string) => {
    setLoading(true);
    try {
      const response = await poolService.getById(selectedPoolId);
      if (response && response.id) {
        setPoolId(selectedPoolId);
        setPoolDetails(response);
        
        try {
          const existingProjectsData = await projectService.listByPool(selectedPoolId);
          const allProjects = existingProjectsData.filter((p: any) => 
            p.status === 'DRAFT' || p.status === 'SUBMITTED' || p.status === 'APPROVED' || p.status === 'LOCKED'
          );
          setExistingProjects(allProjects);
          setExistingProjectsCount(allProjects.length);
        } catch (error) {
          console.error('Error fetching existing projects:', error);
          setExistingProjects([]);
          setExistingProjectsCount(0);
        }
        
        setShowPoolSelector(false);
        toast.success(`Connected to: ${response.name}`);
      } else {
        toast.error('Invalid pool selected');
      }
    } catch (error) {
      console.error('Error fetching pool details:', error);
      toast.error('Failed to load pool details');
    } finally {
      setLoading(false);
    }
  };

  const refreshExistingProjects = async () => {
    if (!poolId) return;
    try {
      const existingProjectsData = await projectService.listByPool(poolId);
      const allProjects = existingProjectsData.filter((p: any) => 
        p.status === 'DRAFT' || p.status === 'SUBMITTED' || p.status === 'APPROVED' || p.status === 'LOCKED'
      );
      setExistingProjects(allProjects);
      setExistingProjectsCount(allProjects.length);
    } catch (error) {
      console.error('Error refreshing projects:', error);
    }
  };

  const getRemainingSlots = () => 4 - existingProjectsCount;
  const canAddMoreProposals = () => proposals.length < getRemainingSlots();

  const addProposal = () => {
    if (canAddMoreProposals()) {
      setProposals([...proposals, {
        title: '',
        description: '',
        domain: '',
        prerequisites: '',
        expectedOutcome: '',
        maxTeamSize: 3
      }]);
      setActiveTab(proposals.length);
      toast.success(`Project ${proposals.length + 1} added`);
    } else {
      const remaining = getRemainingSlots();
      if (remaining === 0) {
        toast.error(`Maximum 4 projects reached. Cannot add more.`);
      } else {
        toast.error(`You can only add ${remaining} more project(s).`);
      }
    }
  };

  const removeProposal = (index: number) => {
    if (proposals.length > 1) {
      const newProposals = proposals.filter((_, i) => i !== index);
      setProposals(newProposals);
      if (activeTab >= newProposals.length) {
        setActiveTab(newProposals.length - 1);
      }
      toast.success(`Project ${index + 1} removed`);
    } else {
      toast.error('You need at least one project');
    }
  };

  const updateProposal = (index: number, field: keyof ProposalFormData, value: any) => {
    const updated = [...proposals];
    updated[index] = { ...updated[index], [field]: value };
    setProposals(updated);
    
    if (errors[index]?.[field]) {
      const newErrors = { ...errors };
      delete newErrors[index]?.[field];
      if (Object.keys(newErrors[index] || {}).length === 0) {
        delete newErrors[index];
      }
      setErrors(newErrors);
    }
  };

  const validateAllProposals = (): boolean => {
    let allValid = true;
    const newErrors: typeof errors = {};
    
    proposals.forEach((proposal, idx) => {
      const proposalErrors: Record<string, string> = {};
      if (!proposal.title.trim()) { proposalErrors.title = 'Required'; allValid = false; }
      if (!proposal.description.trim()) { proposalErrors.description = 'Required'; allValid = false; }
      if (!proposal.domain.trim()) { proposalErrors.domain = 'Required'; allValid = false; }
      if (Object.keys(proposalErrors).length > 0) newErrors[idx] = proposalErrors;
    });
    
    setErrors(newErrors);
    if (!allValid) {
      const firstInvalidIndex = Object.keys(newErrors).map(Number)[0];
      if (firstInvalidIndex !== undefined) setActiveTab(firstInvalidIndex);
      toast.error('Please fill all required fields');
    }
    return allValid;
  };

  const handleEditProject = (project: any) => {
    setEditForm({
      title: project.title,
      description: project.description,
      domain: project.domain || '',
      prerequisites: project.prerequisites || '',
      expectedOutcome: project.expectedOutcome || '',
      maxTeamSize: project.maxTeamSize
    });
    setEditingId(project.id);
    setShowEditForm(true);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poolId || !editingId) return;
    
    setIsSubmitting(true);
    try {
      await projectService.edit(poolId, editingId, editForm);
      toast.success('Project updated successfully!');
      setShowEditForm(false);
      setEditingId(null);
      await refreshExistingProjects();
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId: string, projectTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${projectTitle}"? This action cannot be undone.`)) return;
    
    try {
      await projectService.remove(poolId!, projectId);
      toast.success('Project deleted successfully');
      await refreshExistingProjects();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete project');
    }
  };

  const handleFinalizeAll = async () => {
    setShowFinalizeConfirm(false);
    try {
      await projectService.finalize(poolId!);
      toast.success('All projects submitted for review!');
      await refreshExistingProjects();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to finalize projects');
    }
  };

  const handleSubmit = async () => {
    if (!poolId) {
      toast.error('No pool selected');
      return;
    }

    const totalAfterCreation = existingProjectsCount + proposals.length;
    if (totalAfterCreation > 4) {
      toast.error(`Cannot create ${proposals.length} project(s). You already have ${existingProjectsCount}/4 projects. Maximum limit reached.`);
      return;
    }

    if (!validateAllProposals()) return;
    
    setIsSubmitting(true);
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < proposals.length; i++) {
      const proposal = proposals[i];
      const formData = {
        title: proposal.title.trim(),
        description: proposal.description.trim(),
        domain: proposal.domain.trim(),
        prerequisites: proposal.prerequisites?.trim() || '',
        expectedOutcome: proposal.expectedOutcome?.trim() || '',
        maxTeamSize: proposal.maxTeamSize
      };
      
      try {
        await projectService.submit(poolId, formData);
        successCount++;
        toast.success(`Project "${proposal.title}" created!`);
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Creation failed';
        failCount++;
        
        setErrors(prev => ({
          ...prev,
          [i]: { submit: errorMessage }
        }));
        
        toast.error(`Failed: ${errorMessage}`);
      }
    }
    
    if (successCount > 0) {
      toast.success(`✨ Created ${successCount} project(s)! Total: ${existingProjectsCount + successCount}/4`);
      await refreshExistingProjects();
      setProposals([{
        title: '',
        description: '',
        domain: '',
        prerequisites: '',
        expectedOutcome: '',
        maxTeamSize: 3
      }]);
      setActiveTab(0);
    } else if (failCount === proposals.length) {
      toast.error('Failed to create projects. Please try again.');
    }
    
    setIsSubmitting(false);
  };

  const getOverallProgress = () => {
    const totalCompleted = existingProjectsCount + proposals.filter(p => p.title && p.description && p.domain).length;
    return (totalCompleted / 4) * 100;
  };

  const formatDeadline = (dateString: string) => {
    if (!dateString) return { text: 'No deadline', color: 'text-gray-600', bg: 'bg-gray-100' };
    const date = new Date(dateString);
    const today = new Date();
    const daysLeft = Math.ceil((date.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (daysLeft < 0) return { text: 'Closed', color: 'text-red-600', bg: 'bg-red-100' };
    if (daysLeft === 0) return { text: 'Last day today!', color: 'text-orange-600', bg: 'bg-orange-100' };
    if (daysLeft <= 3) return { text: `${daysLeft} days left`, color: 'text-red-600', bg: 'bg-red-100' };
    if (daysLeft <= 7) return { text: `${daysLeft} days left`, color: 'text-orange-600', bg: 'bg-orange-100' };
    return { text: `${daysLeft} days left`, color: 'text-green-600', bg: 'bg-green-100' };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT': return { text: 'Draft', color: 'bg-amber-100 text-amber-700' };
      case 'SUBMITTED': return { text: 'Submitted', color: 'bg-blue-100 text-blue-700' };
      case 'APPROVED': return { text: 'Approved', color: 'bg-emerald-100 text-emerald-700' };
      case 'LOCKED': return { text: 'Locked', color: 'bg-gray-100 text-gray-700' };
      default: return { text: status, color: 'bg-gray-100 text-gray-700' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#DEFCF9]/30 via-[#CADEFC]/20 to-[#C3BEF0]/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-[#C3BEF0] border-t-[#CCA8E9] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading pools...</p>
        </div>
      </div>
    );
  }

  if (showPoolSelector) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#DEFCF9]/30 via-[#CADEFC]/20 to-[#C3BEF0]/30 p-6">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-[#7C3AED] mb-6 transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
          
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Select a Pool</h1>
            <p className="text-gray-500 mt-1">Choose a pool to create your project proposals</p>
          </div>

          {availablePools.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-[#CADEFC]/50 p-8 text-center">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-800 mb-1">No Active Pools</h3>
              <p className="text-gray-500 mb-4">No pools are open for submission at this time</p>
              <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-gradient-to-r from-[#C3BEF0] to-[#CCA8E9] text-gray-700 rounded-lg font-medium hover:from-[#CADEFC] hover:to-[#C3BEF0] transition-all">
                Go to Dashboard
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availablePools.map((pool) => {
                const deadline = formatDeadline(pool.submissionEnd);
                return (
                  <div
                    key={pool.id}
                    onClick={() => selectPool(pool.id)}
                    className="bg-white/80 backdrop-blur-sm rounded-xl border border-[#CADEFC]/50 hover:border-[#CCA8E9] p-5 cursor-pointer transition-all hover:shadow-xl group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1.5 bg-[#C3BEF0]/30 rounded-lg">
                            <BookOpen className="w-4 h-4 text-[#7C3AED]" />
                          </div>
                          <h3 className="font-semibold text-gray-800">{pool.name}</h3>
                        </div>
                        <div className="space-y-1.5 text-sm text-gray-500">
                          <p>{pool.academicYear} • {pool.semester}</p>
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-3 h-3" />
                            <span>Deadline: {new Date(pool.submissionEnd).toLocaleDateString()}</span>
                          </div>
                          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs ${deadline.bg} ${deadline.color}`}>
                            <Clock className="w-3 h-3" />
                            {deadline.text}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#7C3AED] group-hover:translate-x-1 transition-all" />
                    </div>
                    <button className="mt-3 w-full py-2 bg-gradient-to-r from-[#C3BEF0]/50 to-[#CCA8E9]/50 text-gray-700 rounded-lg text-sm font-medium hover:from-[#C3BEF0] hover:to-[#CCA8E9] transition-all">
                      Create Project
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  const remainingSlots = getRemainingSlots();
  const isAtMaxLimit = existingProjectsCount >= 4;
  const deadline = poolDetails ? formatDeadline(poolDetails.submissionEnd) : null;
  const draftCount = existingProjects.filter(p => p.status === 'DRAFT').length;
  const canFinalize = draftCount === 4 && existingProjectsCount === 4;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#DEFCF9]/30 via-[#CADEFC]/20 to-[#C3BEF0]/30">
      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Header with Pool Info */}
        <div className="mb-6">
          <button
            onClick={() => setShowPoolSelector(true)}
            className="flex items-center gap-2 text-gray-500 hover:text-[#7C3AED] mb-4 transition-colors text-sm group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Change Pool
          </button>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-[#CADEFC]/50 p-5 shadow-lg shadow-[#C3BEF0]/20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-[#C3BEF0] to-[#CCA8E9] rounded-xl">
                  <Sparkles className="w-5 h-5 text-gray-700" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">Create Project Submissions</h1>
                  <p className="text-sm text-gray-500">{poolDetails?.name} • {poolDetails?.academicYear} - {poolDetails?.semester}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 bg-emerald-50 rounded-lg">
                  <span className="text-sm font-semibold text-emerald-700">Used: {existingProjectsCount}/4</span>
                </div>
                <div className="px-3 py-1.5 bg-[#C3BEF0]/30 rounded-lg">
                  <span className="text-sm font-semibold text-gray-700">New: {proposals.length}</span>
                </div>
                {deadline && (
                  <div className={`px-3 py-1.5 rounded-lg ${deadline.bg}`}>
                    <span className={`text-sm font-medium ${deadline.color}`}>
                      <Clock className="w-3 h-3 inline mr-1" />
                      {deadline.text}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-[#DEFCF9] to-[#CADEFC] rounded-xl p-4 text-gray-800 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-80">Total Capacity</p>
                <p className="text-2xl font-bold">4</p>
              </div>
              <Layers className="w-8 h-8 text-gray-600/30" />
            </div>
            <p className="text-xs opacity-80 mt-1">Maximum projects per pool</p>
          </div>
          
          <div className="bg-gradient-to-br from-[#CADEFC] to-[#C3BEF0] rounded-xl p-4 text-gray-800 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-80">Existing Projects</p>
                <p className="text-2xl font-bold">{existingProjectsCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-gray-600/30" />
            </div>
            <p className="text-xs opacity-80 mt-1">{4 - existingProjectsCount} slots remaining</p>
          </div>
          
          <div className="bg-gradient-to-br from-[#C3BEF0] to-[#CCA8E9] rounded-xl p-4 text-gray-800 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-80">New Projects</p>
                <p className="text-2xl font-bold">{proposals.length}</p>
              </div>
              <Plus className="w-8 h-8 text-gray-600/30" />
            </div>
            <p className="text-xs opacity-80 mt-1">Ready to create</p>
          </div>
          
          <div className="bg-gradient-to-br from-[#CCA8E9] to-[#C3BEF0] rounded-xl p-4 text-gray-800 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-80">Completion</p>
                <p className="text-2xl font-bold">{Math.round(getOverallProgress())}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-gray-600/30" />
            </div>
            <p className="text-xs opacity-80 mt-1">Overall progress</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-[#CADEFC]/50 p-4 mb-6 shadow-lg shadow-[#C3BEF0]/20">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span className="font-medium">Overall Progress</span>
            <span className="font-bold">{existingProjectsCount + proposals.filter(p => p.title && p.description && p.domain).length}/4</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#C3BEF0] to-[#CCA8E9] rounded-full transition-all duration-500"
              style={{ width: `${getOverallProgress()}%` }}
            />
          </div>
        </div>

        {/* Existing Projects Display with Edit/Delete buttons */}
        {existingProjects.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                Your Projects ({existingProjects.length}/4)
              </h2>
              {canFinalize && (
                <button
                  onClick={() => setShowFinalizeConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg text-sm font-medium hover:from-emerald-600 hover:to-green-700 transition-all shadow-md"
                >
                  <Send className="w-4 h-4" />
                  Finalize All Projects
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3">
              {existingProjects.map((project, idx) => {
                const statusBadge = getStatusBadge(project.status);
                const isDraft = project.status === 'DRAFT';
                return (
                  <div key={project.id} className={`rounded-lg border p-4 bg-white/80 backdrop-blur-sm ${
                    project.status === 'DRAFT' 
                      ? 'border-amber-200'
                      : project.status === 'SUBMITTED'
                      ? 'border-blue-200'
                      : project.status === 'APPROVED'
                      ? 'border-emerald-200'
                      : 'border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                          project.status === 'DRAFT' 
                            ? 'bg-amber-100 text-amber-700'
                            : project.status === 'SUBMITTED'
                            ? 'bg-blue-100 text-blue-700'
                            : project.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800">{project.title}</h3>
                          <p className="text-xs text-gray-500">{project.domain || 'No domain'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${statusBadge.color}`}>
                          {statusBadge.text}
                        </span>
                        {isDraft && (
                          <>
                            <button
                              onClick={() => handleEditProject(project)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit Project"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProject(project.id, project.title)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Project"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Info Banner when at max limit */}
        {isAtMaxLimit && (
          <div className="mb-6 p-4 bg-amber-50/80 backdrop-blur-sm rounded-xl border border-amber-200">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-600" />
              <p className="text-sm text-amber-700">
                🎉 You have already created {existingProjectsCount} project(s) for this pool. Maximum limit of 4 projects reached.
              </p>
            </div>
          </div>
        )}

        {/* New Projects Form - Only show if not at max limit */}
        {!isAtMaxLimit && (
          <>
            {/* Tabs */}
            {proposals.length > 1 && (
              <div className="mb-4 overflow-x-auto">
                <div className="flex gap-2">
                  {proposals.map((proposal, idx) => {
                    const hasErrors = errors[idx] && Object.keys(errors[idx]).length > 0;
                    const isComplete = proposal.title && proposal.description && proposal.domain;
                    return (
                      <button
                        key={idx}
                        onClick={() => setActiveTab(idx)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                          activeTab === idx
                            ? 'bg-gradient-to-r from-[#C3BEF0] to-[#CCA8E9] text-gray-800 shadow-md'
                            : hasErrors
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : isComplete
                            ? 'bg-green-50 text-green-600 border border-green-200'
                            : 'bg-white/50 text-gray-600 border border-[#CADEFC]/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isComplete ? <CheckCircle className="w-3 h-3" /> : hasErrors ? <AlertCircle className="w-3 h-3" /> : <span className="w-3 h-3" />}
                          Project {existingProjectsCount + idx + 1}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Form Cards */}
            <div className="space-y-4">
              {proposals.map((proposal, idx) => (
                <div 
                  key={idx} 
                  className={`bg-white/80 backdrop-blur-sm rounded-xl border ${activeTab === idx ? 'border-[#CCA8E9] shadow-xl' : 'border-[#CADEFC]/50'} transition-all overflow-hidden`}
                >
                  <div className="flex items-center justify-between p-4 border-b border-[#CADEFC]/50 bg-gradient-to-r from-[#DEFCF9]/20 to-[#CADEFC]/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#C3BEF0] to-[#CCA8E9] rounded-lg flex items-center justify-center text-gray-800 font-bold text-sm">
                        {existingProjectsCount + idx + 1}
                      </div>
                      <h3 className="font-semibold text-gray-800">
                        Project {existingProjectsCount + idx + 1} Details
                      </h3>
                    </div>
                    {proposals.length > 1 && (
                      <button
                        onClick={() => removeProposal(idx)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Title */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-1">
                        <FileText className="w-3.5 h-3.5" />
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={proposal.title}
                        onChange={(e) => updateProposal(idx, 'title', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 transition-all bg-white
                          ${errors[idx]?.title 
                            ? 'border-red-300 focus:ring-red-100' 
                            : 'border-[#CADEFC]/50 focus:ring-[#C3BEF0]/50 focus:border-[#CCA8E9]'
                          }`}
                        placeholder="e.g., AI-Powered Student Performance System"
                      />
                      {errors[idx]?.title && <p className="mt-1 text-xs text-red-500">{errors[idx].title}</p>}
                    </div>

                    {/* Description */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={proposal.description}
                        onChange={(e) => updateProposal(idx, 'description', e.target.value)}
                        rows={3}
                        className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 transition-all resize-none bg-white
                          ${errors[idx]?.description 
                            ? 'border-red-300 focus:ring-red-100' 
                            : 'border-[#CADEFC]/50 focus:ring-[#C3BEF0]/50 focus:border-[#CCA8E9]'
                          }`}
                        placeholder="Describe your project objectives and methodology..."
                      />
                      {errors[idx]?.description && <p className="mt-1 text-xs text-red-500">{errors[idx].description}</p>}
                    </div>

                    {/* Domain */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-1">
                        <Tag className="w-3.5 h-3.5" />
                        Domain <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={proposal.domain}
                        onChange={(e) => updateProposal(idx, 'domain', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 transition-all bg-white
                          ${errors[idx]?.domain 
                            ? 'border-red-300 focus:ring-red-100' 
                            : 'border-[#CADEFC]/50 focus:ring-[#C3BEF0]/50 focus:border-[#CCA8E9]'
                          }`}
                        placeholder="e.g., AI, Web Development, IoT"
                      />
                      {errors[idx]?.domain && <p className="mt-1 text-xs text-red-500">{errors[idx].domain}</p>}
                    </div>

                    {/* Team Size */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
                        <Users className="w-3.5 h-3.5" />
                        Team Size <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        {[2, 3, 4 ].map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => updateProposal(idx, 'maxTeamSize', size)}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all border ${
                              proposal.maxTeamSize === size
                                ? 'bg-gradient-to-r from-[#C3BEF0] to-[#CCA8E9] text-gray-800 border-transparent shadow-md'
                                : 'border-[#CADEFC]/50 text-gray-600 hover:border-[#CCA8E9] bg-white'
                            }`}
                          >
                            {size} {size === 1 ? 'Member' : 'Members'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Prerequisites & Expected Outcome */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-1">
                          <Shield className="w-3.5 h-3.5" />
                          Prerequisites
                        </label>
                        <input
                          value={proposal.prerequisites}
                          onChange={(e) => updateProposal(idx, 'prerequisites', e.target.value)}
                          className="w-full px-3 py-2 border border-[#CADEFC]/50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#C3BEF0]/50 focus:border-[#CCA8E9] bg-white"
                          placeholder="Required skills or courses"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-1">
                          <Target className="w-3.5 h-3.5" />
                          Expected Outcome
                        </label>
                        <input
                          value={proposal.expectedOutcome}
                          onChange={(e) => updateProposal(idx, 'expectedOutcome', e.target.value)}
                          className="w-full px-3 py-2 border border-[#CADEFC]/50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#C3BEF0]/50 focus:border-[#CCA8E9] bg-white"
                          placeholder="What will be delivered?"
                        />
                      </div>
                    </div>

                    {errors[idx]?.submit && (
                      <div className="p-2 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors[idx].submit}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add More Button */}
            {canAddMoreProposals() && (
              <button
                onClick={addProposal}
                className="w-full mt-4 py-3 border-2 border-dashed border-[#CADEFC]/50 rounded-xl text-gray-500 hover:border-[#CCA8E9] hover:text-[#7C3AED] hover:bg-white/50 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Another Project ({proposals.length}/{Math.min(remainingSlots, 4 - existingProjectsCount)})
              </button>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 px-4 py-2.5 border border-[#CADEFC]/50 rounded-lg font-medium text-gray-700 hover:bg-white/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || proposals.length === 0}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#C3BEF0] to-[#CCA8E9] text-gray-800 rounded-lg font-medium hover:from-[#CADEFC] hover:to-[#C3BEF0] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Create {proposals.length} Project(s)
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* Edit Project Modal */}
        {showEditForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEditForm(false)}>
            <div className="bg-white rounded-2xl border border-[#CADEFC]/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-[#CADEFC]/50 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#C3BEF0]/30 rounded-xl">
                      <Edit3 className="w-5 h-5 text-[#7C3AED]" />
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg">Edit Project</h3>
                  </div>
                  <button onClick={() => setShowEditForm(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <XCircle className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
              <form onSubmit={handleUpdateProject} className="p-6 space-y-5">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Title <span className="text-red-500">*</span></label>
                  <input 
                    value={editForm.title} 
                    onChange={e => setEditForm({ ...editForm, title: e.target.value })} 
                    required
                    className="w-full mt-1.5 px-4 py-2.5 border border-[#CADEFC]/50 rounded-xl text-sm outline-none focus:border-[#CCA8E9] focus:ring-2 focus:ring-[#C3BEF0]/50 bg-white" 
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Description <span className="text-red-500">*</span></label>
                  <textarea 
                    value={editForm.description} 
                    onChange={e => setEditForm({ ...editForm, description: e.target.value })} 
                    required 
                    rows={5}
                    className="w-full mt-1.5 px-4 py-2.5 border border-[#CADEFC]/50 rounded-xl text-sm outline-none focus:border-[#CCA8E9] focus:ring-2 focus:ring-[#C3BEF0]/50 resize-none bg-white" 
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Domain</label>
                    <input 
                      value={editForm.domain} 
                      onChange={e => setEditForm({ ...editForm, domain: e.target.value })}
                      className="w-full mt-1.5 px-4 py-2.5 border border-[#CADEFC]/50 rounded-xl text-sm outline-none focus:border-[#CCA8E9] focus:ring-2 focus:ring-[#C3BEF0]/50 bg-white" 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Prerequisites</label>
                    <input 
                      value={editForm.prerequisites} 
                      onChange={e => setEditForm({ ...editForm, prerequisites: e.target.value })}
                      className="w-full mt-1.5 px-4 py-2.5 border border-[#CADEFC]/50 rounded-xl text-sm outline-none focus:border-[#CCA8E9] focus:ring-2 focus:ring-[#C3BEF0]/50 bg-white" 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Expected Outcome</label>
                    <input 
                      value={editForm.expectedOutcome} 
                      onChange={e => setEditForm({ ...editForm, expectedOutcome: e.target.value })}
                      className="w-full mt-1.5 px-4 py-2.5 border border-[#CADEFC]/50 rounded-xl text-sm outline-none focus:border-[#CCA8E9] focus:ring-2 focus:ring-[#C3BEF0]/50 bg-white" 
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Max Team Size *</label>
                  <select 
                    value={editForm.maxTeamSize} 
                    onChange={e => setEditForm({ ...editForm, maxTeamSize: Number(e.target.value) })}
                    className="w-full mt-1.5 px-4 py-2.5 border border-[#CADEFC]/50 rounded-xl text-sm outline-none focus:border-[#CCA8E9] focus:ring-2 focus:ring-[#C3BEF0]/50 bg-white"
                  >
                    <option value={3}>3 members</option>
                    <option value={4}>4 members</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" disabled={isSubmitting} className="flex-1 px-6 py-2.5 bg-gradient-to-r from-[#C3BEF0] to-[#CCA8E9] text-gray-800 rounded-xl font-semibold hover:from-[#CADEFC] hover:to-[#C3BEF0] transition-all disabled:opacity-50">
                    {isSubmitting ? 'Saving...' : 'Update Project'}
                  </button>
                  <button type="button" onClick={() => setShowEditForm(false)} className="flex-1 px-6 py-2.5 bg-white border border-[#CADEFC]/50 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Finalize Confirmation Modal */}
        {showFinalizeConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowFinalizeConfirm(false)}>
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Finalize All Projects?</h3>
                <p className="text-gray-500 mb-6">
                  Once finalized, you cannot edit or delete these projects. 
                  They will be submitted for review. Are you sure you want to proceed?
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setShowFinalizeConfirm(false)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleFinalizeAll} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-green-700 transition-all">
                    Yes, Finalize
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tips Section */}
        {!isAtMaxLimit && (
          <div className="mt-6 p-4 bg-gradient-to-r from-[#DEFCF9]/50 to-[#CADEFC]/30 rounded-xl border border-[#CADEFC]/50">
            <div className="flex gap-3">
              <Lightbulb className="w-5 h-5 text-[#7C3AED] flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-700">Pro Tips</p>
                <ul className="text-xs text-gray-600 mt-1 space-y-1">
                  <li>• Clear, descriptive titles help students understand your project better</li>
                  <li>• Include specific tech stack and methodologies in description</li>
                  <li>• Define prerequisites to ensure students are well-prepared</li>
                  <li>• Set realistic team sizes based on project complexity</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateProposal;