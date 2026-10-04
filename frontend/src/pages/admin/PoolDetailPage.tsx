import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { poolService } from '@/services/poolService';
import { projectService } from '@/services/projectService';
import { userService } from '@/services/userService';
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
  RefreshCw,
  Save,
  X,
  Plus,
  UserPlus,
  UserMinus,
  ShieldCheck,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type {
  Pool,
  Project,
  PoolStats,
  User,
} from '@/types';
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
  const [reorganizingCodes, setReorganizingCodes] =
    useState(false);

  const [confirm, setConfirm] = useState<{
    action: string;
    title: string;
    msg: string;
  } | null>(null);

  const [tab, setTab] = useState<
    'overview' | 'projects' | 'held'
  >('overview');

  const [editing, setEditing] = useState(false);

  /*
   * ---------------------------------------------------------
   * POOL ASSIGNMENT MANAGEMENT STATE
   * ---------------------------------------------------------
   */

  const [showAddFaculty, setShowAddFaculty] =
    useState(false);

  const [showAddSubadmin, setShowAddSubadmin] =
    useState(false);

  const [facultyCandidates, setFacultyCandidates] =
    useState<User[]>([]);

  const [subadminCandidates, setSubadminCandidates] =
    useState<User[]>([]);

  const [loadingCandidates, setLoadingCandidates] =
    useState(false);

  const [assignmentLoading, setAssignmentLoading] =
    useState(false);

  const [selectedFacultyId, setSelectedFacultyId] =
    useState('');

  const [selectedSubadminId, setSelectedSubadminId] =
    useState('');

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
    ideaSubmissionStart: '',
    ideaSubmissionEnd: '',
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
      toast.error(
        getErrorMessage(e) || 'Failed to load pool'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  /*
   * ---------------------------------------------------------
   * LOAD ASSIGNMENT CANDIDATES
   * ---------------------------------------------------------
   */

  const loadAssignmentCandidates = async () => {
    setLoadingCandidates(true);

    try {
      const [facultyResponse, subadminFacultyResponse, subadminResponse] =
        await Promise.all([
          userService.list({
            role: 'FACULTY',
            limit: '500',
            isActive: 'true',
          }),

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

      const facultyUsers: User[] =
        facultyResponse?.data || [];

      const subadminFacultyUsers: User[] =
        subadminFacultyResponse?.data || [];

      const globalSubadmins: User[] =
        subadminResponse?.data || [];
       
      const uniqueSubadmins = new Map<string, User>();

      [
        ...globalSubadmins,
        ...subadminFacultyUsers,
      ].forEach((candidate) => {
        if (candidate.isActive) {
          uniqueSubadmins.set(
            candidate.id,
            candidate
          );
        }
      });

      setFacultyCandidates(
        facultyUsers.filter(
          (candidate) => candidate.isActive
        )
      );

      setSubadminCandidates(
        Array.from(uniqueSubadmins.values())
      );
    } catch (e: unknown) {
      toast.error(
        getErrorMessage(e) ||
          'Failed to load assignment candidates'
      );
    } finally {
      setLoadingCandidates(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * OPEN ADD FACULTY / SUBADMIN
   * ---------------------------------------------------------
   */

  const openAddFaculty = async () => {
    setSelectedFacultyId('');
    setShowAddFaculty(true);

    if (
      facultyCandidates.length === 0 &&
      subadminCandidates.length === 0
    ) {
      await loadAssignmentCandidates();
    } else if (facultyCandidates.length === 0) {
      await loadAssignmentCandidates();
    }
  };

  const openAddSubadmin = async () => {
    setSelectedSubadminId('');
    setShowAddSubadmin(true);

    if (
      facultyCandidates.length === 0 &&
      subadminCandidates.length === 0
    ) {
      await loadAssignmentCandidates();
    } else if (subadminCandidates.length === 0) {
      await loadAssignmentCandidates();
    }
  };

  /*
   * ---------------------------------------------------------
   * ADD FACULTY
   * ---------------------------------------------------------
   */

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
    } catch (e: unknown) {
      toast.error(
        getErrorMessage(e) ||
          'Failed to assign faculty'
      );
    } finally {
      setAssignmentLoading(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * ADD SUBADMIN
   * ---------------------------------------------------------
   */

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

      toast.success(
        'SubAdmin capability assigned to pool.'
      );

      setShowAddSubadmin(false);
      setSelectedSubadminId('');

      await load();
    } catch (e: unknown) {
      toast.error(
        getErrorMessage(e) ||
          'Failed to assign SubAdmin'
      );
    } finally {
      setAssignmentLoading(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * REMOVE FACULTY
   * ---------------------------------------------------------
   */

  const removeFaculty = (facultyId: string) => {
    setConfirm({
      action: `removeFaculty:${facultyId}`,
      title: 'Remove Faculty from Pool?',
      msg:
        'This will remove only the Faculty assignment from this pool. If this user is also a SubAdmin, their SubAdmin capability will remain.',
    });
  };

  /*
   * ---------------------------------------------------------
   * REMOVE SUBADMIN
   * ---------------------------------------------------------
   */

  const removeSubadmin = (subadminId: string) => {
    setConfirm({
      action: `removeSubadmin:${subadminId}`,
      title: 'Remove SubAdmin from Pool?',
      msg:
        'This will remove only the pool-level SubAdmin capability. If this user is also assigned as Faculty, their Faculty assignment will remain.',
    });
  };

  /*
   * ---------------------------------------------------------
   * REORGANIZE PROJECT CODES
   * ---------------------------------------------------------
   */

  const reorganizeProjectCodes = async () => {
    if (!id || reorganizingCodes) return;

    setReorganizingCodes(true);

    try {
      await projectService.reorganizeCodes(id);

      toast.success(
        'Project codes reorganized successfully'
      );

      await load();
    } catch (e: unknown) {
      toast.error(getErrorMessage(e));
    } finally {
      setReorganizingCodes(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * DATE HELPERS
   * ---------------------------------------------------------
   */

  const toDateTimeLocal = (
    value?: string | null
  ) => {
    if (!value) return '';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '';

    const offset = date.getTimezoneOffset();

    const localDate = new Date(
      date.getTime() -
        offset * 60 * 1000
    );

    return localDate
      .toISOString()
      .slice(0, 16);
  };

  /*
   * ---------------------------------------------------------
   * EDIT POOL
   * ---------------------------------------------------------
   */

  const startEditing = () => {
    if (!pool) return;

    if (pool.status !== 'DRAFT') {
      toast.error(
        'Only draft pools can be edited.'
      );
      return;
    }

    setEditForm({
      name: pool.name || '',
      academicYear: pool.academicYear || '',
      semester: pool.semester || '',
      department: pool.department || '',

      submissionStart: toDateTimeLocal(
        pool.submissionStart
      ),

      submissionEnd: toDateTimeLocal(
        pool.submissionEnd
      ),

      reviewStart: toDateTimeLocal(
        pool.reviewStart
      ),

      reviewEnd: toDateTimeLocal(
        pool.reviewEnd
      ),

      decisionDeadline: toDateTimeLocal(
        pool.decisionDeadline
      ),

      selectionStart: toDateTimeLocal(
        pool.selectionStart
      ),

      selectionEnd: toDateTimeLocal(
        pool.selectionEnd
      ),

       ideaSubmissionStart: toDateTimeLocal(
        pool.ideaSubmissionStart
      ),

      ideaSubmissionEnd: toDateTimeLocal(
        pool.ideaSubmissionEnd
      ),

      teamFreezeDate: toDateTimeLocal(
        pool.teamFreezeDate
      ),
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

  const saveChanges = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!id || !pool) return;

    if (pool.status !== 'DRAFT') {
      toast.error(
        'Only draft pools can be edited.'
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: editForm.name.trim(),
        academicYear:
          editForm.academicYear.trim(),
        semester: editForm.semester,
        department:
          editForm.department.trim(),

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

        ideaSubmissionStart: new Date(
          editForm.ideaSubmissionStart
        ).toISOString(),

        ideaSubmissionEnd: new Date(
          editForm.ideaSubmissionEnd
        ).toISOString(),

        teamFreezeDate: new Date(
          editForm.teamFreezeDate
        ).toISOString(),
      };

      await poolService.update(
        id,
        payload
      );

      toast.success(
        'Pool updated successfully.'
      );

      setEditing(false);

      await load();
    } catch (e: unknown) {
      toast.error(
        getErrorMessage(e) ||
          'Failed to update pool'
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * POOL ACTIONS
   * ---------------------------------------------------------
   */

  const doAction = async (
    action: string
  ) => {
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
      } else if (
        action === 'approveAllLocked'
      ) {
        await projectService.approveAllLocked(id);
      } else if (
        action === 'reorganizeCodes'
      ) {
        await reorganizeProjectCodes();

        setConfirm(null);

        return;
      } else if (
        action.startsWith('removeFaculty:')
      ) {
        const facultyId =
          action.split(':')[1];

        await poolService.removeFaculty(
          id,
          facultyId
        );

        toast.success(
          'Faculty removed from pool.'
        );

        setConfirm(null);

        await load();

        return;
      } else if (
        action.startsWith('removeSubadmin:')
      ) {
        const subadminId =
          action.split(':')[1];

        await poolService.removeSubadmin(
          id,
          subadminId
        );

        toast.success(
          'SubAdmin removed from pool.'
        );

        setConfirm(null);

        await load();

        return;
      }

      toast.success(
        action === 'archive'
          ? 'Pool archived successfully.'
          : 'Done!'
      );

      setConfirm(null);

      await load();
    } catch (e: unknown) {
      toast.error(
        getErrorMessage(e) ||
          'Action failed'
      );

      setConfirm(null);
    }
  };

  /*
   * ---------------------------------------------------------
   * PROJECT DECISION
   * ---------------------------------------------------------
   */

  const decideProject = async (
    projectId: string,
    decision: 'approve' | 'reject'
  ) => {
    if (!id) return;

    try {
      if (decision === 'approve') {
        await projectService.approve(
          id,
          projectId
        );
      } else {
        await projectService.reject(
          id,
          projectId
        );
      }

      toast.success(
        `Project ${decision}d`
      );

      await load();
    } catch (e: unknown) {
      toast.error(
        getErrorMessage(e)
      );
    }
  };

  if (loading || !pool) {
    return <LoadingSpinner />;
  }

  const isAdmin =
    user?.role === 'ADMIN';

  const heldProjects =
    projects.filter(
      (p) => p.status === 'ON_HOLD'
    );

  const tabOptions: (
    | 'overview'
    | 'projects'
    | 'held'
  )[] = [
    'overview',
    'projects',
    ...(isAdmin &&
    heldProjects.length
      ? ['held' as const]
      : []),
  ];

  /*
   * ---------------------------------------------------------
   * ASSIGNED USERS
   * ---------------------------------------------------------
   */

  const assignedFaculty =
    pool.faculty || [];

  const assignedSubadmins =
    pool.subadmins || [];

  const assignedFacultyIds =
    new Set(
      assignedFaculty.map(
        (item) => item.faculty.id
      )
    );

  const assignedSubadminIds =
    new Set(
      assignedSubadmins.map(
        (item) => item.subadmin.id
      )
    );

  /*
   * ---------------------------------------------------------
   * EDIT MODE
   * ---------------------------------------------------------
   */

  if (
    editing &&
    isAdmin &&
    pool.status === 'DRAFT'
  ) {
    return (
      <form
        onSubmit={saveChanges}
        className="max-w-4xl mx-auto space-y-6"
      >
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

              {saving
                ? 'Saving...'
                : 'Save Changes'}
            </button>
          </div>
        </div>

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
                  updateEditField(
                    'name',
                    e.target.value
                  )
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
                value={
                  editForm.academicYear
                }
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
                <option value="odd">
                  Odd
                </option>

                <option value="even">
                  Even
                </option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Department
              </label>

              <input
                type="text"
                value={
                  editForm.department
                }
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

        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">
            Timeline
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DateTimeField
              label="Submission Start"
              value={
                editForm.submissionStart
              }
              onChange={(value) =>
                updateEditField(
                  'submissionStart',
                  value
                )
              }
            />

            <DateTimeField
              label="Submission End"
              value={
                editForm.submissionEnd
              }
              onChange={(value) =>
                updateEditField(
                  'submissionEnd',
                  value
                )
              }
            />

            <DateTimeField
              label="Review Start"
              value={
                editForm.reviewStart
              }
              onChange={(value) =>
                updateEditField(
                  'reviewStart',
                  value
                )
              }
            />

            <DateTimeField
              label="Review End"
              value={
                editForm.reviewEnd
              }
              onChange={(value) =>
                updateEditField(
                  'reviewEnd',
                  value
                )
              }
            />

            <DateTimeField
              label="Decision Deadline"
              value={
                editForm.decisionDeadline
              }
              onChange={(value) =>
                updateEditField(
                  'decisionDeadline',
                  value
                )
              }
            />

            <DateTimeField
              label="Selection Start"
              value={
                editForm.selectionStart
              }
              onChange={(value) =>
                updateEditField(
                  'selectionStart',
                  value
                )
              }
            />

            <DateTimeField
              label="Selection End"
              value={
                editForm.selectionEnd
              }
              onChange={(value) =>
                updateEditField(
                  'selectionEnd',
                  value
                )
              }
            />
           <DateTimeField
              label="Idea Submission Start"
              value={
                editForm.ideaSubmissionStart
              }
              onChange={(value) =>
                updateEditField(
                  'ideaSubmissionStart',
                  value
                )
              }
            />

            <DateTimeField
              label="Idea Submission End"
              value={
                editForm.ideaSubmissionEnd
              }
              onChange={(value) =>
                updateEditField(
                  'ideaSubmissionEnd',
                  value
                )
              }
            />
            <DateTimeField
              label="Team Freeze"
              value={
                editForm.teamFreezeDate
              }
              onChange={(value) =>
                updateEditField(
                  'teamFreezeDate',
                  value
                )
              }
            />
          </div>
        </div>

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

            {saving
              ? 'Saving...'
              : 'Save Changes'}
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
            onClick={() =>
              navigate('/pools')
            }
            className="text-sm text-blue-600 hover:text-blue-800 mb-1"
          >
            ← Back to Pools
          </button>

          <h1 className="text-2xl font-bold">
            {pool.name}
          </h1>

          <p className="text-gray-500">
            {pool.academicYear} •{' '}
            {pool.semester}
            {pool.department
              ? ` • ${pool.department}`
              : ''}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* EDIT */}
          {isAdmin &&
            pool.status === 'DRAFT' && (
              <button
                onClick={startEditing}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
            )}

          {/* ACTIVATE */}
          {isAdmin &&
            pool.status === 'DRAFT' && (
              <button
                onClick={() =>
                  setConfirm({
                    action: 'activate',
                    title:
                      'Activate Pool?',
                    msg:
                      'This will open submissions for faculty.',
                  })
                }
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Play className="w-4 h-4" />
                Activate
              </button>
            )}

          {/* ARCHIVE */}
          {isAdmin &&
            pool.status === 'DRAFT' && (
              <button
                onClick={() =>
                  setConfirm({
                    action: 'archive',
                    title:
                      'Archive Pool?',
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

          {/* ADVANCE */}
          {isAdmin &&
            ![
              'DRAFT',
              'FROZEN',
              'ARCHIVED',
            ].includes(
              pool.status
            ) && (
              <button
                onClick={() =>
                  setConfirm({
                    action: 'advance',
                    title:
                      'Advance Phase?',
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
            ![
              'DRAFT',
              'FROZEN',
              'ARCHIVED',
            ].includes(
              pool.status
            ) && (
              <button
                onClick={() =>
                  setConfirm({
                    action: 'freeze',
                    title:
                      'Freeze Pool?',
                    msg:
                      'All teams will be frozen.',
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
              : t.charAt(0).toUpperCase() +
                t.slice(1)}
          </button>
        ))}
      </div>

      {/* =====================================================
          OVERVIEW
          ===================================================== */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Timeline */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4">
              Timeline
            </h3>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                [
                  'Submission (Faculty)',
                  pool.submissionStart,
                  pool.submissionEnd,
                ],
                [
                  'Review (Subadmin)',
                  pool.reviewStart,
                  pool.reviewEnd,
                ],
                [
                  'Decision Deadline (Admin)',
                  pool.decisionDeadline,
                  '',
                ],
                [
                  'Selection (Students)',
                  pool.selectionStart,
                  pool.selectionEnd,
                ],
                [
                  'Idea Submission (Students)',
                  pool.ideaSubmissionStart,
                  pool.ideaSubmissionEnd,
                ],
                [
                  'Team Freeze (Students)',
                  pool.teamFreezeDate,
                  '',
                ],
              ].map(
                ([l, s, e]) => (
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
                )
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {isAdmin &&
                projects.filter(
                  (p) =>
                    p.status ===
                    'LOCKED'
                ).length > 0 && (
                  <button
                    onClick={() =>
                      setConfirm({
                        action:
                          'approveAllLocked',
                        title:
                          'Approve All Locked?',
                        msg: `This will approve ${
                          projects.filter(
                            (p) =>
                              p.status ===
                              'LOCKED'
                          ).length
                        } locked projects.`,
                      })
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <CheckCircle2 className="w-4 h-4" />

                    Approve All Locked (
                    {
                      projects.filter(
                        (p) =>
                          p.status ===
                          'LOCKED'
                      ).length
                    }
                    )
                  </button>
                )}

              {isAdmin && (
                <button
                  onClick={() =>
                    setConfirm({
                      action:
                        'reorganizeCodes',
                      title:
                        'Reorganize Project Codes?',
                      msg:
                        'This will reorganize all unlocked approved project codes according to the current allocation order. Locked project codes will not be changed. Continue?',
                    })
                  }
                  disabled={
                    reorganizingCodes
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${
                      reorganizingCodes
                        ? 'animate-spin'
                        : ''
                    }`}
                  />

                  {reorganizingCodes
                    ? 'Reorganizing...'
                    : 'Reorganize Project Codes'}
                </button>
              )}
            </div>
          </div>

          {/* =================================================
              POOL ASSIGNMENT MANAGEMENT
              ================================================= */}
          {isAdmin && (
            <div className="bg-white rounded-xl border overflow-hidden">
              {/* Management Header */}
              <div className="p-6 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />

                      <h3 className="font-semibold text-gray-900">
                        Pool Assignment Management
                      </h3>
                    </div>

                    <p className="text-sm text-gray-500 mt-1">
                      Manage Faculty and pool-level SubAdmin assignments.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* =================================================
                    SUBADMIN SECTION
                    ================================================= */}
                <div className="border rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-purple-600" />

                      <div>
                        <h4 className="font-semibold text-gray-900">
                          Pool SubAdmins
                        </h4>

                        <p className="text-xs text-gray-500">
                          {assignedSubadmins.length}{' '}
                          assigned
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={
                        openAddSubadmin
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      <Plus className="w-4 h-4" />
                      Add SubAdmin
                    </button>
                  </div>

                  <div className="p-4">
                    {assignedSubadmins.length ===
                    0 ? (
                      <div className="text-center py-8 text-sm text-gray-500">
                        <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-gray-300" />

                        <p>
                          No SubAdmin assigned
                        </p>

                        <p className="text-xs mt-1">
                          Add a SubAdmin to manage this pool.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {assignedSubadmins.map(
                          (assignment) => {
                            const subadmin =
                              assignment.subadmin;

                            const alsoFaculty =
                              assignedFacultyIds.has(
                                subadmin.id
                              );

                            return (
                              <div
                                key={
                                  subadmin.id
                                }
                                className="flex items-center justify-between p-3 border rounded-lg"
                              >
                                <div className="min-w-0">
                                  <p className="font-medium text-sm text-gray-900">
                                    {
                                      subadmin.firstName
                                    }{' '}
                                    {
                                      subadmin.lastName
                                    }
                                  </p>

                                  <p className="text-xs text-gray-500 truncate">
                                    {
                                      subadmin.email
                                    }
                                  </p>

                                  <div className="flex gap-1.5 mt-1.5">
                                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                                      SubAdmin
                                    </span>

                                    {alsoFaculty && (
                                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                        Faculty
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <button
                                  onClick={() =>
                                    removeSubadmin(
                                      subadmin.id
                                    )
                                  }
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                                  title="Remove SubAdmin capability"
                                >
                                  <UserMinus className="w-3.5 h-3.5" />
                                  Remove
                                </button>
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* =================================================
                    FACULTY SECTION
                    ================================================= */}
                <div className="border rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />

                      <div>
                        <h4 className="font-semibold text-gray-900">
                          Pool Faculty
                        </h4>

                        <p className="text-xs text-gray-500">
                          {assignedFaculty.length}{' '}
                          assigned
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={
                        openAddFaculty
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                      Add Faculty
                    </button>
                  </div>

                  <div className="p-4">
                    {assignedFaculty.length ===
                    0 ? (
                      <div className="text-center py-8 text-sm text-gray-500">
                        <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />

                        <p>
                          No Faculty assigned
                        </p>

                        <p className="text-xs mt-1">
                          Add Faculty to this pool.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {assignedFaculty.map(
                          (assignment) => {
                            const faculty =
                              assignment.faculty;

                            const alsoSubadmin =
                              assignedSubadminIds.has(
                                faculty.id
                              );

                            return (
                              <div
                                key={
                                  faculty.id
                                }
                                className="flex items-center justify-between p-3 border rounded-lg"
                              >
                                <div className="min-w-0">
                                  <p className="font-medium text-sm text-gray-900">
                                    {
                                      faculty.firstName
                                    }{' '}
                                    {
                                      faculty.lastName
                                    }
                                  </p>

                                  <p className="text-xs text-gray-500 truncate">
                                    {
                                      faculty.email
                                    }
                                  </p>

                                  <div className="flex gap-1.5 mt-1.5">
                                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                      Faculty
                                    </span>

                                    {alsoSubadmin && (
                                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                                        SubAdmin
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <button
                                  onClick={() =>
                                    removeFaculty(
                                      faculty.id
                                    )
                                  }
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                                  title="Remove Faculty assignment"
                                >
                                  <UserMinus className="w-3.5 h-3.5" />
                                  Remove
                                </button>
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================
              ADD FACULTY MODAL
              ================================================= */}
          {showAddFaculty && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-lg bg-white rounded-xl shadow-xl">
                <div className="flex items-center justify-between p-5 border-b">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Add Faculty
                    </h3>

                    <p className="text-xs text-gray-500 mt-1">
                      Select an active Faculty member for this pool.
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      setShowAddFaculty(false)
                    }
                    className="p-1.5 rounded-lg hover:bg-gray-100"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="p-5">
                  {loadingCandidates ? (
                    <div className="py-8">
                      <LoadingSpinner />
                    </div>
                  ) : (
                    <>
                      <label className="text-sm font-medium text-gray-700">
                        Faculty
                      </label>

                      <select
                        value={
                          selectedFacultyId
                        }
                        onChange={(e) =>
                          setSelectedFacultyId(
                            e.target.value
                          )
                        }
                        className="w-full mt-2 px-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">
                          Select Faculty
                        </option>

                        {facultyCandidates
                          .filter(
                            (candidate) =>
                              !assignedFacultyIds.has(
                                candidate.id
                              )
                          )
                          .map(
                            (candidate) => (
                              <option
                                key={
                                  candidate.id
                                }
                                value={
                                  candidate.id
                                }
                              >
                                {
                                  candidate.firstName
                                }{' '}
                                {
                                  candidate.lastName
                                }{' '}
                                —{' '}
                                {candidate.facultyId ||
                                  candidate.email}
                              </option>
                            )
                          )}
                      </select>

                      {facultyCandidates.filter(
                        (candidate) =>
                          !assignedFacultyIds.has(
                            candidate.id
                          )
                      ).length === 0 && (
                        <p className="text-xs text-gray-500 mt-2">
                          All active Faculty members are already assigned to this pool.
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div className="flex justify-end gap-3 p-5 border-t">
                  <button
                    type="button"
                    onClick={() =>
                      setShowAddFaculty(false)
                    }
                    disabled={
                      assignmentLoading
                    }
                    className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={addFaculty}
                    disabled={
                      assignmentLoading ||
                      loadingCandidates ||
                      !selectedFacultyId
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-300"
                  >
                    <UserPlus className="w-4 h-4" />

                    {assignmentLoading
                      ? 'Adding...'
                      : 'Add Faculty'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =================================================
              ADD SUBADMIN MODAL
              ================================================= */}
          {showAddSubadmin && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-lg bg-white rounded-xl shadow-xl">
                <div className="flex items-center justify-between p-5 border-b">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Add SubAdmin
                    </h3>

                    <p className="text-xs text-gray-500 mt-1">
                      Select an active SubAdmin or Faculty member.
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      setShowAddSubadmin(false)
                    }
                    className="p-1.5 rounded-lg hover:bg-gray-100"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="p-5">
                  {loadingCandidates ? (
                    <div className="py-8">
                      <LoadingSpinner />
                    </div>
                  ) : (
                    <>
                      <label className="text-sm font-medium text-gray-700">
                        SubAdmin
                      </label>

                      <select
                        value={
                          selectedSubadminId
                        }
                        onChange={(e) =>
                          setSelectedSubadminId(
                            e.target.value
                          )
                        }
                        className="w-full mt-2 px-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">
                          Select SubAdmin
                        </option>

                        {subadminCandidates
                          .filter(
                            (candidate) =>
                              !assignedSubadminIds.has(
                                candidate.id
                              )
                          )
                          .map(
                            (candidate) => (
                              <option
                                key={
                                  candidate.id
                                }
                                value={
                                  candidate.id
                                }
                              >
                                {
                                  candidate.firstName
                                }{' '}
                                {
                                  candidate.lastName
                                }{' '}
                                —{' '}
                                {candidate.facultyId ||
                                  candidate.email}
                                {candidate.role ===
                                'SUBADMIN'
                                  ? ' (Global SubAdmin)'
                                  : ' (Faculty)'}
                              </option>
                            )
                          )}
                      </select>

                      {subadminCandidates.filter(
                        (candidate) =>
                          !assignedSubadminIds.has(
                            candidate.id
                          )
                      ).length === 0 && (
                        <p className="text-xs text-gray-500 mt-2">
                          All eligible SubAdmin/Faculty users are already assigned.
                        </p>
                      )}

                      <div className="mt-3 p-3 bg-purple-50 border border-purple-100 rounded-lg">
                        <p className="text-xs text-purple-800">
                          A Faculty member assigned here remains a Faculty user globally. This assignment only gives them SubAdmin capability for this pool.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-end gap-3 p-5 border-t">
                  <button
                    type="button"
                    onClick={() =>
                      setShowAddSubadmin(false)
                    }
                    disabled={
                      assignmentLoading
                    }
                    className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={addSubadmin}
                    disabled={
                      assignmentLoading ||
                      loadingCandidates ||
                      !selectedSubadminId
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:bg-gray-300"
                  >
                    <ShieldCheck className="w-4 h-4" />

                    {assignmentLoading
                      ? 'Adding...'
                      : 'Add SubAdmin'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          PROJECTS
          ===================================================== */}
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

                  {p.projectCode && (
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {p.projectCode}
                    </p>
                  )}

                  <p className="text-sm text-gray-500">
                    {p.domain ||
                      'General'}{' '}
                    •{' '}
                    {
                      p.faculty
                        ?.firstName
                    }{' '}
                    {
                      p.faculty
                        ?.lastName
                    }
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Badge
                    text={p.status}
                  />

                  {p.team && (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      Team:{' '}
                      {p.team.name ||
                        'Assigned'}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* =====================================================
          HELD PROJECTS
          ===================================================== */}
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
                    By:{' '}
                    {
                      p.faculty
                        ?.firstName
                    }{' '}
                    {
                      p.faculty
                        ?.lastName
                    }
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
                    decideProject(
                      p.id,
                      'approve'
                    )
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve
                </button>

                <button
                  onClick={() =>
                    decideProject(
                      p.id,
                      'reject'
                    )
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

      {/* =====================================================
          CONFIRMATION DIALOG
          ===================================================== */}
      {confirm && (
        <ConfirmDialog
          open
          title={confirm.title}
          message={confirm.msg}
          onConfirm={() =>
            doAction(confirm.action)
          }
          onCancel={() =>
            setConfirm(null)
          }
        />
      )}
    </div>
  );
};

/*
 * ---------------------------------------------------------
 * REUSABLE DATETIME FIELD
 * ---------------------------------------------------------
 */

const DateTimeField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
}> = ({
  label,
  value,
  onChange,
}) => {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">
        {label} *
      </label>

      <input
        type="datetime-local"
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        required
        className="w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
};

export default PoolDetailPage;