import React, { useState, useEffect } from 'react';

import { projectService } from '@/services/projectService';
import { poolService } from '@/services/poolService';
import { teamService } from '@/services/teamService';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import {
  Users2,
  MessageSquare,
  Search,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  UserPlus,
  MessageCircle,
  Send,
  Crown,
  TrendingUp,
  LayoutGrid,
  List,
  MoreHorizontal,
  Trash2,
  Pin,
  Target,
  UserCheck,
  UserX,
  FileText,
  ShieldCheck,
  CalendarDays,
  BookOpen,
} from 'lucide-react';

import toast from 'react-hot-toast';

import type { Project, TeamMember, Pool } from '@/types';
import { getErrorMessage } from '@/types';

interface ProjectWithDetails extends Project {
  pool?: Pool;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  enrollmentNo?: string;
  department?: string;
  role?: string;
}

interface ChatGroup {
  id: string;
  name: string;
  description: string;
  members: Student[];
  createdAt: Date;
  isPinned?: boolean;
  unreadCount?: number;
}

type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface TeamLeaveRequest {
  id: string;
  teamId: string;
  studentId: string;
  reason: string;
  status: LeaveRequestStatus;
  reviewedAt?: string | null;
  responseNote?: string | null;
  createdAt: string;
  updatedAt?: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    enrollmentNo?: string;
  };
  team: {
    id: string;
    name: string;
    project?: {
      id: string;
      title: string;
      projectCode?: string | null;
    } | null;
  };
  reviewedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

