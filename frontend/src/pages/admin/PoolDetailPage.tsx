import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Archive,
  CheckCircle2,
  FastForward,
  Pencil,
  Play,
  Save,
  Snowflake,
  Users,
  UserRound,
  FolderKanban,
  X,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { poolService } from '@/services/poolService';
import { projectService } from '@/services/projectService';
import { Badge } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { Pool, Project, PoolStats } from '@/types';
import { getErrorMessage } from '@/types';
import { useAuthStore } from '@/stores/authStore';

const PoolDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [pool, setPool] = useState<Pool | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<PoolStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [confirm, setConfirm] = useState<{
    action: string;
    title: string;
    msg: string;
  } | null>(null);

  const [tab, setTab] = useState<'overview' | 'projects' | 'held'>(
    'overview'
  );

  const [editing, setEditing] = useState(false);

  const [editForm, setEditForm] = useState({
    name: '',
    academicYear: '',
    semester: '',
    department: '',
    submissionStart: '',
    submissionEnd: '',
    reviewStart: '',
    reviewEnd: '',
    decisionDeadline: '',
    selectionStart: '',
    selectionEnd: '',
    teamFreezeDate: '',
  });

  const isAdmin = user?.role === 'ADMIN';

  const load = async () => {
    if (!id) return;

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
  };

  useEffect(() => {
    load();
  }, [id]);

  const toDateTimeLocal = (value?: string | null) => {
    if (!value) return '';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '';

    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);

    return localDate.toISOString().slice(0, 16);
  };

  const startEditing = () => {
    if (!pool) return;

    if (pool.status !== 'DRAFT') {
      toast.error('Only draft pools can be edited.');
      return;
    }

    setEditForm({
      name: pool.name || '',
      academicYear: pool.academicYear || '',
      semester: pool.semester || '',
      department: pool.department || '',

      submissionStart: toDateTimeLocal(pool.submissionStart),
      submissionEnd: toDateTimeLocal(pool.submissionEnd),

      reviewStart: toDateTimeLocal(pool.reviewStart),
      reviewEnd: toDateTimeLocal(pool.reviewEnd),

      decisionDeadline: toDateTimeLocal(pool.decisionDeadline),

      selectionStart: toDateTimeLocal(pool.selectionStart),
      selectionEnd: toDateTimeLocal(pool.selectionEnd),

      teamFreezeDate: toDateTimeLocal(pool.teamFreezeDate),
    });

    setEditing(true);
  };

  const cancelEditing = () => {
    if (saving) return;
    setEditing(false);
  };

  const updateEditField = (
    field: keyof typeof editForm,
    value: string
  ) => {
    setEditForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const saveChanges = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!id || !pool) return;

    if (pool.status !== 'DRAFT') {
      toast.error('Only draft pools can be edited.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: editForm.name.trim(),
        academicYear: editForm.academicYear.trim(),
        semester: editForm.semester,
        department: editForm.department.trim(),

        submissionStart: new Date(
          editForm.submissionStart
        ).toISOString(),

        submissionEnd: new Date(
          editForm.submissionEnd
        ).toISOString(),

        reviewStart: new Date(editForm.reviewStart).toISOString(),

        reviewEnd: new Date(editForm.reviewEnd).toISOString(),

        decisionDeadline: new Date(
          editForm.decisionDeadline
        ).toISOString(),

        selectionStart: new Date(
          editForm.selectionStart
        ).toISOString(),

        selectionEnd: new Date(editForm.selectionEnd).toISOString(),

        teamFreezeDate: new Date(
          editForm.teamFreezeDate
        ).toISOString(),
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

  const doAction = async (action: string) => {
    if (!id) return;

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
      toast.error(getErrorMessage(error));
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

  const tabOptions: ('overview' | 'projects' | 'held')[] = [
    'overview',
    'projects',
    ...(isAdmin && heldProjects.length > 0
      ? ['held' as const]
      : []),
  ];

  /*
   * =========================================================
   * EDIT MODE
   * =========================================================
   */

  if (editing && isAdmin && pool.status === 'DRAFT') {
    return (
      <form
        onSubmit={saveChanges}
        className="min-h-full pb-10"
      >
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Edit Header */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/80 md:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  ← Back to Pool
                </button>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-3xl">
                  Edit Pool
                </h1>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Update the draft pool information and timeline.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/80 md:p-7">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Basic Information
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Configure the basic details of this project pool.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="md:col-span-3">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Pool Name *
                </label>

                <input
                  type="text"
                  value={editForm.name}
                  onChange={(event) =>
                    updateEditField('name', event.target.value)
                  }
                  required
                  placeholder="PCS 2026 Odd"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>

              <FormInput
                label="Academic Year"
                value={editForm.academicYear}
                onChange={(value) =>
                  updateEditField('academicYear', value)
                }
                placeholder="2026-27"
              />

              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Semester
                </label>

                <select
                  value={editForm.semester}
                  onChange={(event) =>
                    updateEditField(
                      'semester',
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950/70 dark:text-white"
                >
                  <option value="odd">Odd</option>
                  <option value="even">Even</option>
                </select>
              </div>

              <FormInput
                label="Department"
                value={editForm.department}
                onChange={(value) =>
                  updateEditField('department', value)
                }
                placeholder="Computer Science"
              />
            </div>
          </section>

          {/* Timeline */}
          <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/80 md:p-7">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Pool Timeline
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Define when each stage of the pool will be active.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <DateTimeField
                label="Submission Start"
                value={editForm.submissionStart}
                onChange={(value) =>
                  updateEditField('submissionStart', value)
                }
              />

              <DateTimeField
                label="Submission End"
                value={editForm.submissionEnd}
                onChange={(value) =>
                  updateEditField('submissionEnd', value)
                }
              />

              <DateTimeField
                label="Review Start"
                value={editForm.reviewStart}
                onChange={(value) =>
                  updateEditField('reviewStart', value)
                }
              />

              <DateTimeField
                label="Review End"
                value={editForm.reviewEnd}
                onChange={(value) =>
                  updateEditField('reviewEnd', value)
                }
              />

              <DateTimeField
                label="Decision Deadline"
                value={editForm.decisionDeadline}
                onChange={(value) =>
                  updateEditField('decisionDeadline', value)
                }
              />

              <DateTimeField
                label="Selection Start"
                value={editForm.selectionStart}
                onChange={(value) =>
                  updateEditField('selectionStart', value)
                }
              />

              <DateTimeField
                label="Selection End"
                value={editForm.selectionEnd}
                onChange={(value) =>
                  updateEditField('selectionEnd', value)
                }
              />

              <DateTimeField
                label="Team Freeze"
                value={editForm.teamFreezeDate}
                onChange={(value) =>
                  updateEditField('teamFreezeDate', value)
                }
              />
            </div>
          </section>

          {/* Bottom Actions */}
          <div className="flex flex-col-reverse justify-end gap-3 pb-4 sm:flex-row">
            <button
              type="button"
              onClick={cancelEditing}
              disabled={saving}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    );
  }

  /*
   * =========================================================
   * NORMAL POOL DETAIL VIEW
   * =========================================================
   */

  return (
    <div className="relative min-h-full space-y-6 pb-10">
      {/* Soft background glow */}
      <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-400/5" />
      <div className="pointer-events-none absolute right-0 top-20 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl dark:bg-blue-400/5" />

      <div className="relative mx-auto max-w-7xl space-y-6">
        {/* =====================================================
            HEADER
        ====================================================== */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-xl transition-all duration-300 dark:border-slate-700/70 dark:bg-slate-900/80 md:p-7">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <button
                onClick={() => navigate('/pools')}
                className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
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

            {/* Actions */}
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
                    onClick={() =>
                      setConfirm({
                        action: 'activate',
                        title: 'Activate Pool?',
                        msg:
                          'This will open submissions for faculty.',
                      })
                    }
                    variant="success"
                  />

                  <ActionButton
                    icon={<Archive className="h-4 w-4" />}
                    label="Archive"
                    onClick={() =>
                      setConfirm({
                        action: 'archive',
                        title: 'Archive Pool?',
                        msg:
                          'This will archive the draft pool. The pool will no longer be available for activation or editing.',
                      })
                    }
                    variant="danger"
                  />
                </>
              )}

              {isAdmin &&
                !['DRAFT', 'FROZEN', 'ARCHIVED'].includes(
                  pool.status
                ) && (
                  <>
                    <ActionButton
                      icon={<FastForward className="h-4 w-4" />}
                      label="Advance"
                      onClick={() =>
                        setConfirm({
                          action: 'advance',
                          title: 'Advance Phase?',
                          msg: `Move from ${pool.status} to the next phase.`,
                        })
                      }
                      variant="primary"
                    />

                    <ActionButton
                      icon={<Snowflake className="h-4 w-4" />}
                      label="Freeze"
                      onClick={() =>
                        setConfirm({
                          action: 'freeze',
                          title: 'Freeze Pool?',
                          msg:
                            'All teams will be frozen. Please confirm this action.',
                        })
                      }
                      variant="cyan"
                    />
                  </>
                )}
            </div>
          </div>
        </div>

        {/* =====================================================
            STATS
        ====================================================== */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Faculty"
              value={stats.facultyCount}
              icon={<UserRound className="h-5 w-5" />}
              description="Registered faculty"
            />

            <StatCard
              label="Students"
              value={stats.studentCount}
              icon={<Users className="h-5 w-5" />}
              description="Pool students"
            />

            <StatCard
              label="Projects"
              value={`${stats.approvedCount}/${stats.projectCount}`}
              icon={<FolderKanban className="h-5 w-5" />}
              description="Approved projects"
            />

            <StatCard
              label="Teams"
              value={stats.teamCount}
              icon={<Users className="h-5 w-5" />}
              description="Created teams"
            />
          </div>
        )}

        {/* =====================================================
            TABS
        ====================================================== */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70">
          <div className="flex overflow-x-auto px-4 sm:px-6">
            {tabOptions.map((tabItem) => {
              const active = tab === tabItem;

              return (
                <button
                  key={tabItem}
                  onClick={() => setTab(tabItem)}
                  className={`relative whitespace-nowrap px-4 py-4 text-sm font-semibold transition-all ${
                    active
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {tabItem === 'held'
                    ? `On Hold (${heldProjects.length})`
                    : tabItem.charAt(0).toUpperCase() +
                      tabItem.slice(1)}

                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-emerald-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* =====================================================
            OVERVIEW
        ====================================================== */}
        {tab === 'overview' && (
          <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/80 md:p-7">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Pool Timeline
              </h3>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Current schedule for each stage of the project
                allocation process.
              </p>
            </div>

            <div className="space-y-3">
              {[
                [
                  'Submission',
                  pool.submissionStart,
                  pool.submissionEnd,
                ],
                ['Review', pool.reviewStart, pool.reviewEnd],
                [
                  'Decision Deadline',
                  pool.decisionDeadline,
                  '',
                ],
                [
                  'Selection',
                  pool.selectionStart,
                  pool.selectionEnd,
                ],
                ['Team Freeze', pool.teamFreezeDate, ''],
              ].map(([label, start, end]) => (
                <TimelineRow
                  key={label as string}
                  label={label as string}
                  start={start as string}
                  end={end as string}
                />
              ))}
            </div>

            {isAdmin && lockedProjects.length > 0 && (
              <div className="mt-6 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                      Locked projects ready for approval
                    </p>

                    <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
                      {lockedProjects.length} project
                      {lockedProjects.length !== 1 ? 's are' : ' is'}{' '}
                      currently locked.
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      setConfirm({
                        action: 'approveAllLocked',
                        title: 'Approve All Locked?',
                        msg: `This will approve ${lockedProjects.length} locked projects.`,
                      })
                    }
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve All ({lockedProjects.length})
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* =====================================================
            PROJECTS
        ====================================================== */}
        {tab === 'projects' && (
          <section className="space-y-4">
            {projects.length === 0 ? (
              <EmptyState message="No projects have been submitted to this pool yet." />
            ) : (
              projects.map((project) => (
                <div
                  key={project.id}
                  className="group rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700/70 dark:bg-slate-900/80"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-words text-base font-bold text-slate-900 dark:text-white">
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
                        {project.domain || 'General'} •{' '}
                        {project.faculty?.firstName}{' '}
                        {project.faculty?.lastName}
                      </p>
                    </div>

                    {project.team && (
                      <span className="inline-flex w-fit items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <Users className="h-3.5 w-3.5" />
                        Team:{' '}
                        {project.team.name || 'Assigned'}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {/* =====================================================
            HELD PROJECTS
        ====================================================== */}
        {tab === 'held' && (
          <section className="space-y-4">
            {heldProjects.length === 0 ? (
              <EmptyState message="There are no projects currently on hold." />
            ) : (
              heldProjects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm transition-all duration-300 hover:shadow-md dark:border-slate-700/70 dark:bg-slate-900/80"
                >
                  <div className="flex flex-col gap-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="break-words text-lg font-bold text-slate-900 dark:text-white">
                          {project.title}
                        </h4>

                        <Badge text={project.status} />
                      </div>

                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        By: {project.faculty?.firstName}{' '}
                        {project.faculty?.lastName}
                      </p>

                      <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {project.description ||
                          'No description available.'}
                      </p>

                      {project.subadminNote && (
                        <div className="mt-4 rounded-2xl border border-amber-200/80 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/25">
                          <p className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                            Subadmin Note
                          </p>

                          <p className="mt-1 text-sm leading-6 text-amber-800 dark:text-amber-200">
                            {project.subadminNote}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
                      <button
                        onClick={() =>
                          decideProject(project.id, 'approve')
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Approve
                      </button>

                      <button
                        onClick={() =>
                          decideProject(project.id, 'reject')
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-rose-700"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </section>
        )}
      </div>

      {/* =====================================================
          CONFIRMATION DIALOG
      ====================================================== */}
      {confirm && (
        <ConfirmDialog
          open
          title={confirm.title}
          message={confirm.msg}
          onConfirm={() => doAction(confirm.action)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
};

/*
 * =========================================================
 * FORM INPUT
 * =========================================================
 */

const FormInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ label, value, onChange, placeholder }) => {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </label>

      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-500"
      />
    </div>
  );
};

/*
 * =========================================================
 * DATE TIME FIELD
 * =========================================================
 */

const DateTimeField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ label, value, onChange }) => {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        {label} *
      </label>

      <input
        type="datetime-local"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950/70 dark:text-white"
      />
    </div>
  );
};

/*
 * =========================================================
 * ACTION BUTTON
 * =========================================================
 */

const ActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant:
    | 'neutral'
    | 'success'
    | 'danger'
    | 'primary'
    | 'cyan';
}> = ({ icon, label, onClick, variant }) => {
  const styles = {
    neutral:
      'bg-slate-800 text-white hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600',
    success:
      'bg-emerald-600 text-white hover:bg-emerald-700',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700',
    primary:
      'bg-blue-600 text-white hover:bg-blue-700',
    cyan:
      'bg-cyan-600 text-white hover:bg-cyan-700',
  };

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5 ${styles[variant]}`}
    >
      {icon}
      {label}
    </button>
  );
};

/*
 * =========================================================
 * STAT CARD
 * =========================================================
 */

const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
}> = ({ label, value, icon, description }) => {
  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-700/70 dark:bg-slate-900/80">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform duration-300 group-hover:scale-105 dark:bg-emerald-950/40 dark:text-emerald-400">
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
};

/*
 * =========================================================
 * TIMELINE ROW
 * =========================================================
 */

const TimelineRow: React.FC<{
  label: string;
  start: string;
  end: string;
}> = ({ label, start, end }) => {
  const formatDate = (value: string) => {
    if (!value) return 'Not scheduled';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Not scheduled';
    }

    return date.toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition-all duration-200 hover:border-slate-200 hover:bg-white sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-950/50 dark:hover:border-slate-700 dark:hover:bg-slate-900">
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/40" />

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
};

/*
 * =========================================================
 * STATUS BADGE
 * =========================================================
 */

const StatusBadge: React.FC<{
  status: string;
}> = ({ status }) => {
  const styles: Record<string, string> = {
    DRAFT:
      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    SUBMISSION_OPEN:
      'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
    UNDER_REVIEW:
      'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    DECISION_PENDING:
      'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
    SELECTION_OPEN:
      'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300',
    TEAMS_FORMING:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    FROZEN:
      'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
    ARCHIVED:
      'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${styles[status] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
};

/*
 * =========================================================
 * EMPTY STATE
 * =========================================================
 */

const EmptyState: React.FC<{
  message: string;
}> = ({ message }) => {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 px-6 py-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        <FolderKanban className="h-6 w-6" />
      </div>

      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {message}
      </p>
    </div>
  );
};

export default PoolDetailPage;