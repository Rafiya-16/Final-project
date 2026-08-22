import React, { useState, useEffect } from 'react';
import { projectService } from '@/services/projectService';
import { poolService } from '@/services/poolService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  Users2,
  MessageSquare,
  Search,
  X,
  CheckCircle,
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Project, TeamMember, Pool } from '@/types';

interface ProjectWithDetails extends Project {
  pool?: Pool;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  enrollmentNo: string;
  department: string;
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
  const [activeTab, setActiveTab] = useState<'projects' | 'groups'>(
    'projects'
  );

  useEffect(() => {
    fetchProjectsAndStudents();
    loadExistingGroups();
  }, []);

  /**
   * Fetch approved projects and their team members.
   */
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
            (project: Project) => project.status === 'APPROVED'
          );

          approvedProjects.forEach((project: Project) => {
            allProjects.push({
              ...project,
              pool,
            });

            /**
             * IMPORTANT:
             * TeamMember.student does not contain `department`
             * according to the type definition in @/types.
             *
             * Therefore we intentionally use 'CSE' as the fallback
             * instead of accessing member.student.department.
             */
            if (project.team?.members) {
              project.team.members.forEach((member: TeamMember) => {
                if (!studentIds.has(member.student.id)) {
                  studentIds.add(member.student.id);

                  studentsList.push({
                    id: member.student.id,
                    firstName: member.student.firstName,
                    lastName: member.student.lastName,
                    email: member.student.email || '',
                    enrollmentNo:
                      member.student.enrollmentNo || 'N/A',
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

  /**
   * Load groups saved in browser localStorage.
   */
  const loadExistingGroups = () => {
    const storedGroups = localStorage.getItem('chatGroups');

    if (!storedGroups) {
      return;
    }

    try {
      const groups = JSON.parse(storedGroups);

      setChatGroups(
        groups.map((group: any) => ({
          ...group,
          createdAt: new Date(group.createdAt),
        }))
      );
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  /**
   * Save groups to localStorage.
   */
  const saveGroups = (groups: ChatGroup[]) => {
    localStorage.setItem('chatGroups', JSON.stringify(groups));
  };

  /**
   * Create a new chat group.
   */
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
      `Group "${groupName}" created with ${selectedStudents.length} members!`
    );

    setShowCreateGroup(false);
    setGroupName('');
    setGroupDescription('');
    setSelectedStudents([]);
  };

  /**
   * Select/unselect a student.
   */
  const toggleStudentSelection = (student: Student) => {
    setSelectedStudents((previous) => {
      const exists = previous.some(
        (selected) => selected.id === student.id
      );

      if (exists) {
        return previous.filter(
          (selected) => selected.id !== student.id
        );
      }

      return [...previous, student];
    });
  };

  /**
   * Convert project team members into the Student shape
   * required by this page.
   *
   * NOTE:
   * TeamMember.student does not expose department in @/types,
   * so department is intentionally set to CSE.
   */
  const getProjectStudents = (
    project: ProjectWithDetails
  ): Student[] => {
    if (!project.team?.members) {
      return [];
    }

    return project.team.members.map((member: TeamMember) => ({
      id: member.student.id,
      firstName: member.student.firstName,
      lastName: member.student.lastName,
      email: member.student.email || '',
      enrollmentNo: member.student.enrollmentNo || 'N/A',
      department: 'CSE',
      role: member.role,
    }));
  };

  /**
   * Delete a chat group.
   */
  const handleDeleteGroup = (groupId: string) => {
    const updatedGroups = chatGroups.filter(
      (group) => group.id !== groupId
    );

    setChatGroups(updatedGroups);
    saveGroups(updatedGroups);

    toast.success('Group deleted successfully');
  };

  /**
   * Pin/unpin a chat group.
   */
  const handleTogglePin = (groupId: string) => {
    const updatedGroups = chatGroups.map((group) =>
      group.id === groupId
        ? {
            ...group,
            isPinned: !group.isPinned,
          }
        : group
    );

    setChatGroups(updatedGroups);
    saveGroups(updatedGroups);

    toast.success('Group updated');
  };

  /**
   * Filter projects.
   */
  const filteredProjects = projects.filter((project) => {
    const title = project.title?.toLowerCase() || '';
    const domain = project.domain?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();

    return (
      title.includes(search) ||
      domain.includes(search)
    );
  });

  /**
   * Filter chat groups.
   */
  const filteredGroups = chatGroups.filter((group) => {
    const name = group.name.toLowerCase();
    const description = group.description.toLowerCase();
    const search = searchTerm.toLowerCase();

    return (
      name.includes(search) ||
      description.includes(search)
    );
  });

  const activeGroupsCount = chatGroups.filter(
    (group) =>
      group.unreadCount !== undefined &&
      group.unreadCount > 0
  ).length;

  const teamFormationRate =
    projects.length > 0
      ? Math.round(
          (allStudents.length / (projects.length * 4)) * 100
        )
      : 0;

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
                Manage teams, create chat groups, and foster collaboration
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

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          {/* Projects */}
          <div className="bg-gradient-to-br from-[#DEFCF9] to-[#CADEFC] rounded-2xl p-5 text-gray-800 transform hover:scale-105 transition-all duration-300 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/40 rounded-xl">
                <Target className="w-5 h-5" />
              </div>

              <span className="text-xs opacity-80">
                Total projects
              </span>
            </div>

            <p className="text-3xl font-bold">
              {projects.length}
            </p>

            <p className="text-sm opacity-90 mt-1">
              Active Projects
            </p>
          </div>

          {/* Students */}
          <div className="bg-gradient-to-br from-[#CADEFC] to-[#C3BEF0] rounded-2xl p-5 text-gray-800 transform hover:scale-105 transition-all duration-300 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/40 rounded-xl">
                <Users2 className="w-5 h-5" />
              </div>

              <span className="text-xs opacity-80">
                Across all projects
              </span>
            </div>

            <p className="text-3xl font-bold">
              {allStudents.length}
            </p>

            <p className="text-sm opacity-90 mt-1">
              Enrolled Students
            </p>
          </div>

          {/* Groups */}
          <div className="bg-gradient-to-br from-[#C3BEF0] to-[#CCA8E9] rounded-2xl p-5 text-gray-800 transform hover:scale-105 transition-all duration-300 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/40 rounded-xl">
                <MessageCircle className="w-5 h-5" />
              </div>

              <span className="text-xs opacity-80">
                {activeGroupsCount} with activity
              </span>
            </div>

            <p className="text-3xl font-bold">
              {chatGroups.length}
            </p>

            <p className="text-sm opacity-90 mt-1">
              Active Groups
            </p>
          </div>

          {/* Team Formation */}
          <div className="bg-gradient-to-br from-[#CCA8E9] to-[#C3BEF0] rounded-2xl p-5 text-gray-800 transform hover:scale-105 transition-all duration-300 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/40 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>

              <span className="text-xs opacity-80">
                Completion rate
              </span>
            </div>

            <p className="text-3xl font-bold">
              {teamFormationRate}%
            </p>

            <p className="text-sm opacity-90 mt-1">
              Team Formation
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">

            <div className="flex gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-1 border border-[#CADEFC]/50">

              <button
                onClick={() => setActiveTab('projects')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
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
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'groups'
                    ? 'bg-gradient-to-r from-[#C3BEF0] to-[#CCA8E9] text-gray-800 shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <MessageCircle className="w-4 h-4 inline mr-2" />
                Chat Groups

                {activeGroupsCount > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {activeGroupsCount}
                  </span>
                )}
              </button>
            </div>

            <div className="flex gap-2">

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                <input
                  type="text"
                  placeholder={
                    activeTab === 'projects'
                      ? 'Search projects...'
                      : 'Search groups...'
                  }
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                  className="w-64 pl-10 pr-4 py-2 bg-white/80 backdrop-blur-sm border border-[#CADEFC]/50 rounded-xl text-sm outline-none focus:border-[#CCA8E9] focus:ring-2 focus:ring-[#C3BEF0]/50"
                />
              </div>

              {/* View mode */}
              <button
                onClick={() =>
                  setViewMode(
                    viewMode === 'cards'
                      ? 'compact'
                      : 'cards'
                  )
                }
                className="p-2 bg-white/80 backdrop-blur-sm border border-[#CADEFC]/50 rounded-xl hover:bg-white transition-colors"
              >
                {viewMode === 'cards' ? (
                  <List className="w-4 h-4" />
                ) : (
                  <LayoutGrid className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Projects */}
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
                    isExpanded={
                      selectedProject === project.id
                    }
                    onToggle={() =>
                      setSelectedProject(
                        selectedProject === project.id
                          ? null
                          : project.id
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

        {/* Chat Groups */}
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

                {/* Pinned */}
                {filteredGroups.filter(
                  (group) => group.isPinned
                ).length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                      <Pin className="w-4 h-4" />
                      PINNED GROUPS
                    </h3>

                    <div className="space-y-3">
                      {filteredGroups
                        .filter((group) => group.isPinned)
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

                {/* Other groups */}
                {filteredGroups.filter(
                  (group) => !group.isPinned
                ).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-3">
                      ALL GROUPS
                    </h3>

                    <div className="space-y-3">
                      {filteredGroups
                        .filter((group) => !group.isPinned)
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
    </div>
  );
};

/* ============================================================
   PROJECT CARD
============================================================ */

const ProjectCard: React.FC<{
  project: ProjectWithDetails;
  students: Student[];
  isExpanded: boolean;
  onToggle: () => void;
  onSelectStudent: (student: Student) => void;
  selectedStudents: Student[];
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
    selectedStudents.some(
      (student) => student.id === studentId
    );

  const maxTeamSize = project.maxTeamSize || 4;

  const progress =
    students.length > 0
      ? Math.min(
          (students.length / maxTeamSize) * 100,
          100
        )
      : 0;

  /* Compact view */
  if (viewMode === 'compact') {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-[#CADEFC]/50 p-4 hover:shadow-lg transition-all">

        <div className="flex items-center justify-between">

          <div className="flex-1">
            <div className="flex items-center gap-3">

              <div className="w-10 h-10 bg-gradient-to-br from-[#C3BEF0] to-[#CCA8E9] rounded-lg flex items-center justify-center text-gray-800 font-bold">
                {project.title?.charAt(0) || 'P'}
              </div>

              <div>
                <h3 className="font-semibold text-gray-800">
                  {project.title}
                </h3>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>
                    {project.domain || 'No domain'}
                  </span>

                  <span>•</span>

                  <span>
                    {students.length}/{maxTeamSize} members
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
                  onClick={() =>
                    onSelectStudent(student)
                  }
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

  /* Cards view */
  return (
    <div className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-[#CADEFC]/50 overflow-hidden hover:shadow-xl transition-all duration-300">

      <div
        className="relative cursor-pointer"
        onClick={onToggle}
      >
        <div className="p-5">

          <div className="flex items-start justify-between">

            <div className="flex-1">

              <div className="flex items-center gap-2 mb-3">

                <div className="w-10 h-10 bg-gradient-to-br from-[#C3BEF0] to-[#CCA8E9] rounded-xl flex items-center justify-center text-gray-800 font-bold shadow-md">
                  {project.title?.charAt(0) || 'P'}
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">
                    {project.title}
                  </h3>

                  <p className="text-xs text-gray-500">
                    {project.pool?.academicYear} •{' '}
                    {project.pool?.semester}
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
                  {students.length}/{maxTeamSize} Members
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
                    {student.firstName?.[0]}
                    {student.lastName?.[0]}
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
                <span>
                  {Math.round(progress)}%
                </span>
              </div>

              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#C3BEF0] to-[#CCA8E9] rounded-full transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expanded members */}
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
                onClick={() =>
                  onSelectStudent(student)
                }
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
                    {student.firstName?.[0]}
                    {student.lastName?.[0]}
                  </div>

                  <div>

                    <div className="flex items-center gap-2">

                      <p className="font-semibold text-gray-800">
                        {student.firstName}{' '}
                        {student.lastName}
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
              onClick={() => {
                students.forEach((student) => {
                  if (!isSelected(student.id)) {
                    onSelectStudent(student);
                  }
                });
              }}
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

/* ============================================================
   CHAT GROUP CARD
============================================================ */

const ChatGroupCard: React.FC<{
  group: ChatGroup;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
}> = ({
  group,
  onDelete,
  onTogglePin,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="group bg-white/80 backdrop-blur-sm rounded-xl border border-[#CADEFC]/50 hover:border-[#CCA8E9] hover:shadow-lg transition-all">

      <div className="p-4">

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-3 flex-1">

            <div className="relative">

              <div className="w-12 h-12 bg-gradient-to-br from-[#C3BEF0] to-[#CCA8E9] rounded-xl flex items-center justify-center text-gray-800 font-bold text-lg shadow-md">
                {group.name.charAt(0)}
              </div>

              {group.unreadCount &&
                group.unreadCount > 0 && (
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

                  {group.members
                    .slice(0, 3)
                    .map((member) => (
                      <div
                        key={member.id}
                        className="w-5 h-5 rounded-full bg-gradient-to-br from-[#C3BEF0] to-[#CCA8E9] border border-white flex items-center justify-center text-gray-800 text-[10px] font-bold"
                        title={`${member.firstName} ${member.lastName}`}
                      >
                        {member.firstName?.[0]}
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

            <button
              className="p-2 hover:bg-[#C3BEF0]/30 rounded-lg transition-colors"
              title="Open chat"
            >
              <MessageCircle className="w-4 h-4 text-[#7C3AED]" />
            </button>

            <div className="relative">

              <button
                onClick={() =>
                  setMenuOpen((previous) => !previous)
                }
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
                      {group.isPinned
                        ? 'Unpin Group'
                        : 'Pin Group'}
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

/* ============================================================
   CREATE GROUP MODAL
============================================================ */

const CreateGroupModal: React.FC<{
  groupName: string;
  groupDescription: string;
  selectedStudents: Student[];
  allStudents: Student[];
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
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
  const [searchStudent, setSearchStudent] =
    useState('');

  const filteredStudents = allStudents.filter(
    (student) => {
      const search =
        searchStudent.toLowerCase();

      return (
        `${student.firstName} ${student.lastName}`
          .toLowerCase()
          .includes(search) ||
        student.enrollmentNo
          .toLowerCase()
          .includes(search)
      );
    }
  );

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(event) =>
          event.stopPropagation()
        }
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
          style={{
            maxHeight:
              'calc(90vh - 180px)',
          }}
        >

          {/* Group Name */}
          <div className="mb-6">

            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Group Name{' '}
              <span className="text-red-500">
                *
              </span>
            </label>

            <input
              type="text"
              value={groupName}
              onChange={(event) =>
                onNameChange(event.target.value)
              }
              placeholder="e.g., AI Research Team, Web Dev Squad"
              className="w-full px-4 py-2.5 border border-[#CADEFC]/50 rounded-xl text-sm outline-none focus:border-[#CCA8E9] focus:ring-2 focus:ring-[#C3BEF0]/50"
            />
          </div>

          {/* Description */}
          <div className="mb-6">

            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Description (Optional)
            </label>

            <textarea
              value={groupDescription}
              onChange={(event) =>
                onDescriptionChange(
                  event.target.value
                )
              }
              rows={3}
              placeholder="What's this group about?"
              className="w-full px-4 py-2.5 border border-[#CADEFC]/50 rounded-xl text-sm outline-none focus:border-[#CCA8E9] focus:ring-2 focus:ring-[#C3BEF0]/50 resize-none"
            />
          </div>

          {/* Selected Members */}
          {selectedStudents.length > 0 && (
            <div className="mb-6">

              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Selected Members (
                {selectedStudents.length})
              </label>

              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-[#C3BEF0]/20 rounded-xl">

                {selectedStudents.map(
                  (student) => (
                    <span
                      key={student.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#C3BEF0] to-[#CCA8E9] text-gray-800 rounded-lg text-sm"
                    >
                      {student.firstName}{' '}
                      {student.lastName}

                      <button
                        onClick={() =>
                          onToggleStudent(student)
                        }
                        className="hover:text-red-500 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )
                )}
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
                onChange={(event) =>
                  setSearchStudent(
                    event.target.value
                  )
                }
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
              filteredStudents.map(
                (student) => {
                  const isSelected =
                    selectedStudents.some(
                      (selected) =>
                        selected.id === student.id
                    );

                  return (
                    <button
                      key={student.id}
                      onClick={() =>
                        onToggleStudent(student)
                      }
                      className={`w-full flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all text-left ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#C3BEF0]/50 to-[#CCA8E9]/50 border-2 border-[#CCA8E9] shadow-md'
                          : 'hover:bg-gray-50 border-2 border-transparent'
                      }`}
                    >

                      <div className="flex items-center gap-3">

                        <div className="w-10 h-10 bg-gradient-to-br from-[#C3BEF0] to-[#CCA8E9] rounded-xl flex items-center justify-center text-gray-800 font-bold">
                          {student.firstName?.[0]}
                          {student.lastName?.[0]}
                        </div>

                        <div>

                          <p className="font-medium text-gray-800">
                            {student.firstName}{' '}
                            {student.lastName}
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
                }
              )
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