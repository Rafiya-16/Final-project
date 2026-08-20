import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { poolService } from '@/services/poolService';
import { projectService } from '@/services/projectService';
import { Badge } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  Play,
  FastForward,
  Snowflake,
  Archive,
  CheckCircle2,
  XCircle,
  Pencil,
  Save,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
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

  const load = async () => {
    if (!id) return;

    setLoading(true);

    try {
      const [p, pr, s] = await Promise.all([
        poolService.getById(id),
        projectService.listByPool(id),
        poolService.getStats(id),
      ]);

      setPool(p);
      setProjects(pr);
      setStats(s);
    } catch (e: unknown) {
      toast.error(getErrorMessage(e) || 'Failed to load pool');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  /*
   * Convert ISO date returned by backend into the format required
   * by <input type="datetime-local">
   */
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

  const saveChanges = async (e: React.FormEvent) => {
    e.preventDefault();

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

        reviewStart: new Date(
          editForm.reviewStart
        ).toISOString(),

        reviewEnd: new Date(
          editForm.reviewEnd
        ).toISOString(),

        decisionDeadline: new Date(
          editForm.decisionDeadline
        ).toISOString(),

        selectionStart: new Date(
          editForm.selectionStart
        ).toISOString(),

        selectionEnd: new Date(
          editForm.selectionEnd
        ).toISOString(),

        teamFreezeDate: new Date(
          editForm.teamFreezeDate
        ).toISOString(),
      };

      await poolService.update(id, payload);

      toast.success('Pool updated successfully.');

      setEditing(false);

      await load();
    } catch (e: unknown) {
      toast.error(getErrorMessage(e) || 'Failed to update pool');
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
      } else if (action === 'restore') {
      await poolService.restore(id);
      } else if (action === 'approveAllLocked') {
        await projectService.approveAllLocked(id);
      }

      toast.success(
        action === 'archive'
          ? 'Pool archived successfully.'
        : action === 'restore'
        ? 'Pool restored successfully.'
        : 'Done!'
      );

      setConfirm(null);

      await load();
    } catch (e: unknown) {
      toast.error(getErrorMessage(e) || 'Action failed');
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
    } catch (e: unknown) {
      toast.error(getErrorMessage(e));
    }
  };

  if (loading || !pool) {
    return <LoadingSpinner />;
  }

  const isAdmin = user?.role === 'ADMIN';

  const heldProjects = projects.filter(
    (p) => p.status === 'ON_HOLD'
  );

  const tabOptions: ('overview' | 'projects' | 'held')[] = [
    'overview',
    'projects',
    ...(isAdmin && heldProjects.length
      ? ['held' as const]
      : []),
  ];

  /*
   * ---------------------------------------------------------
   * EDIT MODE
   * ---------------------------------------------------------
   */
  if (editing && isAdmin && pool.status === 'DRAFT') {
    return (
      <form
        onSubmit={saveChanges}
        className="max-w-4xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              type="button"
              onClick={cancelEditing}
              className="text-sm text-blue-600 hover:text-blue-800 mb-1"
            >
              ← Back to Pool
            </button>

            <h1 className="text-2xl font-bold">
              Edit Pool
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Update the draft pool information and timeline.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={cancelEditing}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              <Save className="w-4 h-4" />

              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">
            Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className="text-sm font-medium text-gray-700">
                Pool Name *
              </label>

              <input
                type="text"
                value={editForm.name}
                onChange={(e) =>
                  updateEditField('name', e.target.value)
                }
                required
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="PCS 2026 Odd"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Academic Year
              </label>

              <input
                type="text"
                value={editForm.academicYear}
                onChange={(e) =>
                  updateEditField(
                    'academicYear',
                    e.target.value
                  )
                }
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Semester
              </label>

              <select
                value={editForm.semester}
                onChange={(e) =>
                  updateEditField(
                    'semester',
                    e.target.value
                  )
                }
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="odd">Odd</option>
                <option value="even">Even</option>
                <option value="Odd">Odd</option>
                <option value="Even">Even</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Department
              </label>

              <input
                type="text"
                value={editForm.department}
                onChange={(e) =>
                  updateEditField(
                    'department',
                    e.target.value
                  )
                }
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">
            Timeline
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DateTimeField
              label="Submission Start"
              value={editForm.submissionStart}
              onChange={(value) =>
                updateEditField(
                  'submissionStart',
                  value
                )
              }
            />

            <DateTimeField
              label="Submission End"
              value={editForm.submissionEnd}
              onChange={(value) =>
                updateEditField(
                  'submissionEnd',
                  value
                )
              }
            />

            <DateTimeField
              label="Review Start"
              value={editForm.reviewStart}
              onChange={(value) =>
                updateEditField(
                  'reviewStart',
                  value
                )
              }
            />

            <DateTimeField
              label="Review End"
              value={editForm.reviewEnd}
              onChange={(value) =>
                updateEditField(
                  'reviewEnd',
                  value
                )
              }
            />

            <DateTimeField
              label="Decision Deadline"
              value={editForm.decisionDeadline}
              onChange={(value) =>
                updateEditField(
                  'decisionDeadline',
                  value
                )
              }
            />

            <DateTimeField
              label="Selection Start"
              value={editForm.selectionStart}
              onChange={(value) =>
                updateEditField(
                  'selectionStart',
                  value
                )
              }
            />

            <DateTimeField
              label="Selection End"
              value={editForm.selectionEnd}
              onChange={(value) =>
                updateEditField(
                  'selectionEnd',
                  value
                )
              }
            />

            <DateTimeField
              label="Team Freeze"
              value={editForm.teamFreezeDate}
              onChange={(value) =>
                updateEditField(
                  'teamFreezeDate',
                  value
                )
              }
            />
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex justify-end gap-3 pb-8">
          <button
            type="button"
            onClick={cancelEditing}
            disabled={saving}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
          >
            <Save className="w-4 h-4" />

            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    );
  }

  /*
   * ---------------------------------------------------------
   * NORMAL POOL DETAIL VIEW
   * ---------------------------------------------------------
   */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/pools')}
            className="text-sm text-blue-600 hover:text-blue-800 mb-1"
          >
            ← Back to Pools
          </button>

          <h1 className="text-2xl font-bold">
            {pool.name}
          </h1>

          <p className="text-gray-500">
            {pool.academicYear} • {pool.semester}
            {pool.department
              ? ` • ${pool.department}`
              : ''}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* EDIT - DRAFT ONLY */}
          {isAdmin && pool.status === 'DRAFT' && (
            <button
              onClick={startEditing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
          )}

          {/* ACTIVATE - DRAFT ONLY */}
          {isAdmin && pool.status === 'DRAFT' && (
            <button
              onClick={() =>
                setConfirm({
                  action: 'activate',
                  title: 'Activate Pool?',
                  msg: 'This will open submissions for faculty.',
                })
              }
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Play className="w-4 h-4" />
              Activate
            </button>
          )}

          {/* ARCHIVE - DRAFT ONLY */}
          {isAdmin && pool.status === 'DRAFT' && (
            <button
              onClick={() =>
                setConfirm({
                  action: 'archive',
                  title: 'Archive Pool?',
                  msg:
                    'This will archive the draft pool. The pool will no longer be available for activation or editing.',
                })
              }
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Archive className="w-4 h-4" />
              Archive
            </button>
          )}

{/* RESTORE - ARCHIVED ONLY */}
{isAdmin && pool.status === 'ARCHIVED' && (
  <button
    onClick={() =>
      setConfirm({
        action: 'restore',
        title: 'Restore Pool?',
        msg:
          'This will restore the archived pool to Draft status. You will then be able to edit or activate it.',
      })
    }
    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
  >
    <Archive className="w-4 h-4" />
    Restore
  </button>
)}
          {/* ADVANCE */}
          {isAdmin &&
            !['DRAFT', 'FROZEN', 'ARCHIVED'].includes(
              pool.status
            ) && (
              <button
                onClick={() =>
                  setConfirm({
                    action: 'advance',
                    title: 'Advance Phase?',
                    msg: `Move from ${pool.status} to next phase.`,
                  })
                }
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FastForward className="w-4 h-4" />
                Advance
              </button>
            )}

          {/* FREEZE */}
          {isAdmin &&
            !['DRAFT', 'FROZEN', 'ARCHIVED'].includes(
              pool.status
            ) && (
              <button
                onClick={() =>
                  setConfirm({
                    action: 'freeze',
                    title: 'Freeze Pool?',
                    msg: 'All teams will be frozen.',
                  })
                }
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
              >
                <Snowflake className="w-4 h-4" />
                Freeze
              </button>
            )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              l: 'Faculty',
              v: stats.facultyCount,
            },
            {
              l: 'Students',
              v: stats.studentCount,
            },
            {
              l: 'Projects',
              v:
                stats.approvedCount +
                '/' +
                stats.projectCount,
            },
            {
              l: 'Teams',
              v: stats.teamCount,
            },
          ].map((s) => (
            <div
              key={s.l}
              className="bg-white rounded-xl border p-4 text-center"
            >
              <p className="text-2xl font-bold text-gray-900">
                {s.v}
              </p>

              <p className="text-sm text-gray-500">
                {s.l}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        {tabOptions.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 px-1 text-sm font-medium border-b-2 ${
              tab === t
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'held'
              ? `On Hold (${heldProjects.length})`
              : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold mb-4">
            Timeline
          </h3>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              [
                'Submission',
                pool.submissionStart,
                pool.submissionEnd,
              ],
              [
                'Review',
                pool.reviewStart,
                pool.reviewEnd,
              ],
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
              [
                'Team Freeze',
                pool.teamFreezeDate,
                '',
              ],
            ].map(([l, s, e]) => (
              <div
                key={l as string}
                className="flex justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-gray-600">
                  {l}
                </span>

                <span className="font-mono text-gray-800">
                  {new Date(
                    s as string
                  ).toLocaleDateString()}

                  {e
                    ? ` → ${new Date(
                        e as string
                      ).toLocaleDateString()}`
                    : ''}
                </span>
              </div>
            ))}
          </div>

          {isAdmin &&
            projects.filter(
              (p) => p.status === 'LOCKED'
            ).length > 0 && (
              <button
                onClick={() =>
                  setConfirm({
                    action: 'approveAllLocked',
                    title: 'Approve All Locked?',
                    msg: `This will approve ${
                      projects.filter(
                        (p) => p.status === 'LOCKED'
                      ).length
                    } locked projects.`,
                  })
                }
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Approve All Locked (
                {
                  projects.filter(
                    (p) => p.status === 'LOCKED'
                  ).length
                }
                )
              </button>
            )}
        </div>
      )}

      {/* Projects */}
      {tab === 'projects' && (
        <div className="space-y-3">
          {projects.length === 0 ? (
            <p className="text-gray-500 text-sm bg-white rounded-xl border p-6">
              No projects yet
            </p>
          ) : (
            projects.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl border p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {p.title}
                  </p>

                  <p className="text-sm text-gray-500">
                    {p.domain || 'General'} •{' '}
                    {p.faculty?.firstName}{' '}
                    {p.faculty?.lastName}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Badge text={p.status} />

                  {p.team && (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      Team:{' '}
                      {p.team.name || 'Assigned'}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Held Projects */}
      {tab === 'held' && (
        <div className="space-y-3">
          {heldProjects.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl border p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {p.title}
                  </h4>

                  <p className="text-sm text-gray-500 mt-1">
                    By: {p.faculty?.firstName}{' '}
                    {p.faculty?.lastName}
                  </p>

                  <p className="text-sm text-gray-600 mt-2">
                    {p.description}
                  </p>

                  {p.subadminNote && (
                    <p className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded mt-2">
                      Subadmin note:{' '}
                      {p.subadminNote}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() =>
                    decideProject(p.id, 'approve')
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve
                </button>

                <button
                  onClick={() =>
                    decideProject(p.id, 'reject')
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirm && (
        <ConfirmDialog
          open
          title={confirm.title}
          message={confirm.msg}
          onConfirm={() =>
            doAction(confirm.action)
          }
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
};

/*
 * Reusable datetime-local field
 */
const DateTimeField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ label, value, onChange }) => {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">
        {label} *
      </label>

      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
};

export default PoolDetailPage;