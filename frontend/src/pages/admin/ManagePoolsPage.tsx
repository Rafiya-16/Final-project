// frontend/src/pages/admin/ManagePoolsPage.tsx

import React, {
  useEffect,
  // useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { poolService } from '@/services/poolService';
import { userService } from '@/services/userService';
import {
  Plus,
  FolderKanban,
  ChevronRight,
  ShieldCheck,
  Users,
  GraduationCap,
  Check,
  RotateCcw,
} from 'lucide-react';
import { Badge } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';
import type {
  Pool,
  User,
  CreatePoolInput,
} from '@/types';
import { getErrorMessage } from '@/types';

const addDays = (
  value: string,
  days: number,
): string => {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  date.setDate(
    date.getDate() + days,
  );

  const offset =
    date.getTimezoneOffset();

  const localDate = new Date(
    date.getTime() -
      offset * 60 * 1000,
  );

  return localDate
    .toISOString()
    .slice(0, 16);
};

type TimelineKey =
  | 'submissionStart'
  | 'submissionEnd'
  | 'reviewStart'
  | 'reviewEnd'
  | 'decisionDeadline'
  | 'selectionStart'
  | 'selectionEnd'
  | 'ideaSubmissionStart'
  | 'ideaSubmissionEnd'
  | 'teamFreezeDate';

interface TimelineFieldDefinition {
  key: TimelineKey;
  label: string;
}

const TIMELINE_FIELDS: TimelineFieldDefinition[] =
  [
    {
      key: 'submissionEnd',
      label: 'Faculty Project Submission End',
    },
    {
      key: 'reviewStart',
      label: 'Subadmin Review Start',
    },
    {
      key: 'reviewEnd',
      label: 'Subadmin Review End',
    },
    {
      key: 'decisionDeadline',
      label: 'Admin Decision Deadline',
    },
    {
      key: 'selectionStart',
      label: 'Student Project Selection Start (Online)',
    },
    {
      key: 'selectionEnd',
      label: 'Student Project Selection End (Online)',
    },
    {
      key: 'ideaSubmissionStart',
      label: 'Student Idea Submission Start (Offline)',
    },
    {
      key: 'ideaSubmissionEnd',
      label: 'Student Idea Submission End (offline)',
    },
    {
      key: 'teamFreezeDate',
      label: 'Student Team Freeze',
    },
  ];

interface CreatePoolFormState {
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

  subadminIds: string[];
  facultyIds: string[];
  studentIds: string[];
}

const AUTOMATIC_FIELDS: TimelineKey[] = [
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

const getAutomaticTimeline = (
  submissionStart: string,
): Pick<
  CreatePoolFormState,
  Exclude<
    TimelineKey,
    'submissionStart'
  >
> => {
  if (!submissionStart) {
    return {
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
  }

  const submissionEnd = addDays(
    submissionStart,
    9,
  );

  const reviewStart =
    submissionStart;

  const reviewEnd = addDays(
    submissionEnd,
    2,
  );

  const decisionDeadline =
    addDays(reviewEnd, 3);

  const selectionStart =
    addDays(reviewEnd, 1);

  const selectionEnd = addDays(
    selectionStart,
    9,
  );

  const ideaSubmissionStart =
    addDays(selectionEnd, 1);

  const ideaSubmissionEnd =
    addDays(
      ideaSubmissionStart,
      3,
    );

  const teamFreezeDate =
    addDays(
      ideaSubmissionEnd,
      5,
    );

  return {
    submissionEnd,
    reviewStart,
    reviewEnd,
    decisionDeadline,
    selectionStart,
    selectionEnd,
    ideaSubmissionStart,
    ideaSubmissionEnd,
    teamFreezeDate,
  };
};

const ManagePoolsPage: React.FC =
  () => {
    const [pools, setPools] =
      useState<Pool[]>([]);

    const [loading, setLoading] =
      useState(true);

    const [showCreate, setShowCreate] =
      useState(false);

    const navigate =
      useNavigate();

    const load = async () => {
      setLoading(true);

      try {
        const response =
          await poolService.list();

        setPools(
          response.data || [],
        );
      } catch (error) {
        toast.error(
          getErrorMessage(error),
        );
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      load();
    }, []);

    if (showCreate) {
      return (
        <CreatePoolForm
          onBack={() => {
            setShowCreate(false);
            load();
          }}
        />
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Allocation Pools
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Create and manage project allocation pools
            </p>
          </div>

          <button
            onClick={() =>
              setShowCreate(true)
            }
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Pool
          </button>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : pools.length === 0 ? (
          <EmptyState
            title="No pools"
            subtitle="Create your first allocation pool"
          />
        ) : (
          <div className="grid gap-4">
            {pools.map((pool) => (
              <div
                key={pool.id}
                onClick={() =>
                  navigate(
                    `/pools/${pool.id}`,
                  )
                }
                className="bg-white rounded-xl border p-5 hover:shadow-md cursor-pointer transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FolderKanban className="w-5 h-5 text-blue-600" />
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {pool.name}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {pool.academicYear} •{' '}
                        {pool.semester}
                        {pool.department
                          ? ` • ${pool.department}`
                          : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm text-gray-500">
                      <p>
                        {pool._count
                          ?.faculty ||
                          0}{' '}
                        Faculty •{' '}
                        {pool._count
                          ?.students ||
                          0}{' '}
                        Students
                      </p>

                      <p>
                        {pool._count
                          ?.projects ||
                          0}{' '}
                        Projects •{' '}
                        {pool._count
                          ?.teams ||
                          0}{' '}
                        Teams
                      </p>
                    </div>

                    <Badge
                      text={pool.status}
                    />

                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

const CreatePoolForm: React.FC<{
  onBack: () => void;
}> = ({ onBack }) => {
  const [form, setForm] =
    useState<CreatePoolFormState>({
      name: '',
      academicYear: '2026-2027',
      semester: 'Odd',
      department: 'CSE',

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

      subadminIds: [],
      facultyIds: [],
      studentIds: [],
    });

  const [
    manualTimelineFields,
    setManualTimelineFields,
  ] = useState<Set<TimelineKey>>(
    new Set(),
  );

  const [users, setUsers] =
    useState<{
      subadmins: User[];
      faculty: User[];
      students: User[];
    }>({
      subadmins: [],
      faculty: [],
      students: [],
    });

  const [
    loadingUsers,
    setLoadingUsers,
  ] = useState(true);

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      setLoadingUsers(true);

      try {
        const [
          subadminResponse,
          facultyResponse,
          studentResponse,
        ] = await Promise.all([
          userService.list({
            role: 'SUBADMIN',
            limit: '100',
            isActive: 'true',
          }),

          userService.list({
            role: 'FACULTY',
            limit: '100',
            isActive: 'true',
          }),

          userService.list({
            role: 'STUDENT',
            limit: '500',
            isActive: 'true',
          }),
        ]);

        setUsers({
          subadmins:
            subadminResponse.data ||
            [],
          faculty:
            facultyResponse.data ||
            [],
          students:
            studentResponse.data ||
            [],
        });
      } catch (error) {
        toast.error(
          `Failed to load users: ${getErrorMessage(
            error,
          )}`,
        );
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, []);

  const set = (
    key: keyof CreatePoolFormState,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSubmissionStartChange = (
    value: string,
  ) => {
    setForm((current) => {
      const automatic =
        getAutomaticTimeline(value);

      const next = {
        ...current,
        submissionStart: value,
      };

      for (const field of AUTOMATIC_FIELDS) {
        if (
          !manualTimelineFields.has(
            field,
          )
        ) {
          next[field] =
            automatic[field];
        }
      }

      return next;
    });
  };

  const handleTimelineChange = (
    field: TimelineKey,
    value: string,
  ) => {
    if (
      field === 'submissionStart'
    ) {
      handleSubmissionStartChange(
        value,
      );
      return;
    }

    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setManualTimelineFields(
      (current) => {
        const next = new Set(
          current,
        );

        next.add(field);

        return next;
      },
    );
  };

  const resetTimelineField = (
    field: TimelineKey,
  ) => {
    if (
      field === 'submissionStart'
    ) {
      return;
    }

    const automatic =
      getAutomaticTimeline(
        form.submissionStart,
      );

    setForm((current) => ({
      ...current,
      [field]: automatic[field],
    }));

    setManualTimelineFields(
      (current) => {
        const next = new Set(
          current,
        );

        next.delete(field);

        return next;
      },
    );
  };

  const toggle = (
    list:
      | 'subadminIds'
      | 'facultyIds'
      | 'studentIds',
    id: string,
  ) => {
    setForm((current) => {
      const currentList =
        current[list];

      return {
        ...current,
        [list]:
          currentList.includes(id)
            ? currentList.filter(
                (item) => item !== id,
              )
            : [
                ...currentList,
                id,
              ],
      };
    });
  };

  const selectAll = (
    list:
      | 'subadminIds'
      | 'facultyIds'
      | 'studentIds',
    ids: string[],
  ) => {
    setForm((current) => ({
      ...current,
      [list]: ids,
    }));
  };

  const clearAll = (
    list:
      | 'subadminIds'
      | 'facultyIds'
      | 'studentIds',
  ) => {
    setForm((current) => ({
      ...current,
      [list]: [],
    }));
  };

  const toggleFaculty = (
    id: string,
  ) => {
    toggle(
      'facultyIds',
      id,
    );
  };

  const toggleSubadmin = (
    id: string,
  ) => {
    toggle(
      'subadminIds',
      id,
    );
  };

  const validateTimelineBeforeSubmit =
    (): boolean => {
      if (!form.submissionStart) {
        toast.error(
          'Faculty Project Submission Start is required',
        );
        return false;
      }

      const fields: TimelineKey[] =
        [
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

      for (const field of fields) {
        if (!form[field]) {
          toast.error(
            `${field} is required`,
          );
          return false;
        }

        const date = new Date(
          form[field],
        );

        if (
          Number.isNaN(
            date.getTime(),
          )
        ) {
          toast.error(
            `${field} contains an invalid date`,
          );
          return false;
        }
      }

      const submissionStart =
        new Date(
          form.submissionStart,
        );

      const submissionEnd =
        new Date(
          form.submissionEnd,
        );

      const reviewStart =
        new Date(
          form.reviewStart,
        );

      const reviewEnd =
        new Date(
          form.reviewEnd,
        );

      const decisionDeadline =
        new Date(
          form.decisionDeadline,
        );

      const selectionStart =
        new Date(
          form.selectionStart,
        );

      const selectionEnd =
        new Date(
          form.selectionEnd,
        );

      const ideaStart =
        new Date(
          form.ideaSubmissionStart,
        );

      const ideaEnd =
        new Date(
          form.ideaSubmissionEnd,
        );

      const teamFreeze =
        new Date(
          form.teamFreezeDate,
        );

      if (
        submissionStart >=
        submissionEnd
      ) {
        toast.error(
          'Submission End must be after Submission Start',
        );
        return false;
      }

      if (
        reviewStart >=
        reviewEnd
      ) {
        toast.error(
          'PQAC Review End must be after Review Start',
        );
        return false;
      }

      if (
        reviewStart <
        submissionStart
      ) {
        toast.error(
          'PQAC Review Start cannot be before Faculty Submission Start',
        );
        return false;
      }

      if (
        reviewEnd <
        submissionEnd
      ) {
        toast.error(
          'PQAC Review End cannot be before Faculty Submission End',
        );
        return false;
      }

      if (
        decisionDeadline <
        reviewEnd
      ) {
        toast.error(
          'Decision Deadline cannot be before PQAC Review End',
        );
        return false;
      }

      if (
        selectionStart <=
        reviewEnd
      ) {
        toast.error(
          'Student Selection must start after PQAC Review End',
        );
        return false;
      }

      if (
        selectionStart >=
        selectionEnd
      ) {
        toast.error(
          'Selection End must be after Selection Start',
        );
        return false;
      }

      if (
        ideaStart <=
        selectionEnd
      ) {
        toast.error(
          'Student Idea Submission must start after Selection End',
        );
        return false;
      }

      if (
        ideaStart >=
        ideaEnd
      ) {
        toast.error(
          'Idea Submission End must be after Idea Submission Start',
        );
        return false;
      }

      if (
        teamFreeze <=
        ideaEnd
      ) {
        toast.error(
          'Team Freeze must be after Idea Submission End',
        );
        return false;
      }

      return true;
    };

  const submit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error(
        'Pool name is required',
      );
      return;
    }

    if (
      form.facultyIds.length === 0
    ) {
      toast.error(
        'Select at least one Faculty member',
      );
      return;
    }

    if (
      form.subadminIds.length === 0
    ) {
      toast.error(
        'Select at least one SubAdmin',
      );
      return;
    }

    if (
      form.studentIds.length === 0
    ) {
      toast.error(
        'Select at least one Student',
      );
      return;
    }

    if (
      !validateTimelineBeforeSubmit()
    ) {
      return;
    }

    setLoading(true);

    try {
      const data: CreatePoolInput =
        {
          ...form,

          submissionStart:
            new Date(
              form.submissionStart,
            ).toISOString(),

          submissionEnd:
            new Date(
              form.submissionEnd,
            ).toISOString(),

          reviewStart:
            new Date(
              form.reviewStart,
            ).toISOString(),

          reviewEnd:
            new Date(
              form.reviewEnd,
            ).toISOString(),

          decisionDeadline:
            new Date(
              form.decisionDeadline,
            ).toISOString(),

          selectionStart:
            new Date(
              form.selectionStart,
            ).toISOString(),

          selectionEnd:
            new Date(
              form.selectionEnd,
            ).toISOString(),

          ideaSubmissionStart:
            new Date(
              form.ideaSubmissionStart,
            ).toISOString(),

          ideaSubmissionEnd:
            new Date(
              form.ideaSubmissionEnd,
            ).toISOString(),

          teamFreezeDate:
            new Date(
              form.teamFreezeDate,
            ).toISOString(),
        };

      await poolService.create(
        data,
      );

      toast.success(
        'Pool created successfully',
      );

      onBack();
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error),
      );
    } finally {
      setLoading(false);
    }
  };

  // const facultyIds = useMemo(
  //   () =>
  //     new Set(
  //       users.faculty.map(
  //         (user) => user.id,
  //       ),
  //     ),
  //   [users.faculty],
  // );

  // const globalSubadmins =
  //   useMemo(
  //     () =>
  //       users.subadmins.filter(
  //         (user) =>
  //           !facultyIds.has(
  //             user.id,
  //           ),
  //       ),
  //     [
  //       users.subadmins,
  //       facultyIds,
  //     ],
  //   );

  return (
    <form
      onSubmit={submit}
      className="max-w-5xl mx-auto space-y-6"
    >
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Create Pool
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Configure the allocation pool and assign users
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back
        </button>
      </div>

      {/* BASIC INFO */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">
          Basic Info
        </h3>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-3">
            <label className="text-sm font-medium text-gray-700">
              Pool Name *
            </label>

            <input
              value={form.name}
              onChange={(event) =>
                set(
                  'name',
                  event.target.value,
                )
              }
              required
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="PCS 2027 Odd"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Academic Year
            </label>

            <input
              value={
                form.academicYear
              }
              onChange={(event) =>
                set(
                  'academicYear',
                  event.target.value,
                )
              }
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Semester
            </label>

            <select
              value={form.semester}
              onChange={(event) =>
                set(
                  'semester',
                  event.target.value,
                )
              }
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none"
            >
              <option>Odd</option>
              <option>Even</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Department
            </label>

            <input
              value={
                form.department
              }
              onChange={(event) =>
                set(
                  'department',
                  event.target.value,
                )
              }
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none"
            />
          </div>
        </div>
      </div>

      {/* TIMELINE */}
      <div className="bg-white rounded-xl border p-6 space-y-5">
        <div>
          <h3 className="font-semibold text-gray-900">
            Timeline
          </h3>
        </div>

        {/* FIRST DATE */}
        <div className="border rounded-lg p-4 bg-blue-50/40">
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm font-semibold text-gray-800">
              Faculty Project Submission Start *
            </label>
          </div>

          <input
            type="datetime-local"
            value={
              form.submissionStart
            }
            onChange={(event) =>
              handleSubmissionStartChange(
                event.target.value,
              )
            }
            required
            className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        {/* GENERATED / EDITABLE DATES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TIMELINE_FIELDS.map(
            ({
              key,
              label,
            }) => {
              const isManual =
                manualTimelineFields.has(
                  key,
                );

              return (
                <div
                  key={key}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        {label} *
                      </label>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isManual && (
                        <button
                          type="button"
                          title="Reset to automatic"
                          onClick={() =>
                            resetTimelineField(
                              key,
                            )
                          }
                          className="p-1.5 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <input
                    type="datetime-local"
                    value={
                      form[key]
                    }
                    onChange={(event) =>
                      handleTimelineChange(
                        key,
                        event.target.value,
                      )
                    }
                    required
                    className="w-full mt-3 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              );
            },
          )}
        </div>
      </div>

      {/* FACULTY + SUBADMIN ASSIGNMENT */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />

              <h3 className="font-semibold text-gray-900">
                Faculty & SubAdmin Assignment
              </h3>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            Faculty:{' '}
            <span className="font-semibold text-gray-900">
              {form.facultyIds.length}
            </span>
            {' • '}
            SubAdmins:{' '}
            <span className="font-semibold text-gray-900">
              {form.subadminIds.length}
            </span>
          </div>
        </div>

        {loadingUsers ? (
          <div className="py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {/* FACULTY TABLE */}
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-[1fr_120px_120px] bg-gray-50 border-b px-4 py-3 text-xs font-semibold text-gray-600 uppercase">
                <div>Faculty</div>

                <div className="text-center">
                  Faculty
                </div>

                <div className="text-center">
                  SubAdmin
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y">
                {users.faculty.length ===
                0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">
                    No active Faculty found.
                  </div>
                ) : (
                  users.faculty.map(
                    (user) => {
                      const isFaculty =
                        form.facultyIds.includes(
                          user.id,
                        );

                      const isSubadmin =
                        form.subadminIds.includes(
                          user.id,
                        );

                      return (
                        <div
                          key={user.id}
                          className={`grid grid-cols-[1fr_120px_120px] items-center px-4 py-3 transition-colors ${
                            isFaculty ||
                            isSubadmin
                              ? 'bg-blue-50/50'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {
                                user.firstName
                              }{' '}
                              {
                                user.lastName
                              }
                            </p>

                            <p className="text-xs text-gray-500 truncate">
                              {user.facultyId ||
                                user.email}
                            </p>

                            {user.facultyId &&
                              user.email && (
                                <p className="text-xs text-gray-400 truncate">
                                  {
                                    user.email
                                  }
                                </p>
                              )}
                          </div>

                          <div className="flex justify-center">
                            <button
                              type="button"
                              onClick={() =>
                                toggleFaculty(
                                  user.id,
                                )
                              }
                              aria-label={`Assign ${user.firstName} ${user.lastName} as Faculty`}
                              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
                                isFaculty
                                  ? 'bg-blue-600 border-blue-600 text-white'
                                  : 'bg-white border-gray-300 text-transparent hover:border-blue-400'
                              }`}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex justify-center">
                            <button
                              type="button"
                              onClick={() =>
                                toggleSubadmin(
                                  user.id,
                                )
                              }
                              aria-label={`Assign ${user.firstName} ${user.lastName} as SubAdmin`}
                              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
                                isSubadmin
                                  ? 'bg-purple-600 border-purple-600 text-white'
                                  : 'bg-white border-gray-300 text-transparent hover:border-purple-400'
                              }`}
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    },
                  )
                )}
              </div>
            </div>

            {/* GLOBAL SUBADMINS
            <div className="border rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />

                    <h4 className="text-sm font-semibold text-gray-800">
                      Existing SubAdmins
                    </h4>
                  </div>

                  <p className="text-xs text-gray-500 mt-1">
                    These users already have the global
                    SubAdmin role.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    selectAll(
                      'subadminIds',
                      [
                        ...form.subadminIds,
                        ...globalSubadmins.map(
                          (user) =>
                            user.id,
                        ),
                      ],
                    )
                  }
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Select All
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto divide-y">
                {globalSubadmins.length ===
                0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">
                    No additional global SubAdmins found.
                  </div>
                ) : (
                  globalSubadmins.map(
                    (user) => {
                      const isSelected =
                        form.subadminIds.includes(
                          user.id,
                        );

                      return (
                        <label
                          key={user.id}
                          className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-purple-50'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={
                              isSelected
                            }
                            onChange={() =>
                              toggleSubadmin(
                                user.id,
                              )
                            }
                            className="rounded"
                          />

                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {
                                user.firstName
                              }{' '}
                              {
                                user.lastName
                              }
                            </p>

                            <p className="text-xs text-gray-500">
                              {
                                user.email
                              }
                            </p>
                          </div>
                        </label>
                      );
                    },
                  )
                )}
              </div>
            </div> */}

            {/* QUICK ACTIONS */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  selectAll(
                    'facultyIds',
                    users.faculty.map(
                      (user) =>
                        user.id,
                    ),
                  )
                }
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Select All Faculty
              </button>

              <span className="text-gray-300">
                |
              </span>

              <button
                type="button"
                onClick={() =>
                  clearAll(
                    'facultyIds',
                  )
                }
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Clear Faculty
              </button>

              <span className="text-gray-300">
                |
              </span>

              <button
                type="button"
                onClick={() =>
                  selectAll(
                    'subadminIds',
                    users.faculty.map(
                      (user) =>
                        user.id,
                    ),
                  )
                }
                className="text-xs text-purple-600 hover:text-purple-800"
              >
                Make All Faculty SubAdmin
              </button>
            </div>
          </>
        )}
      </div>

      {/* STUDENTS */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-green-600" />

              <h3 className="font-semibold text-gray-900">
                Students
              </h3>
            </div>

            <p className="text-xs text-gray-500 mt-1">
              Assign students who will participate in
              this allocation pool.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              {form.studentIds.length}/
              {users.students.length}
            </span>

            <button
              type="button"
              onClick={() =>
                selectAll(
                  'studentIds',
                  users.students.map(
                    (student) =>
                      student.id,
                  ),
                )
              }
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Select All
            </button>

            <button
              type="button"
              onClick={() =>
                clearAll(
                  'studentIds',
                )
              }
              className="text-xs text-gray-600 hover:text-gray-800"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-1 border rounded-lg p-2">
          {loadingUsers ? (
            <div className="py-8">
              <LoadingSpinner />
            </div>
          ) : users.students
              .length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              No active Students found.
            </div>
          ) : (
            users.students.map(
              (user) => {
                const selected =
                  form.studentIds.includes(
                    user.id,
                  );

                return (
                  <label
                    key={user.id}
                    className={`flex items-center gap-3 p-2 rounded cursor-pointer ${
                      selected
                        ? 'bg-green-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={
                        selected
                      }
                      onChange={() =>
                        toggle(
                          'studentIds',
                          user.id,
                        )
                      }
                      className="rounded"
                    />

                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {
                          user.firstName
                        }{' '}
                        {
                          user.lastName
                        }
                      </p>

                      <p className="text-xs text-gray-500">
                        {user.enrollmentNo ||
                          user.email}
                      </p>
                    </div>
                  </label>
                );
              },
            )
          )}
        </div>
      </div>

      {/* SUMMARY */}
      <div className="bg-gray-50 border rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 mb-3">
          Assignment Summary
        </h3>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <p className="text-xs text-gray-500">
              Faculty
            </p>

            <p className="text-2xl font-bold text-blue-600 mt-1">
              {form.facultyIds.length}
            </p>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <p className="text-xs text-gray-500">
              SubAdmins
            </p>

            <p className="text-2xl font-bold text-purple-600 mt-1">
              {form.subadminIds.length}
            </p>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <p className="text-xs text-gray-500">
              Students
            </p>

            <p className="text-2xl font-bold text-green-600 mt-1">
              {form.studentIds.length}
            </p>
          </div>
        </div>
      </div>

      {/* SUBMIT */}
      <button
        type="submit"
        disabled={
          loading ||
          loadingUsers
        }
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {loading
          ? 'Creating...'
          : 'Create Pool'}
      </button>
    </form>
  );
};

export default ManagePoolsPage;