const TeamManagement: React.FC = () => {
  const [projects, setProjects] = useState<ProjectWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);

  const [viewMode, setViewMode] = useState<'cards' | 'compact'>('cards');

  const [activeTab, setActiveTab] = useState<
    'projects' | 'groups' | 'leaveRequests'
  >('projects');

  const [leaveRequests, setLeaveRequests] = useState<TeamLeaveRequest[]>([]);
  const [loadingLeaveRequests, setLoadingLeaveRequests] = useState(false);
  const [reviewingRequestId, setReviewingRequestId] = useState<string | null>(
    null
  );

  const [reviewModal, setReviewModal] = useState<{
    request: TeamLeaveRequest;
    status: 'APPROVED' | 'REJECTED';
  } | null>(null);

  const [responseNote, setResponseNote] = useState('');

  useEffect(() => {
    fetchProjectsAndStudents();
    loadExistingGroups();
    loadLeaveRequests();
  }, []);

  const fetchProjectsAndStudents = async () => {
    setLoading(true);

    try {
      const poolsResponse = await poolService.list();
      const poolsList = poolsResponse.data || [];

      const allProjects: ProjectWithDetails[] = [];
      const studentsList: Student[] = [];
      const studentIds = new Set<string>();

      for (const pool of poolsList) {
        try {
          const projectsResponse = await projectService.listByPool(pool.id);

          const approvedProjects = projectsResponse.filter(
            (p: Project) => p.status === 'APPROVED'
          );

          approvedProjects.forEach((project: Project) => {
            allProjects.push({
              ...project,
              pool,
            });

            if (project.team && project.team.members) {
              project.team.members.forEach((member: TeamMember) => {
                if (!studentIds.has(member.student.id)) {
                  studentIds.add(member.student.id);

                  studentsList.push({
                    id: member.student.id,
                    firstName: member.student.firstName,
                    lastName: member.student.lastName,
                    email: member.student.email || '',
                    enrollmentNo: member.student.enrollmentNo || '',
                    department: 'CSE',
                    role: member.role,
                  });
                }
              });
            }
          });
        } catch (error) {
          console.error(
            `Error fetching projects for pool ${pool.id}:`,
            error
          );
        }
      }

      setProjects(allProjects);
      setAllStudents(studentsList);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingGroups = () => {
    const storedGroups = localStorage.getItem('chatGroups');

    if (storedGroups) {
      try {
        const groups = JSON.parse(storedGroups);

        setChatGroups(
          groups.map((g: ChatGroup) => ({
            ...g,
            createdAt: new Date(g.createdAt),
          }))
        );
      } catch (error) {
        console.error('Error loading groups:', error);
      }
    }
  };

  const loadLeaveRequests = async () => {
    setLoadingLeaveRequests(true);

    try {
      const response = await teamService.getLeaveRequestsForFaculty();

      const data = response?.data ?? response;

      setLeaveRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading team leave requests:', error);
      toast.error('Failed to load team leave requests');
    } finally {
      setLoadingLeaveRequests(false);
    }
  };

  const saveGroups = (groups: ChatGroup[]) => {
    localStorage.setItem('chatGroups', JSON.stringify(groups));
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    const newGroup: ChatGroup = {
      id: Date.now().toString(),
      name: groupName.trim(),
      description: groupDescription.trim(),
      members: selectedStudents,
      createdAt: new Date(),
      isPinned: false,
      unreadCount: 0,
    };

    const updatedGroups = [newGroup, ...chatGroups];

    setChatGroups(updatedGroups);
    saveGroups(updatedGroups);

    toast.success(
      `✨ Group "${groupName}" created with ${selectedStudents.length} members!`
    );

    setShowCreateGroup(false);
    setGroupName('');
    setGroupDescription('');
    setSelectedStudents([]);
  };

  const toggleStudentSelection = (student: Student) => {
    setSelectedStudents((prev) => {
      const exists = prev.some((s) => s.id === student.id);

      if (exists) {
        return prev.filter((s) => s.id !== student.id);
      }

      return [...prev, student];
    });
  };

  const getProjectStudents = (
    project: ProjectWithDetails
  ): (Student & { role?: string })[] => {
    if (!project.team || !project.team.members) {
      return [];
    }

    return project.team.members.map((m) => ({
      id: m.student.id,
      firstName: m.student.firstName,
      lastName: m.student.lastName,
      email: m.student.email,
      enrollmentNo: m.student.enrollmentNo || '',
      department: 'CSE',
      role: m.role,
    }));
  };

  const handleDeleteGroup = (groupId: string) => {
    const updatedGroups = chatGroups.filter((g) => g.id !== groupId);

    setChatGroups(updatedGroups);
    saveGroups(updatedGroups);

    toast.success('Group deleted successfully');
  };

  const handleTogglePin = (groupId: string) => {
    const updatedGroups = chatGroups.map((g) =>
      g.id === groupId ? { ...g, isPinned: !g.isPinned } : g
    );

    setChatGroups(updatedGroups);
    saveGroups(updatedGroups);

    toast.success('Group updated');
  };

  const openReviewModal = (
    request: TeamLeaveRequest,
    status: 'APPROVED' | 'REJECTED'
  ) => {
    setResponseNote('');
    setReviewModal({
      request,
      status,
    });
  };

  const closeReviewModal = () => {
    if (reviewingRequestId) {
      return;
    }

    setReviewModal(null);
    setResponseNote('');
  };

  const handleReviewLeaveRequest = async () => {
    if (!reviewModal) {
      return;
    }

    const { request, status } = reviewModal;

    setReviewingRequestId(request.id);

    try {
      await teamService.reviewLeaveRequest(
        request.id,
        status,
        responseNote.trim() || undefined
      );

      if (status === 'APPROVED') {
        toast.success(
          `${request.student.firstName} ${request.student.lastName} has been removed from the team.`
        );
      } else {
        toast.success('Leave request rejected successfully.');
      }

      setReviewModal(null);
      setResponseNote('');

      await Promise.all([
        loadLeaveRequests(),
        fetchProjectsAndStudents(),
      ]);
    } catch (error: unknown) {
      console.error('Error reviewing leave request:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setReviewingRequestId(null);
    }
  };

  const filteredProjects = projects.filter(
    (project) =>
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.domain?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroups = chatGroups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLeaveRequests = leaveRequests.filter((request) => {
    const search = searchTerm.toLowerCase();

    const studentName = `${request.student.firstName} ${request.student.lastName}`;

    const projectTitle = request.team.project?.title || '';

    const projectCode = request.team.project?.projectCode || '';

    const teamName = request.team.name || '';

    return (
      studentName.toLowerCase().includes(search) ||
      request.student.email?.toLowerCase().includes(search) ||
      request.student.enrollmentNo?.toLowerCase().includes(search) ||
      projectTitle.toLowerCase().includes(search) ||
      projectCode.toLowerCase().includes(search) ||
      teamName.toLowerCase().includes(search) ||
      request.reason.toLowerCase().includes(search)
    );
  });

  const pendingLeaveRequests = leaveRequests.filter(
    (request) => request.status === 'PENDING'
  ).length;

  const approvedLeaveRequests = leaveRequests.filter(
    (request) => request.status === 'APPROVED'
  ).length;

  const rejectedLeaveRequests = leaveRequests.filter(
    (request) => request.status === 'REJECTED'
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#DEFCF9]/30 via-[#CADEFC]/20 to-[#C3BEF0]/30 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#DEFCF9]/30 via-[#CADEFC]/20 to-[#C3BEF0]/30">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-gradient-to-br from-[#C3BEF0] to-[#CCA8E9] rounded-xl">
                  <Users2 className="w-6 h-6 text-gray-800" />
                </div>

                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#7C3AED] to-[#A855F7] bg-clip-text text-transparent">
                  Team Collaboration Hub
                </h1>
              </div>

              <p className="text-gray-500 ml-12">
                Manage teams, create chat groups, and review team requests
              </p>
            </div>

            <button
              onClick={() => setShowCreateGroup(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#C3BEF0] to-[#CCA8E9] text-gray-800 rounded-xl font-semibold hover:from-[#CADEFC] hover:to-[#C3BEF0] transition-all transform hover:scale-105 shadow-lg"
            >
              <MessageSquare className="w-4 h-4" />
              Create New Group
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-[#DEFCF9] to-[#CADEFC] rounded-2xl p-5 text-gray-800 transform hover:scale-105 transition-all duration-300 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/40 rounded-xl backdrop-blur-sm">
                <BookOpen className="w-5 h-5" />
              </div>

              <span className="text-xs opacity-80">Total projects</span>
            </div>

            <p className="text-3xl font-bold">{projects.length}</p>
            <p className="text-sm opacity-90 mt-1">Active Projects</p>
          </div>

          <div className="bg-gradient-to-br from-[#CADEFC] to-[#C3BEF0] rounded-2xl p-5 text-gray-800 transform hover:scale-105 transition-all duration-300 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/40 rounded-xl backdrop-blur-sm">
                <Users2 className="w-5 h-5" />
              </div>

              <span className="text-xs opacity-80">Across all projects</span>
            </div>

            <p className="text-3xl font-bold">{allStudents.length}</p>
            <p className="text-sm opacity-90 mt-1">Enrolled Students</p>
          </div>

          <div className="bg-gradient-to-br from-[#C3BEF0] to-[#CCA8E9] rounded-2xl p-5 text-gray-800 transform hover:scale-105 transition-all duration-300 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/40 rounded-xl backdrop-blur-sm">
                <MessageCircle className="w-5 h-5" />
              </div>

              <span className="text-xs opacity-80">
                {
                  chatGroups.filter(
                    (g) => g.unreadCount && g.unreadCount > 0
                  ).length
                }{' '}
                with activity
              </span>
            </div>

            <p className="text-3xl font-bold">{chatGroups.length}</p>
            <p className="text-sm opacity-90 mt-1">Active Groups</p>
          </div>

          <div className="bg-gradient-to-br from-[#CCA8E9] to-[#C3BEF0] rounded-2xl p-5 text-gray-800 transform hover:scale-105 transition-all duration-300 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/40 rounded-xl backdrop-blur-sm">
                <TrendingUp className="w-5 h-5" />
              </div>

              <span className="text-xs opacity-80">Completion rate</span>
            </div>

            <p className="text-3xl font-bold">
              {Math.round(
                (allStudents.length / (projects.length * 4)) * 100
              ) || 0}
              %
            </p>

            <p className="text-sm opacity-90 mt-1">Team Formation</p>
          </div>
        </div>

        {/* Leave Request Summary */}
        {leaveRequests.length > 0 && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/80 backdrop-blur-sm border border-amber-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <Clock className="w-5 h-5" />
                </div>

                <div>
                  <p className="text-xs text-gray-500">Pending Requests</p>
                  <p className="text-2xl font-bold text-amber-700">
                    {pendingLeaveRequests}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm border border-emerald-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <CheckCircle className="w-5 h-5" />
                </div>

                <div>
                  <p className="text-xs text-gray-500">Approved</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {approvedLeaveRequests}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm border border-red-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-100 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                </div>

                <div>
                  <p className="text-xs text-gray-500">Rejected</p>
                  <p className="text-2xl font-bold text-red-700">
                    {rejectedLeaveRequests}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-1 border border-[#CADEFC]/50 overflow-x-auto">
              <button
                onClick={() => setActiveTab('projects')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === 'projects'
                    ? 'bg-gradient-to-r from-[#C3BEF0] to-[#CCA8E9] text-gray-800 shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <LayoutGrid className="w-4 h-4 inline mr-2" />
                Projects & Teams
              </button>

              <button
                onClick={() => setActiveTab('groups')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === 'groups'
                    ? 'bg-gradient-to-r from-[#C3BEF0] to-[#CCA8E9] text-gray-800 shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <MessageCircle className="w-4 h-4 inline mr-2" />
                Chat Groups

                {chatGroups.filter(
                  (g) => g.unreadCount && g.unreadCount > 0
                ).length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {
                      chatGroups.filter(
                        (g) => g.unreadCount && g.unreadCount > 0
                      ).length
                    }
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('leaveRequests')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === 'leaveRequests'
                    ? 'bg-gradient-to-r from-[#C3BEF0] to-[#CCA8E9] text-gray-800 shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4 inline mr-2" />
                Leave Requests

                {pendingLeaveRequests > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                    {pendingLeaveRequests}
                  </span>
                )}
              </button>
            </div>

            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                <input
                  type="text"
                  placeholder={
                    activeTab === 'projects'
                      ? 'Search projects...'
                      : activeTab === 'groups'
                      ? 'Search groups...'
                      : 'Search leave requests...'
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 bg-white/80 backdrop-blur-sm border border-[#CADEFC]/50 rounded-xl text-sm outline-none focus:border-[#CCA8E9] focus:ring-2 focus:ring-[#C3BEF0]/50"
                />
              </div>

              {activeTab !== 'leaveRequests' && (
                <button
                  onClick={() =>
                    setViewMode(viewMode === 'cards' ? 'compact' : 'cards')
                  }
                  className="p-2 bg-white/80 backdrop-blur-sm border border-[#CADEFC]/50 rounded-xl hover:bg-white transition-colors"
                >
                  {viewMode === 'cards' ? (
                    <List className="w-4 h-4" />
                  ) : (
                    <LayoutGrid className="w-4 h-4" />
                  )}
                </button>
              )}

              {activeTab === 'leaveRequests' && (
                <button
                  onClick={loadLeaveRequests}
                  disabled={loadingLeaveRequests}
                  className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-[#CADEFC]/50 rounded-xl text-sm font-medium text-gray-700 hover:bg-white transition-colors disabled:opacity-50"
                >
                  {loadingLeaveRequests ? 'Refreshing...' : 'Refresh'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Projects Section */}
        {activeTab === 'projects' && (
          <>
            {filteredProjects.length === 0 ? (
              <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl border border-[#CADEFC]/50">
                <div className="w-20 h-20 bg-[#C3BEF0]/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users2 className="w-10 h-10 text-[#7C3AED]" />
                </div>

                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  No projects found
                </h3>

                <p className="text-gray-500">
                  {searchTerm
                    ? 'Try adjusting your search'
                    : 'No approved projects with teams available'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    students={getProjectStudents(project)}
                    isExpanded={selectedProject === project.id}
                    onToggle={() =>
                      setSelectedProject(
                        selectedProject === project.id ? null : project.id
                      )
                    }
                    onSelectStudent={toggleStudentSelection}
                    selectedStudents={selectedStudents}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Chat Groups Section */}
        {activeTab === 'groups' && (
          <>
            {filteredGroups.length === 0 ? (
              <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl border border-[#CADEFC]/50">
                <div className="w-20 h-20 bg-[#C3BEF0]/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-10 h-10 text-[#7C3AED]" />
                </div>

                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  No chat groups yet
                </h3>

                <p className="text-gray-500 mb-6">
                  Create your first group to start collaborating
                </p>

                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#C3BEF0] to-[#CCA8E9] text-gray-800 rounded-xl font-medium hover:from-[#CADEFC] hover:to-[#C3BEF0] transition-all"
                >
                  Create Group
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredGroups.filter((g) => g.isPinned).length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                      <Pin className="w-4 h-4" />
                      PINNED GROUPS
                    </h3>

                    <div className="space-y-3">
                      {filteredGroups
                        .filter((g) => g.isPinned)
                        .map((group) => (
                          <ChatGroupCard
                            key={group.id}
                            group={group}
                            onDelete={handleDeleteGroup}
                            onTogglePin={handleTogglePin}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {filteredGroups.filter((g) => !g.isPinned).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-3">
                      ALL GROUPS
                    </h3>

                    <div className="space-y-3">
                      {filteredGroups
                        .filter((g) => !g.isPinned)
                        .map((group) => (
                          <ChatGroupCard
                            key={group.id}
                            group={group}
                            onDelete={handleDeleteGroup}
                            onTogglePin={handleTogglePin}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Leave Requests Section */}
        {activeTab === 'leaveRequests' && (
          <LeaveRequestsSection
            requests={filteredLeaveRequests}
            loading={loadingLeaveRequests}
            onApprove={(request) => openReviewModal(request, 'APPROVED')}
            onReject={(request) => openReviewModal(request, 'REJECTED')}
          />
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <CreateGroupModal
          groupName={groupName}
          groupDescription={groupDescription}
          selectedStudents={selectedStudents}
          allStudents={allStudents}
          onNameChange={setGroupName}
          onDescriptionChange={setGroupDescription}
          onToggleStudent={toggleStudentSelection}
          onCreate={handleCreateGroup}
          onClose={() => {
            setShowCreateGroup(false);
            setGroupName('');
            setGroupDescription('');
            setSelectedStudents([]);
          }}
        />
      )}

      {/* Leave Request Review Modal */}
      {reviewModal && (
        <LeaveRequestReviewModal
          request={reviewModal.request}
          status={reviewModal.status}
          responseNote={responseNote}
          loading={reviewingRequestId === reviewModal.request.id}
          onResponseNoteChange={setResponseNote}
          onConfirm={handleReviewLeaveRequest}
          onClose={closeReviewModal}
        />
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Leave Requests Section                                                     */
/* -------------------------------------------------------------------------- */

const LeaveRequestsSection: React.FC<{
  requests: TeamLeaveRequest[];
  loading: boolean;
  onApprove: (request: TeamLeaveRequest) => void;
  onReject: (request: TeamLeaveRequest) => void;
}> = ({ requests, loading, onApprove, onReject }) => {
  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#CADEFC]/50 py-20 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl border border-[#CADEFC]/50">
        <div className="w-20 h-20 bg-[#C3BEF0]/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-10 h-10 text-[#7C3AED]" />
        </div>

        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          No leave requests found
        </h3>

        <p className="text-gray-500 max-w-md mx-auto">
          Student team leave requests assigned to you will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {requests.map((request) => (
        <LeaveRequestCard
          key={request.id}
          request={request}
          onApprove={() => onApprove(request)}
          onReject={() => onReject(request)}
        />
      ))}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Leave Request Card                                                         */
/* -------------------------------------------------------------------------- */

const LeaveRequestCard: React.FC<{
  request: TeamLeaveRequest;
  onApprove: () => void;
  onReject: () => void;
}> = ({ request, onApprove, onReject }) => {
  const studentName = `${request.student.firstName} ${request.student.lastName}`;

  const projectTitle = request.team.project?.title || 'Project not available';

  const projectCode = request.team.project?.projectCode;

  const submittedDate = request.createdAt
    ? new Date(request.createdAt).toLocaleString()
    : 'Unknown';

  const reviewedDate = request.reviewedAt
    ? new Date(request.reviewedAt).toLocaleString()
    : null;

  const isPending = request.status === 'PENDING';

  return (
    <div className="bg-white/85 backdrop-blur-sm rounded-2xl border border-[#CADEFC]/60 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div
        className={`h-1.5 ${
          request.status === 'PENDING'
            ? 'bg-gradient-to-r from-amber-400 to-orange-400'
            : request.status === 'APPROVED'
            ? 'bg-gradient-to-r from-emerald-400 to-green-500'
            : 'bg-gradient-to-r from-red-400 to-rose-500'
        }`}
      />

      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          {/* Student */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C3BEF0] to-[#CCA8E9] flex items-center justify-center text-gray-800 font-bold text-lg shadow-md shrink-0">
              {request.student.firstName?.[0] || ''}
              {request.student.lastName?.[0] || ''}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-gray-800">
                  {studentName}
                </h3>

                <LeaveStatusBadge status={request.status} />
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                {request.student.enrollmentNo && (
                  <span>{request.student.enrollmentNo}</span>
                )}

                {request.student.email && (
                  <span>{request.student.email}</span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                <CalendarDays className="w-4 h-4 text-[#7C3AED]" />
                Submitted: {submittedDate}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isPending && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onReject}
                className="px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-all font-medium flex items-center gap-2"
              >
                <UserX className="w-4 h-4" />
                Reject
              </button>

              <button
                onClick={onApprove}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 transition-all font-medium shadow-md flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                Approve
              </button>
            </div>
          )}
        </div>

        {/* Team + Project */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="rounded-xl bg-gradient-to-br from-[#DEFCF9]/60 to-[#CADEFC]/40 border border-[#CADEFC]/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users2 className="w-4 h-4 text-[#7C3AED]" />
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Team
              </span>
            </div>

            <p className="font-semibold text-gray-800">
              {request.team.name}
            </p>

            <p className="text-xs text-gray-500 mt-1">
              Team ID: {request.team.id}
            </p>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-[#C3BEF0]/30 to-[#CCA8E9]/30 border border-[#CCA8E9]/40 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-[#7C3AED]" />
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Selected Project
              </span>
            </div>

            <p className="font-semibold text-gray-800">
              {projectTitle}
            </p>

            {projectCode && (
              <p className="text-xs text-gray-500 mt-1">
                Project Code: {projectCode}
              </p>
            )}
          </div>
        </div>

        {/* Reason */}
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/70 p-5">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-amber-700" />
            <span className="text-sm font-semibold text-amber-800">
              Student's Reason
            </span>
          </div>

          <p className="text-sm text-gray-700 leading-6 whitespace-pre-wrap">
            {request.reason}
          </p>
        </div>

        {/* Review Information */}
        {request.status !== 'PENDING' && (
          <div
            className={`mt-5 rounded-xl p-4 border ${
              request.status === 'APPROVED'
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {request.status === 'APPROVED' ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}

              <div className="flex-1">
                <p
                  className={`font-semibold ${
                    request.status === 'APPROVED'
                      ? 'text-emerald-800'
                      : 'text-red-800'
                  }`}
                >
                  Request {request.status.toLowerCase()}
                </p>

                {reviewedDate && (
                  <p className="text-xs text-gray-500 mt-1">
                    Reviewed: {reviewedDate}
                  </p>
                )}

                {request.reviewedBy && (
                  <p className="text-xs text-gray-500 mt-1">
                    By: {request.reviewedBy.firstName}{' '}
                    {request.reviewedBy.lastName}
                  </p>
                )}

                {request.responseNote && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-gray-500 mb-1">
                      Supervisor response
                    </p>

                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {request.responseNote}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Leave Status Badge                                                         */
/* -------------------------------------------------------------------------- */

const LeaveStatusBadge: React.FC<{
  status: LeaveRequestStatus;
}> = ({ status }) => {
  if (status === 'APPROVED') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
        <CheckCircle className="w-3 h-3" />
        Approved
      </span>
    );
  }

  if (status === 'REJECTED') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
        <AlertCircle className="w-3 h-3" />
        Rejected
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
      <Clock className="w-3 h-3" />
      Pending
    </span>
  );
};

/* -------------------------------------------------------------------------- */
/* Leave Request Review Modal                                                 */
/* -------------------------------------------------------------------------- */

const LeaveRequestReviewModal: React.FC<{
  request: TeamLeaveRequest;
  status: 'APPROVED' | 'REJECTED';
  responseNote: string;
  loading: boolean;
  onResponseNoteChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}> = ({
  request,
  status,
  responseNote,
  loading,
  onResponseNoteChange,
  onConfirm,
  onClose,
}) => {
  const isApprove = status === 'APPROVED';

  const studentName = `${request.student.firstName} ${request.student.lastName}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`p-6 border-b ${
            isApprove
              ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-100'
              : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-100'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className={`p-3 rounded-xl ${
                  isApprove
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {isApprove ? (
                  <UserCheck className="w-6 h-6" />
                ) : (
                  <UserX className="w-6 h-6" />
                )}
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {isApprove
                    ? 'Approve Leave Request'
                    : 'Reject Leave Request'}
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Review the student's request before confirming.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-white/80 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                Student
              </p>

              <p className="font-semibold text-gray-800">{studentName}</p>

              {request.student.enrollmentNo && (
                <p className="text-xs text-gray-500 mt-1">
                  {request.student.enrollmentNo}
                </p>
              )}

              {request.student.email && (
                <p className="text-xs text-gray-500 mt-1 break-all">
                  {request.student.email}
                </p>
              )}
            </div>

            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                Team
              </p>

              <p className="font-semibold text-gray-800">
                {request.team.name}
              </p>

              <p className="text-xs text-gray-500 mt-1">
                {request.team.project?.title || 'Project unavailable'}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-amber-50 border border-amber-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-amber-700" />
              <p className="text-sm font-semibold text-amber-800">
                Student's Reason
              </p>
            </div>

            <p className="text-sm text-gray-700 leading-6 whitespace-pre-wrap">
              {request.reason}
            </p>
          </div>

          <div className="mt-5">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Response Note{' '}
              <span className="font-normal text-gray-400">
                (Optional)
              </span>
            </label>

            <textarea
              value={responseNote}
              onChange={(event) =>
                onResponseNoteChange(event.target.value)
              }
              rows={4}
              maxLength={1000}
              placeholder={
                isApprove
                  ? 'Add an optional note for the student...'
                  : 'Explain why the leave request is being rejected...'
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none outline-none text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#CCA8E9] focus:ring-2 focus:ring-[#C3BEF0]/40"
            />

            <div className="flex justify-end mt-1">
              <span className="text-xs text-gray-400">
                {responseNote.length}/1000
              </span>
            </div>
          </div>

          {isApprove && (
            <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-4">
              <div className="flex gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />

                <p className="text-sm text-emerald-800 leading-6">
                  Approving this request will mark the student as{' '}
                  <strong>LEFT</strong> from the team. The student will not
                  be removed immediately until you confirm this action.
                </p>
              </div>
            </div>
          )}

          {!isApprove && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />

                <p className="text-sm text-red-800 leading-6">
                  Rejecting the request will keep the student active in the
                  current team.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex gap-3 bg-gray-50/80">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-3 rounded-xl text-white font-semibold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60 ${
              isApprove
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700'
                : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700'
            }`}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {isApprove ? (
                  <UserCheck className="w-4 h-4" />
                ) : (
                  <UserX className="w-4 h-4" />
                )}

                {isApprove ? 'Approve Request' : 'Reject Request'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Project Card                                                               */
/* -------------------------------------------------------------------------- */

const ProjectCard: React.FC<{
  project: ProjectWithDetails;
  students: any[];
  isExpanded: boolean;
  onToggle: () => void;
  onSelectStudent: (student: any) => void;
  selectedStudents: any[];
  viewMode: 'cards' | 'compact';
}> = ({
  project,
  students,
  isExpanded,
  onToggle,
  onSelectStudent,
  selectedStudents,
  viewMode,
}) => {
  const isSelected = (studentId: string) =>
    selectedStudents.some((s) => s.id === studentId);

  const progress =
    students.length > 0
      ? (students.length / (project.maxTeamSize || 4)) * 100
      : 0;

  if (viewMode === 'compact') {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-[#CADEFC]/50 p-4 hover:shadow-lg transition-all">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#C3BEF0] to-[#CCA8E9] rounded-lg flex items-center justify-center text-gray-800 font-bold">
                {project.title.charAt(0)}
              </div>

              <div>
                <h3 className="font-semibold text-gray-800">
                  {project.title} • ({project.projectCode})
                </h3>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{project.domain || 'No domain'}</span>
                  <span>•</span>
                  <span>
                    {students.length}/{project.maxTeamSize || 4} members
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-[#CADEFC]/50">
            <div className="flex flex-wrap gap-2">
              {students.map((student) => (
                <button
                  key={student.id}
                  onClick={() => onSelectStudent(student)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                    isSelected(student.id)
                      ? 'bg-gradient-to-r from-[#C3BEF0] to-[#CCA8E9] text-gray-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-[#C3BEF0]/50'
                  }`}
                >
                  <span className="text-sm">
                    {student.firstName} {student.lastName}
                  </span>

                  {student.role === 'LEADER' && (
                    <Crown className="w-3 h-3 text-amber-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-[#CADEFC]/50 overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="relative cursor-pointer" onClick={onToggle}>
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#C3BEF0] to-[#CCA8E9] rounded-xl flex items-center justify-center text-gray-800 font-bold shadow-md">
                  {project.title.charAt(0)}
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">
                    {project.title} • ({project.projectCode})
                  </h3>

                  <p className="text-xs text-gray-500">
                    {project.pool?.academicYear} • {project.pool?.semester}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 text-xs bg-[#C3BEF0]/50 text-gray-700 px-2 py-1 rounded-full">
                  <Target className="w-3 h-3" />
                  {project.domain || 'No domain'}
                </span>

                <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                  <Users2 className="w-3 h-3" />
                  {students.length}/{project.maxTeamSize || 4} Members
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {students.slice(0, 3).map((student) => (
                  <div
                    key={student.id}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C3BEF0] to-[#CCA8E9] border-2 border-white flex items-center justify-center text-gray-800 text-xs font-bold shadow-md"
                    title={`${student.firstName} ${student.lastName}`}
                  >
                    {student.firstName[0]}
                    {student.lastName[0]}
                  </div>
                ))}

                {students.length > 3 && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                    +{students.length - 3}
                  </div>
                )}
              </div>

              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </div>
          </div>

          {students.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Team Formation</span>
                <span>{Math.round(progress)}%</span>
              </div>

              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#C3BEF0] to-[#CCA8E9] rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(progress, 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-[#CADEFC]/50 p-5 bg-gradient-to-br from-[#DEFCF9]/20 to-[#CADEFC]/20">
          <p className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <Users2 className="w-4 h-4" />
            Team Members ({students.length})
          </p>

          <div className="grid grid-cols-1 gap-3">
            {students.map((student) => (
              <button
                key={student.id}
                onClick={() => onSelectStudent(student)}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all transform hover:scale-[1.02] text-left ${
                  isSelected(student.id)
                    ? 'bg-gradient-to-r from-[#C3BEF0]/50 to-[#CCA8E9]/50 border-2 border-[#CCA8E9] shadow-md'
                    : 'bg-white border border-[#CADEFC]/50 hover:border-[#CCA8E9] hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-md ${
                      student.role === 'LEADER'
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                        : 'bg-gradient-to-br from-[#C3BEF0] to-[#CCA8E9] text-gray-800'
                    }`}
                  >
                    {student.firstName[0]}
                    {student.lastName[0]}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800">
                        {student.firstName} {student.lastName}
                      </p>

                      {student.role === 'LEADER' && (
                        <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                          <Crown className="w-3 h-3" />
                          Leader
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 mt-0.5">
                      {student.enrollmentNo}
                    </p>

                    <p className="text-xs text-gray-400">
                      {student.email}
                    </p>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected(student.id)
                      ? 'bg-[#7C3AED] border-[#7C3AED] shadow-md'
                      : 'border-gray-300 hover:border-[#7C3AED]'
                  }`}
                >
                  {isSelected(student.id) && (
                    <CheckCircle className="w-4 h-4 text-white" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {students.length > 0 && (
            <button
              onClick={() =>
                students.forEach((student) => onSelectStudent(student))
              }
              className="w-full mt-4 py-2.5 text-sm font-medium text-gray-700 bg-gradient-to-r from-[#C3BEF0]/50 to-[#CCA8E9]/50 hover:from-[#C3BEF0] hover:to-[#CCA8E9] rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Select All Members ({students.length})
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Chat Group Card                                                            */
/* -------------------------------------------------------------------------- */

const ChatGroupCard: React.FC<{
  group: ChatGroup;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
}> = ({ group, onDelete, onTogglePin }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="group bg-white/80 backdrop-blur-sm rounded-xl border border-[#CADEFC]/50 hover:border-[#CCA8E9] hover:shadow-lg transition-all cursor-pointer">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-[#C3BEF0] to-[#CCA8E9] rounded-xl flex items-center justify-center text-gray-800 font-bold text-lg shadow-md">
                {group.name.charAt(0)}
              </div>

              {group.unreadCount && group.unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {group.unreadCount}
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-800">
                  {group.name}
                </h3>

                {group.isPinned && (
                  <Pin className="w-3 h-3 text-gray-400" />
                )}
              </div>

              <p className="text-xs text-gray-500 line-clamp-1">
                {group.description || 'No description'}
              </p>

              <div className="flex items-center gap-2 mt-1">
                <div className="flex -space-x-1">
                  {group.members.slice(0, 3).map((member) => (
                    <div
                      key={member.id}
                      className="w-5 h-5 rounded-full bg-gradient-to-br from-[#C3BEF0] to-[#CCA8E9] border border-white flex items-center justify-center text-gray-800 text-[10px] font-bold"
                      title={`${member.firstName} ${member.lastName}`}
                    >
                      {member.firstName[0]}
                    </div>
                  ))}

                  {group.members.length > 3 && (
                    <div className="w-5 h-5 rounded-full bg-gray-200 border border-white flex items-center justify-center text-[10px] font-medium">
                      +{group.members.length - 3}
                    </div>
                  )}
                </div>

                <span className="text-xs text-gray-400">
                  {group.members.length} members
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-[#C3BEF0]/30 rounded-lg transition-colors">
              <MessageCircle className="w-4 h-4 text-[#7C3AED]" />
            </button>

            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />

                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-[#CADEFC]/50 py-1 z-20">
                    <button
                      onClick={() => {
                        onTogglePin(group.id);
                        setMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Pin className="w-3 h-3" />
                      {group.isPinned ? 'Unpin Group' : 'Pin Group'}
                    </button>

                    <button
                      onClick={() => {
                        onDelete(group.id);
                        setMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete Group
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Create Group Modal                                                         */
/* -------------------------------------------------------------------------- */

const CreateGroupModal: React.FC<{
  groupName: string;
  groupDescription: string;
  selectedStudents: Student[];
  allStudents: Student[];
  onNameChange: (name: string) => void;
  onDescriptionChange: (desc: string) => void;
  onToggleStudent: (student: Student) => void;
  onCreate: () => void;
  onClose: () => void;
}> = ({
  groupName,
  groupDescription,
  selectedStudents,
  allStudents,
  onNameChange,
  onDescriptionChange,
  onToggleStudent,
  onCreate,
  onClose,
}) => {
  const [searchStudent, setSearchStudent] = useState('');

  const filteredStudents = allStudents.filter(
    (student) =>
      `${student.firstName} ${student.lastName}`
        .toLowerCase()
        .includes(searchStudent.toLowerCase()) ||
      (student.enrollmentNo || '')
        .toLowerCase()
        .includes(searchStudent.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#CADEFC]/50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-[#C3BEF0] to-[#CCA8E9] rounded-xl">
                <MessageSquare className="w-5 h-5 text-gray-800" />
              </div>

              <div>
                <h3 className="font-bold text-gray-800 text-xl">
                  Create Chat Group
                </h3>

                <p className="text-sm text-gray-500">
                  Create a group chat for team collaboration
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          className="overflow-y-auto p-6"
          style={{ maxHeight: 'calc(90vh - 180px)' }}
        >
          {/* Group Details */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Group Name <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              value={groupName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="e.g., AI Research Team, Web Dev Squad"
              className="w-full px-4 py-2.5 border border-[#CADEFC]/50 rounded-xl text-sm outline-none focus:border-[#CCA8E9] focus:ring-2 focus:ring-[#C3BEF0]/50"
            />
          </div>

          <div className="mb-6">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Description (Optional)
            </label>

            <textarea
              value={groupDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={3}
              placeholder="What's this group about?"
              className="w-full px-4 py-2.5 border border-[#CADEFC]/50 rounded-xl text-sm outline-none focus:border-[#CCA8E9] focus:ring-2 focus:ring-[#C3BEF0]/50 resize-none"
            />
          </div>

          {/* Selected Students */}
          {selectedStudents.length > 0 && (
            <div className="mb-6">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Selected Members ({selectedStudents.length})
              </label>

              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-[#C3BEF0]/20 rounded-xl">
                {selectedStudents.map((student) => (
                  <span
                    key={student.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#C3BEF0] to-[#CCA8E9] text-gray-800 rounded-lg text-sm"
                  >
                    {student.firstName} {student.lastName}

                    <button
                      onClick={() => onToggleStudent(student)}
                      className="hover:text-red-500 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Student Search */}
          <div className="mb-4">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Add Students
            </label>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

              <input
                type="text"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                placeholder="Search by name or enrollment number..."
                className="w-full pl-10 pr-4 py-2.5 border border-[#CADEFC]/50 rounded-xl text-sm outline-none focus:border-[#CCA8E9] focus:ring-2 focus:ring-[#C3BEF0]/50"
              />
            </div>
          </div>

          {/* Student List */}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No students found
              </div>
            ) : (
              filteredStudents.map((student) => {
                const isSelected = selectedStudents.some(
                  (s) => s.id === student.id
                );

                return (
                  <button
                    key={student.id}
                    onClick={() => onToggleStudent(student)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all text-left ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#C3BEF0]/50 to-[#CCA8E9]/50 border-2 border-[#CCA8E9] shadow-md'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#C3BEF0] to-[#CCA8E9] rounded-xl flex items-center justify-center text-gray-800 font-bold">
                        {student.firstName[0]}
                        {student.lastName[0]}
                      </div>

                      <div>
                        <p className="font-medium text-gray-800">
                          {student.firstName} {student.lastName}
                        </p>

                        <p className="text-xs text-gray-500">
                          {student.enrollmentNo}
                        </p>

                        <p className="text-xs text-gray-400">
                          {student.department}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-[#7C3AED] border-[#7C3AED]'
                          : 'border-gray-300'
                      }`}
                    >
                      {isSelected && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-[#CADEFC]/50 p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-[#CADEFC]/50 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={onCreate}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#C3BEF0] to-[#CCA8E9] text-gray-800 rounded-xl font-medium hover:from-[#CADEFC] hover:to-[#C3BEF0] transition-colors flex items-center justify-center gap-2 shadow-md"
          >
            <Send className="w-4 h-4" />
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamManagement;