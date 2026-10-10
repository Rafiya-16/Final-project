// frontend/src/pages/student/MyTeamPage.tsx

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  UserPlus,
  LogOut,
  Trash2,
  Mail,
  CheckCircle2,
  XCircle,
  Users,
  Crown,
  Shield,
  Sparkles,
  X,
  Send,
  BookOpen,
  Target,
  Rocket,
  Clock3,
} from 'lucide-react';

import { teamService } from '@/services/teamService';
import poolService from '@/services/poolService';
import { userService } from '@/services/userService';
import { useAuthStore } from '@/stores/authStore';

type AnyRecord = Record<string, any>;

type TeamMember = {
  id?: string;
  studentId?: string;
  userId?: string;
  name?: string;
  fullName?: string;
  email?: string;
  role?: string;
  status?: string;
  joinedAt?: string;
  leftAt?: string;
  student?: AnyRecord;
  user?: AnyRecord;
};

type TeamInvite = {
  id: string;
  teamId?: string;
  studentId?: string;
  status?: string;
  message?: string;
  expiresAt?: string;
  createdAt?: string;
  team?: AnyRecord;
};

type Team = {
  id: string;
  name: string;
  poolId: string;
  leaderId?: string;
  projectId?: string | null;
  isFrozen?: boolean;
  status?: string;
  members?: TeamMember[];
  project?: AnyRecord;
  leaveRequests?: AnyRecord[];
  dissolveRequests?: AnyRecord[];
};

type Pool = {
  id: string;
  name?: string;
  title?: string;
  status?: string;
  defaultMaxTeamSize?: number;
};

type StudentOption = {
  id: string;
  name?: string;
  fullName?: string;
  email?: string;
  section?: string | null;
  enrollmentNumber?: string;
  rollNumber?: string;
};

type ConfirmState = {
  type: 'remove';
  id?: string;
  name?: string;
} | null;

type RequestStatus =
  | 'NONE'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

const getStudentName = (
  student: AnyRecord | undefined
): string => {
  if (!student) return 'Student';

  return (
    student.fullName ||
    student.name ||
    `${student.firstName || ''} ${
      student.lastName || ''
    }`.trim() ||
    student.email ||
    'Student'
  );
};

const getMemberName = (
  member: TeamMember
): string => {
  if (member.student) {
    return getStudentName(member.student);
  }

  if (member.user) {
    return getStudentName(member.user);
  }

  return (
    member.fullName ||
    member.name ||
    member.email ||
    'Student'
  );
};

const getMemberId = (
  member: TeamMember
): string | undefined =>
  member.studentId || member.userId;

const isActiveMember = (
  member: TeamMember
): boolean =>
  !member.status ||
  member.status === 'ACTIVE';

const getPoolName = (
  pool: Pool | null
): string =>
  pool?.name ||
  pool?.title ||
  'Current Pool';

const getErrorMessage = (
  error: any,
  fallback: string
): string => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
};

const MyTeamPage: React.FC = () => {
  const { user } = useAuthStore();

  const [pool, setPool] =
    useState<Pool | null>(null);

  const [team, setTeam] =
    useState<Team | null>(null);

  const [invites, setInvites] =
    useState<TeamInvite[]>([]);

  const [students, setStudents] =
    useState<StudentOption[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [studentsLoading, setStudentsLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [showInviteModal, setShowInviteModal] =
    useState(false);

  const [showLeaveModal, setShowLeaveModal] =
    useState(false);

  const [showDissolveModal, setShowDissolveModal] =
    useState(false);

  const [teamName, setTeamName] =
    useState('');

  const [inviteSearch, setInviteSearch] =
    useState('');

  const [leaveReason, setLeaveReason] =
    useState('');

  const [dissolveReason, setDissolveReason] =
    useState('');

  const [leaveRequestStatus, setLeaveRequestStatus] =
    useState<RequestStatus>('NONE');

  const [leaveResponseNote, setLeaveResponseNote] =
    useState('');

  const [
    dissolveRequestStatus,
    setDissolveRequestStatus,
  ] = useState<RequestStatus>('NONE');

  const [
    dissolveResponseNote,
    setDissolveResponseNote,
  ] = useState('');

  const [confirmState, setConfirmState] =
    useState<ConfirmState>(null);

  const [toast, setToast] =
    useState<{
      type: 'success' | 'error' | 'info';
      message: string;
    } | null>(null);

  const showToast = useCallback(
    (
      type: 'success' | 'error' | 'info',
      message: string
    ) => {
      setToast({
        type,
        message,
      });

      window.setTimeout(() => {
        setToast(null);
      }, 3500);
    },
    []
  );

  const loadPool = useCallback(
    async (): Promise<Pool | null> => {
      try {
        const result =
          await poolService.list();

        const pools: Pool[] =
          Array.isArray(result)
            ? result
            : Array.isArray(result?.data)
            ? result.data
            : Array.isArray(result?.pools)
            ? result.pools
            : [];

        if (!pools.length) {
          setPool(null);
          return null;
        }

        const preferred =
          pools.find(
            (item) =>
              item.status ===
              'TEAMS_FORMING'
          ) ||
          pools.find(
            (item) =>
              item.status ===
              'SELECTION_OPEN'
          ) ||
          pools.find(
            (item) =>
              item.status ===
                'SUBMISSION_OPEN' ||
              item.status ===
                'UNDER_REVIEW'
          ) ||
          pools[0];

        setPool(preferred);

        return preferred;
      } catch (error) {
        showToast(
          'error',
          getErrorMessage(
            error,
            'Unable to load active pool.'
          )
        );

        return null;
      }
    },
    [showToast]
  );

  const load = useCallback(
    async (poolId: string) => {
      setLoading(true);

      try {
        const [
          teamResult,
          inviteResult,
        ] = await Promise.all([
          teamService
            .getMyTeam(poolId)
            .catch(() => null),

          teamService
            .getMyInvites(poolId)
            .catch(() => []),
        ]);

        const loadedTeam: Team | null =
          teamResult?.data ||
          teamResult?.team ||
          teamResult ||
          null;

        setTeam(loadedTeam);

        const loadedInvites: TeamInvite[] =
          Array.isArray(inviteResult)
            ? inviteResult
            : Array.isArray(
                inviteResult?.data
              )
            ? inviteResult.data
            : Array.isArray(
                inviteResult?.invites
              )
            ? inviteResult.invites
            : [];

        setInvites(loadedInvites);

        /*
         * ======================================================
         * LEAVE REQUEST STATUS
         * ======================================================
         */

        const leaveRequests =
          Array.isArray(
            loadedTeam?.leaveRequests
          )
            ? loadedTeam.leaveRequests
            : [];

        const ownLeaveRequest =
          leaveRequests
            .filter(
              (request: AnyRecord) => {
                const requesterId =
                  request.studentId ||
                  request.requestedById ||
                  request.requestedBy?.id;

                return (
                  !requesterId ||
                  requesterId === user?.id
                );
              }
            )
            .sort(
              (
                a: AnyRecord,
                b: AnyRecord
              ) =>
                new Date(
                  b.createdAt || 0
                ).getTime() -
                new Date(
                  a.createdAt || 0
                ).getTime()
            )[0];

        if (ownLeaveRequest?.status) {
          setLeaveRequestStatus(
            ownLeaveRequest.status
          );

          setLeaveResponseNote(
            ownLeaveRequest.responseNote ||
              ''
          );
        } else {
          setLeaveRequestStatus('NONE');
          setLeaveResponseNote('');
        }

        /*
         * ======================================================
         * DISSOLVE REQUEST STATUS
         * ======================================================
         */

        const dissolveRequests =
          Array.isArray(
            loadedTeam?.dissolveRequests
          )
            ? loadedTeam.dissolveRequests
            : [];

        /*
         * Only update the dissolve state if backend
         * actually returned the relation.
         *
         * This is important because an older getMyTeam()
         * response may not include dissolveRequests yet.
         */
        if (dissolveRequests.length > 0) {
          const ownDissolveRequest =
            dissolveRequests
              .filter(
                (request: AnyRecord) => {
                  const requesterId =
                    request.requestedById ||
                    request.requestedBy?.id ||
                    request.studentId;

                  return (
                    !requesterId ||
                    requesterId === user?.id
                  );
                }
              )
              .sort(
                (
                  a: AnyRecord,
                  b: AnyRecord
                ) =>
                  new Date(
                    b.createdAt || 0
                  ).getTime() -
                  new Date(
                    a.createdAt || 0
                  ).getTime()
              )[0];

          if (
            ownDissolveRequest?.status
          ) {
            setDissolveRequestStatus(
              ownDissolveRequest.status
            );

            setDissolveResponseNote(
              ownDissolveRequest.responseNote ||
                ''
            );
          } else {
            setDissolveRequestStatus(
              'NONE'
            );

            setDissolveResponseNote('');
          }
        }
      } catch (error) {
        setTeam(null);
        setInvites([]);

        showToast(
          'error',
          getErrorMessage(
            error,
            'Unable to load your team.'
          )
        );
      } finally {
        setLoading(false);
      }
    },
    [showToast, user?.id]
  );

  useEffect(() => {
    const initialize =
      async () => {
        const currentPool =
          await loadPool();

        if (currentPool?.id) {
          await load(
            currentPool.id
          );
        } else {
          setLoading(false);
        }
      };

    initialize();
  }, [loadPool, load]);

  const currentMember = useMemo(() => {
    if (
      !team?.members ||
      !user?.id
    ) {
      return undefined;
    }

    return team.members.find(
      (member) =>
        member.studentId ===
          user.id ||
        member.userId === user.id
    );
  }, [team?.members, user?.id]);

  const activeCurrentMember =
    useMemo(() => {
      if (
        !team?.members ||
        !user?.id
      ) {
        return undefined;
      }

      return team.members.find(
        (member) =>
          (
            member.studentId ===
              user.id ||
            member.userId ===
              user.id
          ) &&
          isActiveMember(member)
      );
    }, [team?.members, user?.id]);

  const activeMembers = useMemo(
    () =>
      (team?.members || []).filter(
        (member) =>
          isActiveMember(member)
      ),
    [team?.members]
  );

  const leftMembers = useMemo(
    () =>
      (team?.members || []).filter(
        (member) =>
          !isActiveMember(member)
      ),
    [team?.members]
  );

  const isLeader =
    Boolean(user?.id) &&
    Boolean(team) &&
    (
      team?.leaderId ===
        user?.id ||
      currentMember?.role ===
        'LEADER'
    );

  const isMember =
    Boolean(activeCurrentMember);

  const hasSelectedProject =
    Boolean(team?.projectId) ||
    Boolean(team?.project?.id);

  const canRequestLeave =
    Boolean(team) &&
    isMember &&
    !isLeader &&
    hasSelectedProject &&
    !team?.isFrozen &&
    leaveRequestStatus !==
      'PENDING';

  const canRequestDissolve =
    Boolean(team) &&
    isLeader &&
    !team?.isFrozen &&
    team?.status !==
      'DISSOLVED' &&
    dissolveRequestStatus !==
      'PENDING';

  const maxTeamSize = useMemo(() => {
    const projectMax =
      Number(
        team?.project?.maxTeamSize
      ) || 0;

    const poolMax =
      Number(
        pool?.defaultMaxTeamSize
      ) || 0;

    return (
      projectMax ||
      poolMax ||
      3
    );
  }, [
    team?.project?.maxTeamSize,
    pool?.defaultMaxTeamSize,
  ]);

  const memberCount =
    activeMembers.length;

  const freeSlots =
    Math.max(
      0,
      maxTeamSize -
        memberCount
    );

  const projectTitle =
    team?.project?.title ||
    team?.project?.name ||
    'Project not selected yet';

  const currentSection =
    useMemo(() => {
      const currentUser =
        user as
          | AnyRecord
          | undefined;

      return (
        currentUser?.section ||
        currentUser?.student
          ?.section ||
        currentUser?.profile
          ?.section ||
        null
      );
    }, [user]);

  const loadStudents =
    useCallback(async () => {
      if (
        !pool?.id ||
        !team
      ) {
        return;
      }

      if (
        memberCount >=
        maxTeamSize
      ) {
        showToast(
          'info',
          'Your team is already full. Wait for a member to leave or remove an active member first.'
        );

        return;
      }

      if (!currentSection) {
        showToast(
          'error',
          'Your account does not have a section assigned. Please ask the admin to assign your section.'
        );

        return;
      }

      setStudentsLoading(true);

      try {
        const result =
          await userService.list({
            role: 'STUDENT',
          });

        const rawStudents: AnyRecord[] =
          Array.isArray(result)
            ? result
            : Array.isArray(
                result?.data
              )
            ? result.data
            : Array.isArray(
                result?.users
              )
            ? result.users
            : [];

        /*
         * IMPORTANT:
         * Only ACTIVE members occupy team slots.
         *
         * LEFT members are intentionally not
         * included in this set, so a previously
         * left student can be invited again.
         */
        const existingStudentIds =
          new Set(
            (team.members || [])
              .filter(
                (member) =>
                  isActiveMember(member)
              )
              .map(
                (member) =>
                  getMemberId(member)
              )
              .filter(Boolean)
          );

        const currentUserId =
          user?.id;

        const availableStudents:
          StudentOption[] =
          rawStudents
            .map(
              (student) => ({
                id: student.id,
                name: student.name,
                fullName:
                  student.fullName,
                email:
                  student.email,
                section:
                  student.section ||
                  student.profile
                    ?.section ||
                  student.student
                    ?.section ||
                  null,
                enrollmentNumber:
                  student.enrollmentNumber ||
                  student.student
                    ?.enrollmentNumber,
                rollNumber:
                  student.rollNumber ||
                  student.student
                    ?.rollNumber,
              })
            )
            .filter(
              (student) =>
                Boolean(student.id)
            )
            .filter(
              (student) =>
                student.id !==
                currentUserId
            )
            .filter(
              (student) =>
                !existingStudentIds.has(
                  student.id
                )
            )
            .filter(
              (student) =>
                student.section ===
                currentSection
            );

        setStudents(
          availableStudents
        );

        setInviteSearch('');
        setShowInviteModal(
          true
        );
      } catch (error) {
        showToast(
          'error',
          getErrorMessage(
            error,
            'Unable to load students for invitation.'
          )
        );
      } finally {
        setStudentsLoading(
          false
        );
      }
    }, [
      currentSection,
      maxTeamSize,
      memberCount,
      pool?.id,
      showToast,
      team,
      user?.id,
    ]);

  const filteredStudents =
    useMemo(() => {
      const search =
        inviteSearch
          .trim()
          .toLowerCase();

      if (!search) {
        return students;
      }

      return students.filter(
        (student) => {
          const name = (
            student.fullName ||
            student.name ||
            ''
          ).toLowerCase();

          const email = (
            student.email ||
            ''
          ).toLowerCase();

          const enrollment = (
            student.enrollmentNumber ||
            ''
          ).toLowerCase();

          const roll = (
            student.rollNumber ||
            ''
          ).toLowerCase();

          return (
            name.includes(search) ||
            email.includes(search) ||
            enrollment.includes(search) ||
            roll.includes(search)
          );
        }
      );
    }, [
      inviteSearch,
      students,
    ]);

  const createTeam =
    async () => {
      if (!pool?.id) {
        return;
      }

      const name =
        teamName.trim();

      if (!name) {
        showToast(
          'error',
          'Please enter a team name.'
        );

        return;
      }

      if (name.length < 3) {
        showToast(
          'error',
          'Team name must contain at least 3 characters.'
        );

        return;
      }

      setSaving(true);

      try {
        await teamService.create(
          pool.id,
          name
        );

        setTeamName('');
        setShowCreateModal(
          false
        );

        showToast(
          'success',
          'Team created successfully.'
        );

        await load(
          pool.id
        );
      } catch (error) {
        showToast(
          'error',
          getErrorMessage(
            error,
            'Unable to create team.'
          )
        );
      } finally {
        setSaving(false);
      }
    };

  const sendInvite =
    async (
      studentId: string
    ) => {
      if (
        !pool?.id ||
        !team
      ) {
        return;
      }

      if (!isLeader) {
        showToast(
          'error',
          'Only the team leader can invite students.'
        );

        return;
      }

      if (
        memberCount >=
        maxTeamSize
      ) {
        showToast(
          'error',
          'Your team is already full.'
        );

        return;
      }

      setSaving(true);

      try {
        await teamService.invite(
          pool.id,
          team.id,
          studentId,
          `You are invited to join ${team.name}.`
        );

        showToast(
          'success',
          'Invitation sent successfully.'
        );

        setShowInviteModal(
          false
        );

        setInviteSearch('');

        await load(
          pool.id
        );
      } catch (error) {
        showToast(
          'error',
          getErrorMessage(
            error,
            'Unable to send invitation.'
          )
        );
      } finally {
        setSaving(false);
      }
    };

  const respondToInvite =
    async (
      inviteId: string,
      accept: boolean
    ) => {
      if (!pool?.id) {
        return;
      }

      setSaving(true);

      try {
        await teamService.respond(
          pool.id,
          inviteId,
          accept
        );

        showToast(
          accept
            ? 'success'
            : 'info',
          accept
            ? 'Invitation accepted. You have joined the team.'
            : 'Invitation declined.'
        );

        await load(
          pool.id
        );
      } catch (error) {
        showToast(
          'error',
          getErrorMessage(
            error,
            'Unable to respond to invitation.'
          )
        );
      } finally {
        setSaving(false);
      }
    };

  const removeMember =
    async (
      studentId: string
    ) => {
      if (
        !pool?.id ||
        !team
      ) {
        return;
      }

      if (!isLeader) {
        showToast(
          'error',
          'Only the team leader can remove members.'
        );

        return;
      }

      setSaving(true);

      try {
        await teamService.removeMember(
          pool.id,
          team.id,
          studentId
        );

        showToast(
          'success',
          'Member removed from the team.'
        );

        setConfirmState(
          null
        );

        await load(
          pool.id
        );
      } catch (error) {
        showToast(
          'error',
          getErrorMessage(
            error,
            'Unable to remove member.'
          )
        );
      } finally {
        setSaving(false);
      }
    };

  /*
   * ============================================================
   * DISSOLVE TEAM REQUEST
   * ============================================================
   *
   * IMPORTANT:
   * This NEVER calls teamService.dissolve().
   *
   * It creates a supervisor approval request.
   */
  const submitDissolveRequest =
    async () => {
      if (
        !pool?.id ||
        !team
      ) {
        return;
      }

      const reason =
        dissolveReason.trim();

      if (reason.length < 10) {
        showToast(
          'error',
          'Please provide a reason of at least 10 characters.'
        );

        return;
      }

      if (reason.length > 1000) {
        showToast(
          'error',
          'Reason cannot exceed 1000 characters.'
        );

        return;
      }

      if (!isLeader) {
        showToast(
          'error',
          'Only the team leader can request team dissolution.'
        );

        return;
      }

      if (team.isFrozen) {
        showToast(
          'error',
          'A frozen team cannot be dissolved.'
        );

        return;
      }

      if (
        team.status ===
        'DISSOLVED'
      ) {
        showToast(
          'info',
          'This team has already been dissolved.'
        );

        return;
      }

      if (
        dissolveRequestStatus ===
        'PENDING'
      ) {
        showToast(
          'info',
          'A dissolve request is already pending.'
        );

        return;
      }

      setSaving(true);

      try {
        /*
         * New approval endpoint.
         *
         * Backend:
         * POST /pools/:poolId/teams/:teamId/dissolve-request
         */
        await teamService.createDissolveRequest(
          pool.id,
          team.id,
          reason
        );

        /*
         * Keep pending status visible immediately,
         * even before getMyTeam() returns the request.
         */
        setDissolveRequestStatus(
          'PENDING'
        );

        setDissolveResponseNote(
          ''
        );

        setDissolveReason('');

        setShowDissolveModal(
          false
        );

        showToast(
          'success',
          'Dissolve request sent to your supervisor for approval.'
        );

        await load(
          pool.id
        );
      } catch (error) {
        showToast(
          'error',
          getErrorMessage(
            error,
            'Unable to submit dissolve request.'
          )
        );
      } finally {
        setSaving(false);
      }
    };

  const submitLeaveRequest =
    async () => {
      if (
        !pool?.id ||
        !team
      ) {
        return;
      }

      const reason =
        leaveReason.trim();

      if (reason.length < 10) {
        showToast(
          'error',
          'Please provide a reason of at least 10 characters.'
        );

        return;
      }

      if (reason.length > 1000) {
        showToast(
          'error',
          'Reason cannot exceed 1000 characters.'
        );

        return;
      }

      if (!canRequestLeave) {
        showToast(
          'error',
          'You cannot submit a leave request at this stage.'
        );

        return;
      }

      setSaving(true);

      try {
        await teamService.createLeaveRequest(
          pool.id,
          team.id,
          reason
        );

        setLeaveRequestStatus(
          'PENDING'
        );

        setLeaveResponseNote(
          ''
        );

        setLeaveReason('');

        setShowLeaveModal(
          false
        );

        showToast(
          'success',
          'Leave request submitted to your supervisor.'
        );

        await load(
          pool.id
        );
      } catch (error) {
        showToast(
          'error',
          getErrorMessage(
            error,
            'Unable to submit leave request.'
          )
        );
      } finally {
        setSaving(false);
      }
    };

  const handleConfirmRemove =
    async () => {
      if (
        !confirmState ||
        !confirmState.id
      ) {
        return;
      }

      await removeMember(
        confirmState.id
      );
    };

  const refreshTeam =
    async () => {
      if (!pool?.id) {
        return;
      }

      await load(
        pool.id
      );
    };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-14 w-14 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin dark:border-slate-700" />

            <Sparkles className="absolute inset-0 m-auto h-5 w-5 animate-pulse text-blue-500" />
          </div>

          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Loading your team...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* =====================================================
            TOAST
        ====================================================== */}

        {toast && (
          <div
            className={`fixed right-5 top-5 z-[100] flex max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl ${
              toast.type === 'success'
                ? 'border-emerald-200 bg-emerald-50/95 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/95 dark:text-emerald-200'
                : toast.type === 'error'
                ? 'border-red-200 bg-red-50/95 text-red-800 dark:border-red-800 dark:bg-red-950/95 dark:text-red-200'
                : 'border-blue-200 bg-blue-50/95 text-blue-800 dark:border-blue-800 dark:bg-blue-950/95 dark:text-blue-200'
            }`}
          >
            {toast.type ===
            'success' ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            ) : toast.type ===
              'error' ? (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0" />
            )}

            <p className="text-sm font-medium leading-5">
              {toast.message}
            </p>

            <button
              type="button"
              onClick={() =>
                setToast(null)
              }
              className="ml-2 rounded-lg p-1 hover:bg-black/5 dark:hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-blue-50/70 to-pink-50/70 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-400/20 blur-3xl" />

          <div className="absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-pink-400/20 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="rounded-xl bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                  <Users className="h-5 w-5" />
                </div>

                <span className="text-sm font-semibold text-blue-600 dark:text-blue-300">
                  Student Team Management
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-3xl">
                My Team
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Create your project team, invite classmates, manage
                membership and request supervisor approval when you need
                to leave or dissolve your selected project team.
              </p>

              {pool && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm dark:border-blue-800 dark:bg-slate-900/70 dark:text-slate-200">
                  <Target className="h-4 w-4 text-blue-500" />
                  {getPoolName(pool)}
                </div>
              )}
            </div>

            {!team && (
              <button
                type="button"
                onClick={() =>
                  setShowCreateModal(
                    true
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="h-5 w-5" />
                Create Team
              </button>
            )}
          </div>
        </div>

        {/* =====================================================
            PENDING INVITES
        ====================================================== */}

        {invites.length > 0 && (
          <section className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-sm dark:border-amber-900/60 dark:from-amber-950/30 dark:to-orange-950/20">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                <Mail className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-bold text-slate-900 dark:text-white">
                  Team Invitations
                </h2>

                <p className="text-xs text-slate-600 dark:text-slate-300">
                  You have{' '}
                  {invites.length}{' '}
                  pending invitation
                  {invites.length !==
                  1
                    ? 's'
                    : ''}
                  .
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              {invites.map(
                (invite) => (
                  <div
                    key={
                      invite.id
                    }
                    className="flex flex-col gap-4 rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between dark:border-slate-800 dark:bg-slate-900/70"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {invite.team
                          ?.name ||
                          'Project Team'}
                      </p>

                      {invite.message && (
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          {
                            invite.message
                          }
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={
                          saving
                        }
                        onClick={() =>
                          respondToInvite(
                            invite.id,
                            true
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Accept
                      </button>

                      <button
                        type="button"
                        disabled={
                          saving
                        }
                        onClick={() =>
                          respondToInvite(
                            invite.id,
                            false
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        <XCircle className="h-4 w-4" />
                        Decline
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </section>
        )}

        {/* =====================================================
            NO TEAM
        ====================================================== */}

        {!team ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-100 to-pink-100 text-blue-600 dark:from-blue-900/40 dark:to-pink-900/30 dark:text-blue-300">
              <Users className="h-9 w-9" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
              You are not in a team yet
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-300">
              Create your own team or accept an invitation from another
              student to start building your final-year project team.
            </p>

            <button
              type="button"
              onClick={() =>
                setShowCreateModal(
                  true
                )
              }
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5"
            >
              <Plus className="h-5 w-5" />
              Create Team
            </button>
          </div>
        ) : (
          <>
            {/* =================================================
                TEAM OVERVIEW
            ================================================== */}

            <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />

                <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      <Rocket className="h-4 w-4" />
                      {team.status ||
                        'FORMING'}
                    </div>

                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {team.name}
                    </h2>

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      Team ID:{' '}
                      {team.id}
                    </p>
                  </div>

                  {isLeader && (
                    <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      <Crown className="h-4 w-4" />
                      Team Leader
                    </div>
                  )}
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Active Members
                    </p>

                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                      {memberCount}

                      <span className="text-base font-medium text-slate-400">
                        {' '}
                        /{' '}
                        {maxTeamSize}
                      </span>
                    </p>
                  </div>

                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      Free Slots
                    </p>

                    <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                      {freeSlots}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Project
                    </p>

                    <p className="mt-1 truncate text-sm font-bold text-slate-900 dark:text-white">
                      {
                        projectTitle
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Project card */}

              <div className="rounded-3xl border border-pink-200 bg-gradient-to-br from-pink-50 via-white to-blue-50 p-6 shadow-sm dark:border-pink-900/50 dark:from-pink-950/20 dark:via-slate-900 dark:to-blue-950/20">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-pink-100 p-2.5 text-pink-600 dark:bg-pink-900/30 dark:text-pink-300">
                    <BookOpen className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-pink-300">
                      Selected Project
                    </p>

                    <h3 className="mt-1 font-bold text-slate-900 dark:text-white">
                      {
                        projectTitle
                      }
                    </h3>
                  </div>
                </div>

                {team.project
                  ?.projectCode && (
                  <div className="mt-5 rounded-2xl border border-pink-100 bg-white/70 p-4 dark:border-pink-900/40 dark:bg-slate-900/50">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Project Code
                    </p>

                    <p className="mt-1 font-mono font-bold text-slate-900 dark:text-white">
                      {
                        team
                          .project
                          .projectCode
                      }
                    </p>
                  </div>
                )}

                {!hasSelectedProject && (
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      No project has been selected yet.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* =================================================
                MEMBERS
            ================================================== */}

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Team Members
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {memberCount}{' '}
                    active member
                    {memberCount !==
                    1
                      ? 's'
                      : ''}{' '}
                    of{' '}
                    {maxTeamSize}
                  </p>
                </div>

                {isLeader &&
                  freeSlots >
                    0 &&
                  !team.isFrozen && (
                    <button
                      type="button"
                      disabled={
                        studentsLoading
                      }
                      onClick={
                        loadStudents
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <UserPlus className="h-4 w-4" />

                      {studentsLoading
                        ? 'Loading...'
                        : 'Invite Student'}
                    </button>
                  )}
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {team.members?.map(
                  (
                    member,
                    index
                  ) => {
                    const memberId =
                      getMemberId(
                        member
                      );

                    const active =
                      isActiveMember(
                        member
                      );

                    const isCurrentUser =
                      memberId ===
                      user?.id;

                    const memberIsLeader =
                      member.role ===
                        'LEADER' ||
                      memberId ===
                        team.leaderId;

                    return (
                      <div
                        key={
                          member.id ||
                          memberId ||
                          `member-${index}`
                        }
                        className={`rounded-2xl border p-4 transition ${
                          active
                            ? 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50'
                            : 'border-slate-200 bg-slate-100/60 opacity-70 dark:border-slate-800 dark:bg-slate-800/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold ${
                              memberIsLeader
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                            }`}
                          >
                            {memberIsLeader ? (
                              <Crown className="h-5 w-5" />
                            ) : (
                              <Shield className="h-5 w-5" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-bold text-slate-900 dark:text-white">
                                {getMemberName(
                                  member
                                )}
                              </p>

                              {isCurrentUser && (
                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                  YOU
                                </span>
                              )}

                              {memberIsLeader && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                  LEADER
                                </span>
                              )}

                              {!active && (
                                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                  LEFT
                                </span>
                              )}
                            </div>

                            <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                              {member.student
                                ?.email ||
                                member.user
                                  ?.email ||
                                member.email ||
                                'Student'}
                            </p>
                          </div>

                          {isLeader &&
                            active &&
                            !memberIsLeader &&
                            memberId && (
                              <button
                                type="button"
                                disabled={
                                  saving
                                }
                                onClick={() =>
                                  setConfirmState(
                                    {
                                      type: 'remove',
                                      id: memberId,
                                      name: getMemberName(
                                        member
                                      ),
                                    }
                                  )
                                }
                                className="rounded-xl p-2 text-red-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                                title="Remove member"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              {leftMembers.length >
                0 && (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        Previous Members
                      </p>

                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        These members have left the team and do not
                        consume active team slots.
                      </p>
                    </div>

                    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      {
                        leftMembers.length
                      }
                    </span>
                  </div>
                </div>
              )}
            </section>

            {/* =================================================
                LEAVE REQUEST
            ================================================== */}

            {!isLeader &&
              isMember && (
                <section className="rounded-3xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-6 shadow-sm dark:border-orange-900/50 dark:from-orange-950/20 dark:to-amber-950/20">
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-orange-100 p-2.5 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300">
                          <LogOut className="h-5 w-5" />
                        </div>

                        <div>
                          <h2 className="font-bold text-slate-900 dark:text-white">
                            Leave Team
                          </h2>

                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            Leaving a selected project team requires
                            supervisor approval.
                          </p>
                        </div>
                      </div>

                      {leaveRequestStatus ===
                        'PENDING' && (
                        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                          <Clock3 className="h-4 w-4" />
                          Leave request pending
                        </div>
                      )}

                      {leaveRequestStatus ===
                        'APPROVED' && (
                        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                          <CheckCircle2 className="h-4 w-4" />
                          Leave request approved
                        </div>
                      )}

                      {leaveRequestStatus ===
                        'REJECTED' && (
                        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/20">
                          <div className="flex items-center gap-2 text-xs font-bold text-red-700 dark:text-red-300">
                            <XCircle className="h-4 w-4" />
                            Leave request rejected
                          </div>

                          {leaveResponseNote && (
                            <p className="mt-1 text-xs text-red-700/80 dark:text-red-300/80">
                              {
                                leaveResponseNote
                              }
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={
                        !canRequestLeave ||
                        saving
                      }
                      onClick={() =>
                        setShowLeaveModal(
                          true
                        )
                      }
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-orange-300 bg-white px-5 py-3 text-sm font-bold text-orange-700 shadow-sm transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-orange-800 dark:bg-slate-900 dark:text-orange-300 dark:hover:bg-orange-950/20"
                    >
                      <LogOut className="h-4 w-4" />

                      {leaveRequestStatus ===
                      'PENDING'
                        ? 'Request Pending'
                        : leaveRequestStatus ===
                          'REJECTED'
                        ? 'Request Again'
                        : 'Request to Leave'}
                    </button>
                  </div>
                </section>
              )}

            {/* =================================================
                LEADER / DISSOLVE MANAGEMENT
            ================================================== */}

            {isLeader && (
              <section className="rounded-3xl border border-red-200 bg-red-50/60 p-6 dark:border-red-900/50 dark:bg-red-950/10">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <h2 className="font-bold text-slate-900 dark:text-white">
                      Team Management
                    </h2>

                    <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                      As the team leader, you can manage active
                      members. If the entire team needs to be dissolved,
                      submit a request with a reason for supervisor
                      approval.
                    </p>

                    {dissolveRequestStatus ===
                      'PENDING' && (
                      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                        <Clock3 className="h-4 w-4" />
                        Dissolve request pending supervisor approval
                      </div>
                    )}

                    {dissolveRequestStatus ===
                      'APPROVED' && (
                      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                        <CheckCircle2 className="h-4 w-4" />
                        Dissolve request approved
                      </div>
                    )}

                    {dissolveRequestStatus ===
                      'REJECTED' && (
                      <div className="mt-4 max-w-xl rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
                        <div className="flex items-center gap-2 text-xs font-bold text-red-700 dark:text-red-300">
                          <XCircle className="h-4 w-4" />
                          Dissolve request rejected
                        </div>

                        {dissolveResponseNote && (
                          <p className="mt-2 text-xs leading-5 text-red-700/80 dark:text-red-300/80">
                            Supervisor response:{' '}
                            {
                              dissolveResponseNote
                            }
                          </p>
                        )}

                        <p className="mt-2 text-[11px] text-red-600/70 dark:text-red-300/70">
                          You can submit another request with a different
                          reason if required.
                        </p>
                      </div>
                    )}
                  </div>

                  {!team.isFrozen && (
                    <button
                      type="button"
                      disabled={
                        saving ||
                        !canRequestDissolve
                      }
                      onClick={() => {
                        setDissolveReason(
                          ''
                        );

                        setShowDissolveModal(
                          true
                        );
                      }}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/50 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/30"
                    >
                      {dissolveRequestStatus ===
                      'PENDING' ? (
                        <Clock3 className="h-4 w-4" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}

                      {dissolveRequestStatus ===
                      'PENDING'
                        ? 'Request Pending'
                        : dissolveRequestStatus ===
                          'REJECTED'
                        ? 'Request Again'
                        : 'Request Dissolve'}
                    </button>
                  )}
                </div>
              </section>
            )}

            {/* Refresh */}

            <div className="flex justify-end">
              <button
                type="button"
                disabled={
                  loading
                }
                onClick={
                  refreshTeam
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Refresh Team
              </button>
            </div>
          </>
        )}
      </div>

      {/* =======================================================
          CREATE TEAM MODAL
      ======================================================== */}

      {showCreateModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Create Your Team
                </h2>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Start building your final-year project team.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreateModal(
                    false
                  )
                }
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Team Name
                </label>

                <input
                  value={
                    teamName
                  }
                  onChange={(
                    event
                  ) =>
                    setTeamName(
                      event.target
                        .value
                    )
                  }
                  placeholder="e.g. Team Innovators"
                  maxLength={
                    100
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />

                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Choose a simple and recognizable team name.
                </p>
              </div>

              <button
                type="button"
                disabled={
                  saving
                }
                onClick={
                  createTeam
                }
                className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-50"
              >
                {saving
                  ? 'Creating...'
                  : 'Create Team'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          INVITE MODAL
      ======================================================== */}

      {showInviteModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Invite Student
                </h2>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {freeSlots}{' '}
                  free slot
                  {freeSlots !==
                  1
                    ? 's'
                    : ''}{' '}
                  available in your team.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowInviteModal(
                    false
                  )
                }
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-slate-200 p-5 dark:border-slate-800">
              <input
                value={
                  inviteSearch
                }
                onChange={(
                  event
                ) =>
                  setInviteSearch(
                    event.target
                      .value
                  )
                }
                placeholder="Search by name, email, roll number..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />

              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Only students from your section are shown.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {filteredStudents.length ===
              0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center dark:border-slate-700">
                  <Users className="mx-auto h-8 w-8 text-slate-400" />

                  <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">
                    No students found
                  </p>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Try another search or check whether students have
                    been assigned to the same section.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredStudents.map(
                    (
                      student
                    ) => (
                      <div
                        key={
                          student.id
                        }
                        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50/50 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-blue-900/50 dark:hover:bg-blue-950/20"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 font-bold text-blue-700 dark:from-blue-900/40 dark:to-indigo-900/40 dark:text-blue-300">
                          {(
                            student.fullName ||
                            student.name ||
                            'S'
                          )
                            .charAt(
                              0
                            )
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-slate-900 dark:text-white">
                            {student.fullName ||
                              student.name ||
                              'Student'}
                          </p>

                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {student.email ||
                              'No email available'}
                          </p>

                          {(
                            student.enrollmentNumber ||
                            student.rollNumber
                          ) && (
                            <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                              {student.enrollmentNumber ||
                                student.rollNumber}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={
                            saving
                          }
                          onClick={() =>
                            sendInvite(
                              student.id
                            )
                          }
                          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
                        >
                          <Send className="h-4 w-4" />
                          Invite
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          LEAVE REQUEST MODAL
      ======================================================== */}

      {showLeaveModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-orange-200 bg-white shadow-2xl dark:border-orange-900/50 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Request to Leave Team
                </h2>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Your supervisor must approve this request.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowLeaveModal(
                    false
                  )
                }
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-900/50 dark:bg-orange-950/20">
                <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                  Important
                </p>

                <p className="mt-1 text-xs leading-5 text-orange-700 dark:text-orange-300">
                  Leaving is not immediate. Submit a reason and wait
                  for supervisor approval.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Reason for leaving
                </label>

                <textarea
                  value={
                    leaveReason
                  }
                  onChange={(
                    event
                  ) =>
                    setLeaveReason(
                      event.target
                        .value
                    )
                  }
                  rows={
                    5
                  }
                  maxLength={
                    1000
                  }
                  placeholder="Explain why you need to leave this team..."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />

                <div className="mt-2 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>
                    Minimum 10 characters
                  </span>

                  <span>
                    {
                      leaveReason.length
                    }
                    /1000
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setShowLeaveModal(
                      false
                    )
                  }
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={
                    submitLeaveRequest
                  }
                  className="flex-1 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {saving
                    ? 'Submitting...'
                    : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          DISSOLVE REQUEST MODAL
      ======================================================== */}

      {showDissolveModal && (
        <div className="fixed inset-0 z-[92] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-red-200 bg-white shadow-2xl dark:border-red-900/50 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Request to Dissolve Team
                </h2>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Your supervisor must approve this request.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowDissolveModal(
                    false
                  )
                }
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-red-100 p-2 text-red-600 dark:bg-red-900/40 dark:text-red-300">
                    <Trash2 className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                      Supervisor Approval Required
                    </p>

                    <p className="mt-1 text-xs leading-5 text-red-700 dark:text-red-300">
                      The team will not be dissolved immediately.
                      Your supervisor will review your reason and
                      either approve or reject the request.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Reason for dissolving the team
                </label>

                <textarea
                  value={
                    dissolveReason
                  }
                  onChange={(
                    event
                  ) =>
                    setDissolveReason(
                      event.target
                        .value
                    )
                  }
                  rows={
                    5
                  }
                  maxLength={
                    1000
                  }
                  placeholder="Explain why the entire team needs to be dissolved..."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />

                <div className="mt-2 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>
                    Minimum 10 characters
                  </span>

                  <span>
                    {
                      dissolveReason.length
                    }
                    /1000
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setShowDissolveModal(
                      false
                    )
                  }
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    saving ||
                    dissolveReason
                      .trim()
                      .length <
                      10
                  }
                  onClick={
                    submitDissolveRequest
                  }
                  className="flex-1 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? 'Submitting...'
                    : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          REMOVE MEMBER CONFIRMATION MODAL
      ======================================================== */}

      {confirmState && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300">
              <Trash2 className="h-6 w-6" />
            </div>

            <h2 className="mt-5 text-center text-xl font-bold text-slate-900 dark:text-white">
              Remove Member?
            </h2>

            <p className="mt-2 text-center text-sm leading-6 text-slate-600 dark:text-slate-300">
              Are you sure you want to remove{' '}
              <strong>
                {
                  confirmState.name ||
                  'this member'
                }
              </strong>{' '}
              from the team?
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={
                  saving
                }
                onClick={() =>
                  setConfirmState(
                    null
                  )
                }
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  saving
                }
                onClick={
                  handleConfirmRemove
                }
                className="flex-1 rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {saving
                  ? 'Removing...'
                  : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTeamPage;