
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Archive,
  CheckCircle2,
  FastForward,
  FolderKanban,
  Pencil,
  Play,
  Plus,
  Save,
  ShieldCheck,
  Snowflake,
  UserMinus,
  UserPlus,
  UserRound,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { poolService } from '@/services/poolService';
import { projectService } from '@/services/projectService';
import { userService } from '@/services/userService';
import { Badge } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { Pool, Project, PoolStats, User } from '@/types';
import { getErrorMessage } from '@/types';
import { useAuthStore } from '@/stores/authStore';

type PoolTab = 'overview' | 'projects' | 'held';

type EditForm = {
  name: string;
  academicYear: string;
  semester: string;
  department: string;
  submissionStart: string;
  submissionEnd: string;
  reviewStart: string;
  reviewEnd: string;
  decisionDeadline: string;
  selectionStart: string;
  selectionEnd: string;
  ideaSubmissionStart: string;
  ideaSubmissionEnd: string;
  teamFreezeDate: string;
};

type Confirmation = {
  action: string;
  title: string;
  msg: string;
};

const initialEditForm: EditForm = {
  name: '',
  academicYear: '',
  semester: 'odd',
  department: '',
  submissionStart: '',
  submissionEnd: '',
  reviewStart: '',
  reviewEnd: '',
  decisionDeadline: '',
  selectionStart: '',
  selectionEnd: '',
  ideaSubmissionStart: '',
  ideaSubmissionEnd: '',
  teamFreezeDate: '',
};

const PoolDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'ADMIN';

  const [pool, setPool] = useState<Pool | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<PoolStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [confirm, setConfirm] = useState<Confirmation | null>(null);
  const [tab, setTab] = useState<PoolTab>('overview');
  const [editing, setEditing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Assignment management
  const [showAddFaculty, setShowAddFaculty] = useState(false);
  const [showAddSubadmin, setShowAddSubadmin] = useState(false);

  const [facultyCandidates, setFacultyCandidates] = useState<User[]>([]);
  const [subadminCandidates, setSubadminCandidates] = useState<User[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [selectedSubadminId, setSelectedSubadminId] = useState('');

  const [editForm, setEditForm] = useState<EditForm>(initialEditForm);

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [poolData, projectData, statsData] = await Promise.all([
        poolService.getById(id),
        projectService.listByPool(id),
        poolService.getStats(id),
      ]);

      setPool(poolData);
      setProjects(projectData);
      setStats(statsData);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Failed to load pool');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const toDateTimeLocal = (value?: string | null): string => {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60_000)
      .toISOString()
      .slice(0, 16);
  };

  const formatDate = (value?: string | null): string => {
    if (!value) return 'Not scheduled';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not scheduled';

    return date.toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Assignment candidates
  const loadAssignmentCandidates = async () => {
    setLoadingCandidates(true);

    try {
      const [facultyResponse, subadminResponse] = await Promise.all([
        userService.list({
          role: 'FACULTY',
          limit: '500',
          isActive: 'true',
        }),
        userService.list({
          role: 'SUBADMIN',
          limit: '500',
          isActive: 'true',
        }),
      ]);

      const facultyUsers: User[] = facultyResponse?.data || [];
      const globalSubadmins: User[] = subadminResponse?.data || [];

      // A faculty member may also be assigned pool-level SubAdmin capability.
      const uniqueSubadmins = new Map<string, User>();

      [...globalSubadmins, ...facultyUsers].forEach((candidate) => {
        if (candidate.isActive) {
          uniqueSubadmins.set(candidate.id, candidate);
        }
      });

      setFacultyCandidates(
        facultyUsers.filter((candidate) => candidate.isActive)
      );
      setSubadminCandidates(Array.from(uniqueSubadmins.values()));
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error) || 'Failed to load assignment candidates'
      );
    } finally {
      setLoadingCandidates(false);
    }
  };

  const openAddFaculty = async () => {
    setSelectedFacultyId('');
    setShowAddFaculty(true);

    if (facultyCandidates.length === 0) {
      await loadAssignmentCandidates();
    }
  };

  const openAddSubadmin = async () => {
    setSelectedSubadminId('');
    setShowAddSubadmin(true);

    if (subadminCandidates.length === 0) {
      await loadAssignmentCandidates();
    }
  };

  const addFaculty = async () => {
    if (!id || !selectedFacultyId) {
      toast.error('Please select a faculty member.');
      return;
    }

    setAssignmentLoading(true);

    try {
      await poolService.assignUsers(id, {
        facultyIds: [selectedFacultyId],
      });

      toast.success('Faculty assigned to pool.');
      setShowAddFaculty(false);
      setSelectedFacultyId('');
      await load();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Failed to assign faculty');
    } finally {
      setAssignmentLoading(false);
    }
  };

  const addSubadmin = async () => {
    if (!id || !selectedSubadminId) {
      toast.error('Please select a SubAdmin.');
      return;
    }

    setAssignmentLoading(true);

    try {
      await poolService.assignUsers(id, {
        subadminIds: [selectedSubadminId],
      });

      toast.success('SubAdmin capability assigned to pool.');
      setShowAddSubadmin(false);
      setSelectedSubadminId('');
      await load();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Failed to assign SubAdmin');
    } finally {
      setAssignmentLoading(false);
    }
  };

  const removeFaculty = (facultyId: string) => {
    setConfirm({
      action: `removeFaculty:${facultyId}`,
      title: 'Remove Faculty from Pool?',
      msg:
        'This removes the Faculty assignment only. Any SubAdmin capability for this pool will remain.',
    });
  };

  const removeSubadmin = (subadminId: string) => {
    setConfirm({
      action: `removeSubadmin:${subadminId}`,
      title: 'Remove SubAdmin from Pool?',
      msg:
        'This removes the pool-level SubAdmin capability only. Any Faculty assignment will remain.',
    });
  };

  // Edit draft pool
  const startEditing = () => {
    if (!pool) return;

    if (pool.status !== 'DRAFT') {
      toast.error('Only draft pools can be edited.');
      return;
    }

    setEditForm({
      name: pool.name || '',
      academicYear: pool.academicYear || '',
      semester: pool.semester || 'odd',
      department: pool.department || '',
      submissionStart: toDateTimeLocal(pool.submissionStart),
      submissionEnd: toDateTimeLocal(pool.submissionEnd),
      reviewStart: toDateTimeLocal(pool.reviewStart),
      reviewEnd: toDateTimeLocal(pool.reviewEnd),
      decisionDeadline: toDateTimeLocal(pool.decisionDeadline),
      selectionStart: toDateTimeLocal(pool.selectionStart),
      selectionEnd: toDateTimeLocal(pool.selectionEnd),
      ideaSubmissionStart: toDateTimeLocal(pool.ideaSubmissionStart),
      ideaSubmissionEnd: toDateTimeLocal(pool.ideaSubmissionEnd),
      teamFreezeDate: toDateTimeLocal(pool.teamFreezeDate),
    });

    setEditing(true);
  };

  const cancelEditing = () => {
    if (!saving) setEditing(false);
  };

  const updateEditField = (field: keyof EditForm, value: string) => {
    setEditForm((previous) => ({ ...previous, [field]: value }));
  };

  const saveChanges = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!id || !pool) return;

    if (pool.status !== 'DRAFT') {
      toast.error('Only draft pools can be edited.');
      return;
    }

    const dateFields: (keyof EditForm)[] = [
      'submissionStart',
      'submissionEnd',
      'reviewStart',
      'reviewEnd',
      'decisionDeadline',
      'selectionStart',
      'selectionEnd',
      'ideaSubmissionStart',
      'ideaSubmissionEnd',
      'teamFreezeDate',
    ];

    const invalidDate = dateFields.find((field) => {
      const value = editForm[field];
      return !value || Number.isNaN(new Date(value).getTime());
    });

    if (invalidDate) {
      toast.error('Please fill in all required timeline dates.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: editForm.name.trim(),
        academicYear: editForm.academicYear.trim(),
        semester: editForm.semester,
        department: editForm.department.trim(),
        submissionStart: new Date(editForm.submissionStart).toISOString(),
        submissionEnd: new Date(editForm.submissionEnd).toISOString(),
        reviewStart: new Date(editForm.reviewStart).toISOString(),
        reviewEnd: new Date(editForm.reviewEnd).toISOString(),
        decisionDeadline: new Date(editForm.decisionDeadline).toISOString(),
        selectionStart: new Date(editForm.selectionStart).toISOString(),
        selectionEnd: new Date(editForm.selectionEnd).toISOString(),
        ideaSubmissionStart: new Date(editForm.ideaSubmissionStart).toISOString(),
        ideaSubmissionEnd: new Date(editForm.ideaSubmissionEnd).toISOString(),
        teamFreezeDate: new Date(editForm.teamFreezeDate).toISOString(),
      };

      await poolService.update(id, payload);

      toast.success('Pool updated successfully.');
      setEditing(false);
      await load();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Failed to update pool');
    } finally {
      setSaving(false);
    }
  };

  // Pool actions and assignment removals
  const doAction = async (action: string) => {
    if (!id) return;

    setActionLoading(true);

    try {
      if (action === 'activate') {
        await poolService.activate(id);
      } else if (action === 'advance') {
        await poolService.advancePhase(id);
      } else if (action === 'freeze') {
        await poolService.freeze(id);
      } else if (action === 'archive') {
        await poolService.archive(id);
      } else if (action === 'approveAllLocked') {
        await projectService.approveAllLocked(id);
      } else if (action.startsWith('removeFaculty:')) {
        const facultyId = action.slice('removeFaculty:'.length);
        await poolService.removeFaculty(id, facultyId);
        toast.success('Faculty removed from pool.');
        setConfirm(null);
        await load();
        return;
      } else if (action.startsWith('removeSubadmin:')) {
        const subadminId = action.slice('removeSubadmin:'.length);
        await poolService.removeSubadmin(id, subadminId);
        toast.success('SubAdmin removed from pool.');
        setConfirm(null);
        await load();
        return;
      } else {
        return;
      }

      toast.success(
        action === 'archive'
          ? 'Pool archived successfully.'
          : 'Action completed successfully.'
      );

      setConfirm(null);
      await load();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Action failed');
      setConfirm(null);
    } finally {
      setActionLoading(false);
    }
  };

  const decideProject = async (
    projectId: string,
    decision: 'approve' | 'reject'
  ) => {
    if (!id) return;

    try {
      if (decision === 'approve') {
        await projectService.approve(id, projectId);
      } else {
        await projectService.reject(id, projectId);
      }

      toast.success(`Project ${decision}d`);
      await load();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Failed to update project');
    }
  };

  if (loading || !pool) {
    return <LoadingSpinner />;
  }

  const heldProjects = projects.filter(
    (project) => project.status === 'ON_HOLD'
  );
  const lockedProjects = projects.filter(
    (project) => project.status === 'LOCKED'
  );

  const assignedFaculty = pool.faculty || [];
  const assignedSubadmins = pool.subadmins || [];

  const assignedFacultyIds = new Set(
    assignedFaculty.map((assignment) => assignment.faculty.id)
  );
  const assignedSubadminIds = new Set(
    assignedSubadmins.map((assignment) => assignment.subadmin.id)
  );

  const tabOptions: PoolTab[] = [
    'overview',
    'projects',
    ...(isAdmin && heldProjects.length > 0 ? ['held' as const] : []),
  ];

  const showConfirm = (
    action: string,
    title: string,
    msg: string
  ) => setConfirm({ action, title, msg });

  // Edit mode
  if (editing && isAdmin && pool.status === 'DRAFT') {
    return (
      <form onSubmit={saveChanges} className="min-h-full pb-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80 md:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="mb-3 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  ← Back to Pool
                </button>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">
                  Edit Pool
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Update draft pool information and timeline.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80 md:p-7">
            <SectionHeading
              title="Basic Information"
              description="Configure the basic details of this project pool."
            />

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="md:col-span-3">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Pool Name *
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(event) => updateEditField('name', event.target.value)}
                  required
                  className={inputClass}
                  placeholder="PCS 2026 Odd"
                />
              </div>

              <FormInput
                label="Academic Year"
                value={editForm.academicYear}
                onChange={(value) => updateEditField('academicYear', value)}
                placeholder="2026-27"
              />

              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Semester *
                </label>
                <select
                  value={editForm.semester}
                  onChange={(event) => updateEditField('semester', event.target.value)}
                  required
                  className={inputClass}
                >
                  <option value="odd">Odd</option>
                  <option value="even">Even</option>
                </select>
              </div>

              <FormInput
                label="Department"
                value={editForm.department}
                onChange={(value) => updateEditField('department', value)}
                placeholder="Computer Science"
              />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80 md:p-7">
            <SectionHeading
              title="Pool Timeline"
              description="Define when each stage of the pool will be active."
            />

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <DateTimeField label="Submission Start" value={editForm.submissionStart} onChange={(value) => updateEditField('submissionStart', value)} />
              <DateTimeField label="Submission End" value={editForm.submissionEnd} onChange={(value) => updateEditField('submissionEnd', value)} />
              <DateTimeField label="Review Start" value={editForm.reviewStart} onChange={(value) => updateEditField('reviewStart', value)} />
              <DateTimeField label="Review End" value={editForm.reviewEnd} onChange={(value) => updateEditField('reviewEnd', value)} />
              <DateTimeField label="Decision Deadline" value={editForm.decisionDeadline} onChange={(value) => updateEditField('decisionDeadline', value)} />
              <DateTimeField label="Selection Start" value={editForm.selectionStart} onChange={(value) => updateEditField('selectionStart', value)} />
              <DateTimeField label="Selection End" value={editForm.selectionEnd} onChange={(value) => updateEditField('selectionEnd', value)} />
              <DateTimeField label="Idea Submission Start" value={editForm.ideaSubmissionStart} onChange={(value) => updateEditField('ideaSubmissionStart', value)} />
              <DateTimeField label="Idea Submission End" value={editForm.ideaSubmissionEnd} onChange={(value) => updateEditField('ideaSubmissionEnd', value)} />
              <DateTimeField label="Team Freeze" value={editForm.teamFreezeDate} onChange={(value) => updateEditField('teamFreezeDate', value)} />
            </div>
          </section>
        </div>
      </form>
    );
  }

  // Normal detail view
  return (
    <div className="relative min-h-full space-y-6 pb-10">
      <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-400/5" />
      <div className="pointer-events-none absolute right-0 top-20 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl dark:bg-blue-400/5" />

      <div className="relative mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/80 md:p-7">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <button
                onClick={() => navigate('/pools')}
                className="mb-3 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
              >
                ← Back to Pools
              </button>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="break-words text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-3xl">
                  {pool.name}
                </h1>
                <StatusBadge status={pool.status} />
              </div>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {pool.academicYear} • {pool.semester}
                {pool.department ? ` • ${pool.department}` : ''}
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {isAdmin && pool.status === 'DRAFT' && (
                <>
                  <ActionButton
                    icon={<Pencil className="h-4 w-4" />}
                    label="Edit"
                    onClick={startEditing}
                    variant="neutral"
                  />
                  <ActionButton
                    icon={<Play className="h-4 w-4" />}
                    label="Activate"
                    onClick={() => showConfirm('activate', 'Activate Pool?', 'This will open submissions for faculty.')}
                    variant="success"
                  />
                  <ActionButton
                    icon={<Archive className="h-4 w-4" />}
                    label="Archive"
                    onClick={() => showConfirm('archive', 'Archive Pool?', 'This will archive the draft pool. The pool will no longer be available for activation or editing.')}
                    variant="danger"
                  />
                </>
              )}

              {isAdmin && !['DRAFT', 'FROZEN', 'ARCHIVED'].includes(pool.status) && (
                <>
                  <ActionButton
                    icon={<FastForward className="h-4 w-4" />}
                    label="Advance"
                    onClick={() => showConfirm('advance', 'Advance Phase?', `Move from ${pool.status} to the next phase.`)}
                    variant="primary"
                  />
                  <ActionButton
                    icon={<Snowflake className="h-4 w-4" />}
                    label="Freeze"
                    onClick={() => showConfirm('freeze', 'Freeze Pool?', 'All teams will be frozen. Please confirm this action.')}
                    variant="cyan"
                  />
                </>
              )}
            </div>
          </div>
        </section>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Faculty" value={stats.facultyCount} icon={<UserRound className="h-5 w-5" />} description="Registered faculty" />
            <StatCard label="Students" value={stats.studentCount} icon={<Users className="h-5 w-5" />} description="Pool students" />
            <StatCard label="Projects" value={`${stats.approvedCount}/${stats.projectCount}`} icon={<FolderKanban className="h-5 w-5" />} description="Approved projects" />
            <StatCard label="Teams" value={stats.teamCount} icon={<Users className="h-5 w-5" />} description="Created teams" />
          </div>
        )}

        {/* Tabs */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
          <div className="flex overflow-x-auto px-4 sm:px-6">
            {tabOptions.map((tabItem) => {
              const active = tab === tabItem;

              return (
                <button
                  key={tabItem}
                  onClick={() => setTab(tabItem)}
                  className={`relative whitespace-nowrap px-4 py-4 text-sm font-semibold transition-colors ${
                    active
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {tabItem === 'held'
                    ? `On Hold (${heldProjects.length})`
                    : tabItem.charAt(0).toUpperCase() + tabItem.slice(1)}
                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-emerald-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80 md:p-7">
              <SectionHeading
                title="Pool Timeline"
                description="Current schedule for each stage of the project allocation process."
              />

              <div className="space-y-3">
                <TimelineRow label="Faculty Submission" start={pool.submissionStart} end={pool.submissionEnd} formatDate={formatDate} />
                <TimelineRow label="SubAdmin Review" start={pool.reviewStart} end={pool.reviewEnd} formatDate={formatDate} />
                <TimelineRow label="Admin Decision Deadline" start={pool.decisionDeadline} formatDate={formatDate} />
                <TimelineRow label="Student Selection" start={pool.selectionStart} end={pool.selectionEnd} formatDate={formatDate} />
                <TimelineRow label="Idea Submission" start={pool.ideaSubmissionStart} end={pool.ideaSubmissionEnd} formatDate={formatDate} />
                <TimelineRow label="Team Freeze" start={pool.teamFreezeDate} formatDate={formatDate} />
              </div>

              {isAdmin && lockedProjects.length > 0 && (
                <div className="mt-6 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                        Locked projects ready for approval
                      </p>
                      <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
                        {lockedProjects.length} project{lockedProjects.length !== 1 ? 's are' : ' is'} currently locked.
                      </p>
                    </div>
                    <button
                      onClick={() => showConfirm('approveAllLocked', 'Approve All Locked?', `This will approve ${lockedProjects.length} locked projects.`)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve All ({lockedProjects.length})
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Assignment Management */}
            {isAdmin && (
              <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80">
                <div className="border-b border-slate-200 p-6 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-emerald-600" />
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">
                        Pool Assignment Management
                      </h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Manage Faculty and pool-level SubAdmin assignments.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">
                  {/* SubAdmins */}
                  <AssignmentSection
                    title="Pool SubAdmins"
                    count={assignedSubadmins.length}
                    description="Users with SubAdmin capability for this pool."
                    icon={<ShieldCheck className="h-5 w-5 text-purple-600" />}
                    addLabel="Add SubAdmin"
                    onAdd={openAddSubadmin}
                    emptyMessage="No SubAdmin assigned."
                  >
                    {assignedSubadmins.map((assignment) => {
                      const subadmin = assignment.subadmin;
                      const alsoFaculty = assignedFacultyIds.has(subadmin.id);

                      return (
                        <AssignedUserRow
                          key={subadmin.id}
                          name={`${subadmin.firstName} ${subadmin.lastName}`}
                          email={subadmin.email}
                          role="SubAdmin"
                          secondaryRole={alsoFaculty ? 'Faculty' : undefined}
                          onRemove={() => removeSubadmin(subadmin.id)}
                        />
                      );
                    })}
                  </AssignmentSection>

                  {/* Faculty */}
                  <AssignmentSection
                    title="Pool Faculty"
                    count={assignedFaculty.length}
                    description="Faculty assigned to this pool."
                    icon={<Users className="h-5 w-5 text-blue-600" />}
                    addLabel="Add Faculty"
                    onAdd={openAddFaculty}
                    emptyMessage="No Faculty assigned."
                  >
                    {assignedFaculty.map((assignment) => {
                      const faculty = assignment.faculty;
                      const alsoSubadmin = assignedSubadminIds.has(faculty.id);

                      return (
                        <AssignedUserRow
                          key={faculty.id}
                          name={`${faculty.firstName} ${faculty.lastName}`}
                          email={faculty.email}
                          role="Faculty"
                          secondaryRole={alsoSubadmin ? 'SubAdmin' : undefined}
                          onRemove={() => removeFaculty(faculty.id)}
                        />
                      );
                    })}
                  </AssignmentSection>
                </div>
              </section>
            )}
          </div>
        )}

        {/* Projects */}
        {tab === 'projects' && (
          <section className="space-y-4">
            {projects.length === 0 ? (
              <EmptyState message="No projects have been submitted to this pool yet." />
            ) : (
              projects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700/70 dark:bg-slate-900/80"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-words font-bold text-slate-900 dark:text-white">
                          {project.title}
                        </p>
                        <Badge text={project.status} />
                      </div>

                      {project.projectCode && (
                        <p className="mt-2 inline-flex rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {project.projectCode}
                        </p>
                      )}

                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        {project.domain || 'General'} • {project.faculty?.firstName} {project.faculty?.lastName}
                      </p>
                    </div>

                    {project.team && (
                      <span className="inline-flex w-fit items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <Users className="h-3.5 w-3.5" />
                        Team: {project.team.name || 'Assigned'}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {/* Held projects */}
        {tab === 'held' && (
          <section className="space-y-4">
            {heldProjects.length === 0 ? (
              <EmptyState message="There are no projects currently on hold." />
            ) : (
              heldProjects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="break-words text-lg font-bold text-slate-900 dark:text-white">
                        {project.title}
                      </h4>
                      <Badge text={project.status} />
                    </div>

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      By: {project.faculty?.firstName} {project.faculty?.lastName}
                    </p>
                    <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {project.description || 'No description available.'}
                    </p>

                    {project.subadminNote && (
                      <div className="mt-4 rounded-2xl border border-amber-200/80 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/25">
                        <p className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                          SubAdmin Note
                        </p>
                        <p className="mt-1 text-sm leading-6 text-amber-800 dark:text-amber-200">
                          {project.subadminNote}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
                    <button
                      onClick={() => decideProject(project.id, 'approve')}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => decideProject(project.id, 'reject')}
                      className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>
        )}
      </div>

      {/* Add Faculty modal */}
      {showAddFaculty && (
        <AssignmentModal
          title="Add Faculty"
          description="Select an active Faculty member for this pool."
          label="Faculty"
          selectValue={selectedFacultyId}
          onSelect={setSelectedFacultyId}
          candidates={facultyCandidates.filter((candidate) => !assignedFacultyIds.has(candidate.id))}
          loading={loadingCandidates}
          saving={assignmentLoading}
          onClose={() => {
            if (!assignmentLoading) setShowAddFaculty(false);
          }}
          onSubmit={addFaculty}
          submitLabel="Add Faculty"
          emptyMessage="All active Faculty members are already assigned to this pool."
        />
      )}

      {/* Add SubAdmin modal */}
      {showAddSubadmin && (
        <AssignmentModal
          title="Add SubAdmin"
          description="Select an active SubAdmin or Faculty member."
          label="SubAdmin"
          selectValue={selectedSubadminId}
          onSelect={setSelectedSubadminId}
          candidates={subadminCandidates.filter((candidate) => !assignedSubadminIds.has(candidate.id))}
          loading={loadingCandidates}
          saving={assignmentLoading}
          onClose={() => {
            if (!assignmentLoading) setShowAddSubadmin(false);
          }}
          onSubmit={addSubadmin}
          submitLabel="Add SubAdmin"
          emptyMessage="All eligible SubAdmin/Faculty users are already assigned."
          showSubadminHelp
        />
      )}

      {/* Confirmation dialog */}
      {confirm && (
        <ConfirmDialog
          open
          title={confirm.title}
          message={confirm.msg}
          onConfirm={() => {
            if (!actionLoading) void doAction(confirm.action);
          }}
          onCancel={() => {
            if (!actionLoading) setConfirm(null);
          }}
        />
      )}
    </div>
  );
};

const inputClass =
  'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-500';

const SectionHeading: React.FC<{
  title: string;
  description: string;
}> = ({ title, description }) => (
  <div className="mb-6">
    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
      {title}
    </h2>
    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
      {description}
    </p>
  </div>
);

const FormInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ label, value, onChange, placeholder }) => (
  <div>
    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
      {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={inputClass}
    />
  </div>
);

const DateTimeField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ label, value, onChange }) => (
  <div>
    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
      {label} *
    </label>
    <input
      type="datetime-local"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required
      className={inputClass}
    />
  </div>
);

const ActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant: 'neutral' | 'success' | 'danger' | 'primary' | 'cyan';
}> = ({ icon, label, onClick, variant }) => {
  const styles = {
    neutral:
      'bg-slate-800 text-white hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    cyan: 'bg-cyan-600 text-white hover:bg-cyan-700',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-all hover:-translate-y-0.5 ${styles[variant]}`}
    >
      {icon}
      {label}
    </button>
  );
};

const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
}> = ({ label, value, icon, description }) => (
  <div className="group rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-lg dark:border-slate-700/70 dark:bg-slate-900/80">
    <div className="mb-4 flex items-center justify-between">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
        {icon}
      </div>
      <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
        Pool
      </span>
    </div>
    <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
      {value}
    </p>
    <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
      {label}
    </p>
    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
      {description}
    </p>
  </div>
);

const TimelineRow: React.FC<{
  label: string;
  start?: string | null;
  end?: string | null;
  formatDate: (value?: string | null) => string;
}> = ({ label, start, end, formatDate }) => (
  <div className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition-colors hover:border-slate-200 hover:bg-white sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-950/50 dark:hover:border-slate-700 dark:hover:bg-slate-900">
    <div className="flex items-center gap-3">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </span>
    </div>
    <span className="font-mono text-xs font-medium text-slate-600 dark:text-slate-300 sm:text-sm">
      {formatDate(start)}
      {end ? ` → ${formatDate(end)}` : ''}
    </span>
  </div>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    SUBMISSION_OPEN: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
    UNDER_REVIEW: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    DECISION_PENDING: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
    SELECTION_OPEN: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300',
    TEAMS_FORMING: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    FROZEN: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
    ARCHIVED: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${styles[status] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 px-6 py-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
      <FolderKanban className="h-6 w-6" />
    </div>
    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
      {message}
    </p>
  </div>
);

const AssignmentSection: React.FC<{
  title: string;
  count: number;
  description: string;
  icon: React.ReactNode;
  addLabel: string;
  onAdd: () => void;
  emptyMessage: string;
  children: React.ReactNode;
}> = ({
  title,
  count,
  description,
  icon,
  addLabel,
  onAdd,
  emptyMessage,
  children,
}) => {
  const hasChildren = React.Children.count(children) > 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/40">
        <div className="flex min-w-0 items-center gap-2">
          {icon}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white">
              {title}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {count} assigned
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          {addLabel}
        </button>
      </div>

      <div className="space-y-2 p-4">
        {!hasChildren ? (
          <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {emptyMessage}
          </p>
        ) : (
          children
        )}
      </div>
      <p className="px-4 pb-4 text-xs text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
};

const AssignedUserRow: React.FC<{
  name: string;
  email: string;
  role: 'Faculty' | 'SubAdmin';
  secondaryRole?: 'Faculty' | 'SubAdmin';
  onRemove: () => void;
}> = ({ name, email, role, secondaryRole, onRemove }) => (
  <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
        {name}
      </p>
      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
        {email}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        <span className={`rounded-full px-2 py-0.5 text-[11px] ${role === 'Faculty' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' : 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'}`}>
          {role}
        </span>
        {secondaryRole && (
          <span className={`rounded-full px-2 py-0.5 text-[11px] ${secondaryRole === 'Faculty' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' : 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'}`}>
            {secondaryRole}
          </span>
        )}
      </div>
    </div>

    <button
      type="button"
      onClick={onRemove}
      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30"
      title={`Remove ${role} assignment`}
    >
      <UserMinus className="h-3.5 w-3.5" />
      Remove
    </button>
  </div>
);

const AssignmentModal: React.FC<{
  title: string;
  description: string;
  label: string;
  selectValue: string;
  onSelect: (value: string) => void;
  candidates: User[];
  loading: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
  emptyMessage: string;
  showSubadminHelp?: boolean;
}> = ({
  title,
  description,
  label,
  selectValue,
  onSelect,
  candidates,
  loading,
  saving,
  onClose,
  onSubmit,
  submitLabel,
  emptyMessage,
  showSubadminHelp = false,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="assignment-modal-title"
      className="w-full max-w-lg rounded-2xl bg-white shadow-xl dark:bg-slate-900"
    >
      <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-700">
        <div>
          <h3 id="assignment-modal-title" className="font-bold text-slate-900 dark:text-white">
            {title}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          aria-label="Close dialog"
          className="rounded-lg p-1.5 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
        >
          <X className="h-5 w-5 text-slate-500" />
        </button>
      </div>

      <div className="p-5">
        {loading ? (
          <div className="py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {label}
            </label>
            <select
              value={selectValue}
              onChange={(event) => onSelect(event.target.value)}
              className={inputClass}
            >
              <option value="">Select {label}</option>
              {candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.firstName} {candidate.lastName} — {candidate.facultyId || candidate.email}
                  {showSubadminHelp && candidate.role === 'SUBADMIN'
                    ? ' (Global SubAdmin)'
                    : showSubadminHelp
                      ? ' (Faculty)'
                      : ''}
                </option>
              ))}
            </select>

            {candidates.length === 0 && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {emptyMessage}
              </p>
            )}

            {showSubadminHelp && (
              <div className="mt-3 rounded-xl border border-purple-100 bg-purple-50 p-3 dark:border-purple-900/60 dark:bg-purple-950/30">
                <p className="text-xs text-purple-800 dark:text-purple-200">
                  Assigning a Faculty member here does not change their global role. It gives them SubAdmin capability for this pool.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-200 p-5 dark:border-slate-700">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving || loading || !selectValue}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {showSubadminHelp ? (
            <ShieldCheck className="h-4 w-4" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          {saving ? 'Adding...' : submitLabel}
        </button>
      </div>
    </div>
  </div>
);

export default PoolDetailPage;