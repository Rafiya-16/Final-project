
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  FolderKanban,
  ChevronRight,
  Users,
  Layers3,
  CalendarDays,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  ArrowLeft,
  Clock3,
  GraduationCap,
  UserCog,
  ShieldCheck,
  Check,
  RotateCcw,
} from 'lucide-react';
import { Badge } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/stores/authStore';
import { poolService } from '@/services/poolService';
import { userService } from '@/services/userService';
import toast from 'react-hot-toast';
import type { Pool, User, CreatePoolInput } from '@/types';
import { getErrorMessage } from '@/types';

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

type UserSelectionKey = 'subadminIds' | 'facultyIds' | 'studentIds';

interface TimelineFieldDefinition {
  key: Exclude<TimelineKey, 'submissionStart'>;
  label: string;
}

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

const addDays = (value: string, days: number): string => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  date.setDate(date.getDate() + days);

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60 * 1000,
  );

  return localDate.toISOString().slice(0, 16);
};

const TIMELINE_FIELDS: TimelineFieldDefinition[] = [
  { key: 'submissionEnd', label: 'Faculty Project Submission End' },
  { key: 'reviewStart', label: 'SubAdmin Review Start' },
  { key: 'reviewEnd', label: 'SubAdmin Review End' },
  { key: 'decisionDeadline', label: 'Admin Decision Deadline' },
  { key: 'selectionStart', label: 'Student Project Selection Start' },
  { key: 'selectionEnd', label: 'Student Project Selection End' },
  { key: 'ideaSubmissionStart', label: 'Student Idea Submission Start' },
  { key: 'ideaSubmissionEnd', label: 'Student Idea Submission End' },
  { key: 'teamFreezeDate', label: 'Student Team Freeze' },
];

const AUTOMATIC_FIELDS: Exclude<TimelineKey, 'submissionStart'>[] = [
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
): Pick<CreatePoolFormState, Exclude<TimelineKey, 'submissionStart'>> => {
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

  const submissionEnd = addDays(submissionStart, 9);
  const reviewStart = submissionStart;
  const reviewEnd = addDays(submissionEnd, 2);
  const decisionDeadline = addDays(reviewEnd, 3);
  const selectionStart = addDays(reviewEnd, 1);
  const selectionEnd = addDays(selectionStart, 9);
  const ideaSubmissionStart = addDays(selectionEnd, 1);
  const ideaSubmissionEnd = addDays(ideaSubmissionStart, 3);
  const teamFreezeDate = addDays(ideaSubmissionEnd, 5);

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

const ManagePoolsPage: React.FC = () => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'ADMIN';

  const load = async () => {
    setLoading(true);

    try {
      const response = await poolService.list();
      setPools(response.data || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (showCreate) {
    return (
      <CreatePoolForm
        onBack={() => {
          setShowCreate(false);
          void load();
        }}
      />
    );
  }

  return (
    <div className="min-h-full space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-[#fffdf8] via-white to-blue-50/70 p-6 shadow-sm dark:border-slate-700/80 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30 md:p-7">
        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-blue-200/30 blur-3xl dark:bg-blue-500/10" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-violet-200/20 blur-3xl dark:bg-violet-500/10" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-blue-200/80 bg-blue-50/80 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
              <Sparkles className="h-3.5 w-3.5" />
              Administration
            </span>

            <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white md:text-3xl">
              Allocation Pools
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Create and manage project allocation pools for academic sessions,
              departments, faculty, and students.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowCreate(true)}
              className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:from-blue-700 hover:to-violet-700 hover:shadow-xl"
            >
              <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
              Create Pool
              <ArrowUpRight className="h-4 w-4 opacity-70 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </button>
          )}
        </div>
      </section>

      {loading ? (
        <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-slate-200 bg-white/80 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
          <LoadingSpinner />
        </div>
      ) : pools.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
          <EmptyState
            title="No pools"
            subtitle="Create your first allocation pool"
          />
        </div>
      ) : (
        <div className="grid gap-5">
          {pools.map((pool, index) => (
            <div
              key={pool.id}
              onClick={() => navigate(`/pools/${pool.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  navigate(`/pools/${pool.id}`);
                }
              }}
              style={{ animationDelay: `${index * 70}ms` }}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/10 dark:border-slate-700/80 dark:bg-slate-900 dark:hover:border-blue-500/30 md:p-6"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-400 opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-violet-50 transition-transform group-hover:scale-105 dark:border-blue-500/20 dark:from-blue-500/10 dark:to-violet-500/10">
                    <FolderKanban className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-base font-bold text-slate-800 dark:text-white md:text-lg">
                        {pool.name}
                      </h3>
                      <Badge text={pool.status} />
                    </div>

                    <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                      <span>{pool.academicYear}</span>
                      <span>•</span>
                      <span>{pool.semester}</span>
                      {pool.department && (
                        <>
                          <span>•</span>
                          <span>{pool.department}</span>
                        </>
                      )}
                    </p>

                    <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Allocation pool
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      {
                        label: 'Faculty',
                        value: pool._count?.faculty || 0,
                        Icon: UserCog,
                        color: 'text-blue-500',
                      },
                      {
                        label: 'Students',
                        value: pool._count?.students || 0,
                        Icon: GraduationCap,
                        color: 'text-violet-500',
                      },
                      {
                        label: 'Projects',
                        value: pool._count?.projects || 0,
                        Icon: Layers3,
                        color: 'text-emerald-500',
                      },
                      {
                        label: 'Teams',
                        value: pool._count?.teams || 0,
                        Icon: Users,
                        color: 'text-amber-500',
                      },
                    ].map(({ label, value, Icon, color }) => (
                      <div
                        key={label}
                        className="min-w-[100px] rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/70"
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon className={`h-3.5 w-3.5 ${color}`} />
                          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                            {label}
                          </span>
                        </div>
                        <p className="mt-1 text-base font-bold text-slate-700 dark:text-slate-200">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 transition-all group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500 dark:group-hover:border-blue-500/30 dark:group-hover:bg-blue-500/10 dark:group-hover:text-blue-400 sm:flex">
                    <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end border-t border-slate-100 pt-4 sm:hidden dark:border-slate-800">
                <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                  Open Pool
                  <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

const CreatePoolForm: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [form, setForm] = useState<CreatePoolFormState>({
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

  const [manualTimelineFields, setManualTimelineFields] =
    useState<Set<TimelineKey>>(new Set());

  const [users, setUsers] = useState<{
    subadmins: User[];
    faculty: User[];
    students: User[];
  }>({
    subadmins: [],
    faculty: [],
    students: [],
  });

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadUsers = async () => {
      setLoadingUsers(true);

      try {
        const [subadminResponse, facultyResponse, studentResponse] =
          await Promise.all([
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

        if (!active) return;

        setUsers({
          subadmins: subadminResponse.data || [],
          faculty: facultyResponse.data || [],
          students: studentResponse.data || [],
        });
      } catch (error) {
        if (active) {
          toast.error(`Failed to load users: ${getErrorMessage(error)}`);
        }
      } finally {
        if (active) setLoadingUsers(false);
      }
    };

    void loadUsers();

    return () => {
      active = false;
    };
  }, []);

  const set = (key: keyof CreatePoolFormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmissionStartChange = (value: string) => {
    const automatic = getAutomaticTimeline(value);

    setForm((current) => {
      const next: CreatePoolFormState = {
        ...current,
        submissionStart: value,
      };

      for (const field of AUTOMATIC_FIELDS) {
        if (!manualTimelineFields.has(field)) {
          next[field] = automatic[field];
        }
      }

      return next;
    });
  };

  const handleTimelineChange = (field: TimelineKey, value: string) => {
    if (field === 'submissionStart') {
      handleSubmissionStartChange(value);
      return;
    }

    setForm((current) => ({ ...current, [field]: value }));

    setManualTimelineFields((current) => {
      const next = new Set(current);
      next.add(field);
      return next;
    });
  };

  const resetTimelineField = (field: TimelineKey) => {
    if (field === 'submissionStart') return;

    const automatic = getAutomaticTimeline(form.submissionStart);

    setForm((current) => ({
      ...current,
      [field]: automatic[field],
    }));

    setManualTimelineFields((current) => {
      const next = new Set(current);
      next.delete(field);
      return next;
    });
  };

  const toggle = (list: UserSelectionKey, id: string) => {
    setForm((current) => {
      const currentList = current[list];

      return {
        ...current,
        [list]: currentList.includes(id)
          ? currentList.filter((item) => item !== id)
          : [...currentList, id],
      };
    });
  };

  const selectAll = (list: UserSelectionKey, ids: string[]) => {
    setForm((current) => ({ ...current, [list]: ids }));
  };

  const clearAll = (list: UserSelectionKey) => {
    setForm((current) => ({ ...current, [list]: [] }));
  };

  const validateTimelineBeforeSubmit = (): boolean => {
    if (!form.submissionStart) {
      toast.error('Faculty Project Submission Start is required');
      return false;
    }

    const fields: TimelineKey[] = [
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
        toast.error(`${field} is required`);
        return false;
      }

      if (Number.isNaN(new Date(form[field]).getTime())) {
        toast.error(`${field} contains an invalid date`);
        return false;
      }
    }

    const date = (field: TimelineKey) => new Date(form[field]).getTime();

    if (date('submissionStart') >= date('submissionEnd')) {
      toast.error('Submission End must be after Submission Start');
      return false;
    }

    if (date('reviewStart') >= date('reviewEnd')) {
      toast.error('PQAC Review End must be after Review Start');
      return false;
    }

    if (date('reviewStart') < date('submissionStart')) {
      toast.error('PQAC Review Start cannot be before Faculty Submission Start');
      return false;
    }

    if (date('reviewEnd') < date('submissionEnd')) {
      toast.error('PQAC Review End cannot be before Faculty Submission End');
      return false;
    }

    if (date('decisionDeadline') < date('reviewEnd')) {
      toast.error('Decision Deadline cannot be before PQAC Review End');
      return false;
    }

    if (date('selectionStart') <= date('reviewEnd')) {
      toast.error('Student Selection must start after PQAC Review End');
      return false;
    }

    if (date('selectionStart') >= date('selectionEnd')) {
      toast.error('Selection End must be after Selection Start');
      return false;
    }

    if (date('ideaSubmissionStart') <= date('selectionEnd')) {
      toast.error('Student Idea Submission must start after Selection End');
      return false;
    }

    if (date('ideaSubmissionStart') >= date('ideaSubmissionEnd')) {
      toast.error('Idea Submission End must be after Idea Submission Start');
      return false;
    }

    if (date('teamFreezeDate') <= date('ideaSubmissionEnd')) {
      toast.error('Team Freeze must be after Idea Submission End');
      return false;
    }

    return true;
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error('Pool name is required');
      return;
    }

    if (form.facultyIds.length === 0) {
      toast.error('Select at least one Faculty member');
      return;
    }

    if (form.subadminIds.length === 0) {
      toast.error('Select at least one SubAdmin');
      return;
    }

    if (form.studentIds.length === 0) {
      toast.error('Select at least one Student');
      return;
    }

    if (!validateTimelineBeforeSubmit()) return;

    setLoading(true);

    try {
      const data: CreatePoolInput = {
        ...form,
        submissionStart: new Date(form.submissionStart).toISOString(),
        submissionEnd: new Date(form.submissionEnd).toISOString(),
        reviewStart: new Date(form.reviewStart).toISOString(),
        reviewEnd: new Date(form.reviewEnd).toISOString(),
        decisionDeadline: new Date(form.decisionDeadline).toISOString(),
        selectionStart: new Date(form.selectionStart).toISOString(),
        selectionEnd: new Date(form.selectionEnd).toISOString(),
        ideaSubmissionStart: new Date(form.ideaSubmissionStart).toISOString(),
        ideaSubmissionEnd: new Date(form.ideaSubmissionEnd).toISOString(),
        teamFreezeDate: new Date(form.teamFreezeDate).toISOString(),
      };

      await poolService.create(data);
      toast.success('Pool created successfully');
      onBack();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200';

  const facultyCandidates = [
    ...users.subadmins,
    ...users.faculty.filter(
      (faculty) => !users.subadmins.some((subadmin) => subadmin.id === faculty.id),
    ),
  ];

  const renderSelectionList = (
    list: UserSelectionKey,
    items: User[],
    display: (user: User) => string,
  ) => (
    <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-2 dark:border-slate-700 dark:bg-slate-950/30">
      {items.length === 0 ? (
        <div className="flex min-h-20 items-center justify-center text-sm text-slate-400">
          No active users available.
        </div>
      ) : (
        items.map((item) => {
          const selected = form[list].includes(item.id);

          return (
            <label
              key={item.id}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                selected
                  ? 'border-blue-100 bg-blue-50/80 dark:border-blue-500/20 dark:bg-blue-500/10'
                  : 'border-transparent hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={() => toggle(list, item.id)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800"
              />
              <span
                className={`min-w-0 text-sm ${
                  selected
                    ? 'font-medium text-blue-700 dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {display(item)}
              </span>
              {selected && (
                <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-blue-500" />
              )}
            </label>
          );
        })
      )}
    </div>
  );

  return (
    <div className="min-h-full pb-8">
      <form onSubmit={submit} className="mx-auto max-w-5xl space-y-5">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-[#fffdf8] via-white to-blue-50/60 p-6 shadow-sm dark:border-slate-700/80 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30 md:p-7">
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
                <Sparkles className="h-3.5 w-3.5" />
                New Allocation
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white md:text-3xl">
                Create Pool
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Configure the academic session, timeline, and participants.
              </p>
            </div>

            <button
              type="button"
              onClick={onBack}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/80 dark:bg-slate-900 md:p-6">
          <div className="mb-5 flex items-center gap-3">
            <FolderKanban className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-slate-800 dark:text-white">
              Basic Information
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Pool Name *
              </label>
              <input
                value={form.name}
                onChange={(event) => set('name', event.target.value)}
                required
                className={inputClass}
                placeholder="PCS 2027 Odd"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Academic Year
              </label>
              <input
                value={form.academicYear}
                onChange={(event) => set('academicYear', event.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Semester
              </label>
              <select
                value={form.semester}
                onChange={(event) => set('semester', event.target.value)}
                className={inputClass}
              >
                <option>Odd</option>
                <option>Even</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Department
              </label>
              <input
                value={form.department}
                onChange={(event) => set('department', event.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/80 dark:bg-slate-900 md:p-6">
          <div className="mb-5 flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-violet-600" />
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white">
                Allocation Timeline
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Other dates are calculated automatically and can be overridden.
              </p>
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-500/20 dark:bg-blue-500/5">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Faculty Project Submission Start *
            </label>
            <input
              type="datetime-local"
              value={form.submissionStart}
              onChange={(event) =>
                handleSubmissionStartChange(event.target.value)
              }
              required
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {TIMELINE_FIELDS.map(({ key, label }) => {
              const isManual = manualTimelineFields.has(key);

              return (
                <div
                  key={key}
                  className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-3">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {label} *
                    </label>
                    {isManual && (
                      <button
                        type="button"
                        title="Reset to automatic"
                        onClick={() => resetTimelineField(key)}
                        className="rounded-md p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <input
                    type="datetime-local"
                    value={form[key]}
                    onChange={(event) =>
                      handleTimelineChange(key, event.target.value)
                    }
                    required
                    className={inputClass}
                  />
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/80 dark:bg-slate-900 md:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">
                  Faculty & SubAdmin Assignment
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  A faculty member can also be assigned as a pool SubAdmin.
                </p>
              </div>
            </div>
            <div className="text-sm text-slate-500">
              Faculty: <strong>{form.facultyIds.length}</strong>
              {' • '}
              SubAdmins: <strong>{form.subadminIds.length}</strong>
            </div>
          </div>

          {loadingUsers ? (
            <div className="py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-[1fr_76px_88px] border-b bg-slate-50 px-4 py-3 text-xs font-semibold uppercase text-slate-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400 sm:grid-cols-[1fr_100px_110px]">
                  <div>Faculty</div>
                  <div className="text-center">Faculty</div>
                  <div className="text-center">SubAdmin</div>
                </div>

                <div className="max-h-72 divide-y overflow-y-auto dark:divide-slate-800">
                  {users.faculty.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-500">
                      No active Faculty found.
                    </div>
                  ) : (
                    users.faculty.map((faculty) => {
                      const isFaculty = form.facultyIds.includes(faculty.id);
                      const isSubadmin = form.subadminIds.includes(faculty.id);

                      return (
                        <div
                          key={faculty.id}
                          className={`grid grid-cols-[1fr_76px_88px] items-center px-4 py-3 transition-colors sm:grid-cols-[1fr_100px_110px] ${
                            isFaculty || isSubadmin
                              ? 'bg-blue-50/50 dark:bg-blue-500/5'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                              {faculty.firstName} {faculty.lastName}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {faculty.facultyId || faculty.email}
                            </p>
                            {faculty.facultyId && faculty.email && (
                              <p className="truncate text-xs text-slate-400">
                                {faculty.email}
                              </p>
                            )}
                          </div>

                          <div className="flex justify-center">
                            <button
                              type="button"
                              aria-label={`Assign ${faculty.firstName} ${faculty.lastName} as Faculty`}
                              onClick={() => toggle('facultyIds', faculty.id)}
                              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                                isFaculty
                                  ? 'border-blue-600 bg-blue-600 text-white'
                                  : 'border-slate-300 bg-white text-transparent hover:border-blue-400 dark:border-slate-600 dark:bg-slate-900'
                              }`}
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="flex justify-center">
                            <button
                              type="button"
                              aria-label={`Assign ${faculty.firstName} ${faculty.lastName} as SubAdmin`}
                              onClick={() => toggle('subadminIds', faculty.id)}
                              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                                isSubadmin
                                  ? 'border-violet-600 bg-violet-600 text-white'
                                  : 'border-slate-300 bg-white text-transparent hover:border-violet-400 dark:border-slate-600 dark:bg-slate-900'
                              }`}
                            >
                              <ShieldCheck className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    selectAll(
                      'facultyIds',
                      users.faculty.map((faculty) => faculty.id),
                    )
                  }
                  className="font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  Select All Faculty
                </button>
                <button
                  type="button"
                  onClick={() => clearAll('facultyIds')}
                  className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Clear Faculty
                </button>
                <button
                  type="button"
                  onClick={() =>
                    selectAll(
                      'subadminIds',
                      facultyCandidates.map((candidate) => candidate.id),
                    )
                  }
                  className="font-semibold text-violet-600 hover:text-violet-800 dark:text-violet-400"
                >
                  Make All Candidates SubAdmin
                </button>
                <button
                  type="button"
                  onClick={() => clearAll('subadminIds')}
                  className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Clear SubAdmins
                </button>
              </div>
            </>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/80 dark:bg-slate-900 md:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-5 w-5 text-emerald-600" />
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">
                  Students
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Assign students who will participate in this pool.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-500">
                {form.studentIds.length}/{users.students.length} selected
              </span>
              <button
                type="button"
                onClick={() =>
                  selectAll(
                    'studentIds',
                    users.students.map((student) => student.id),
                  )
                }
                className="font-semibold text-blue-600 dark:text-blue-400"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() => clearAll('studentIds')}
                className="text-slate-500"
              >
                Clear
              </button>
            </div>
          </div>

          {loadingUsers ? (
            <div className="py-8">
              <LoadingSpinner />
            </div>
          ) : (
            renderSelectionList(
              'studentIds',
              users.students,
              (student) =>
                `${student.firstName} ${student.lastName} (${student.enrollmentNo || student.email})`,
            )
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/70">
          <h3 className="mb-3 font-semibold text-slate-800 dark:text-white">
            Assignment Summary
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              {
                label: 'Faculty',
                count: form.facultyIds.length,
                color: 'text-blue-600 dark:text-blue-400',
              },
              {
                label: 'SubAdmins',
                count: form.subadminIds.length,
                color: 'text-violet-600 dark:text-violet-400',
              },
              {
                label: 'Students',
                count: form.studentIds.length,
                color: 'text-emerald-600 dark:text-emerald-400',
              },
            ].map(({ label, count, color }) => (
              <div
                key={label}
                className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
              >
                <p className="text-xs text-slate-500">{label}</p>
                <p className={`mt-1 text-2xl font-bold ${color}`}>{count}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="sticky bottom-4 z-10 rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-xl backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/90">
          <button
            type="submit"
            disabled={loading || loadingUsers}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:from-blue-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Creating Pool...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Create Pool
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManagePoolsPage;