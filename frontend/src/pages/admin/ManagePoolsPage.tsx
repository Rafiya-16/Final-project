// frontend/src/pages/admin/ManagePoolsPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { poolService } from '@/services/poolService';
import { userService } from '@/services/userService';
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
} from 'lucide-react';
import { Badge } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';
import type { Pool, User, CreatePoolInput } from '@/types';
import { getErrorMessage } from '@/types';

const ManagePoolsPage: React.FC = () => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);

    try {
      const r = await poolService.list();
      setPools(r.data || []);
    } catch {
      toast.error('Failed to load allocation pools');
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
    <div className="min-h-full space-y-6 pb-8">
      {/* ================= HEADER ================= */}
      <div
        className="
          relative overflow-hidden rounded-3xl
          border border-slate-200/80 dark:border-slate-700/80
          bg-gradient-to-br
          from-[#fffdf8] via-white to-blue-50/70
          dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30
          p-6 md:p-7
          shadow-sm dark:shadow-black/20
          animate-[fadeInUp_0.5s_ease-out]
        "
      >
        {/* Decorative glow */}
        <div
          className="
            pointer-events-none absolute -right-20 -top-20
            h-52 w-52 rounded-full
            bg-blue-200/30 dark:bg-blue-500/10
            blur-3xl
          "
        />

        <div
          className="
            pointer-events-none absolute -bottom-24 left-1/3
            h-48 w-48 rounded-full
            bg-violet-200/20 dark:bg-violet-500/10
            blur-3xl
          "
        />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span
                className="
                  inline-flex items-center gap-1.5 rounded-full
                  border border-blue-200/80 dark:border-blue-500/20
                  bg-blue-50/80 dark:bg-blue-500/10
                  px-3 py-1 text-xs font-semibold
                  text-blue-700 dark:text-blue-300
                "
              >
                <Sparkles className="h-3.5 w-3.5" />
                Administration
              </span>
            </div>

            <h1
              className="
                text-2xl font-bold tracking-tight
                text-slate-800 dark:text-white
                md:text-3xl
              "
            >
              Allocation Pools
            </h1>

            <p
              className="
                mt-2 max-w-2xl text-sm leading-6
                text-slate-500 dark:text-slate-400
              "
            >
              Create and manage project allocation pools for different
              academic sessions, departments and student groups.
            </p>
          </div>

          <button
            onClick={() => setShowCreate(true)}
            className="
              group inline-flex shrink-0 items-center justify-center gap-2
              rounded-xl px-5 py-3
              text-sm font-semibold text-white
              bg-gradient-to-r from-blue-600 to-violet-600
              shadow-lg shadow-blue-500/20
              transition-all duration-300
              hover:-translate-y-0.5
              hover:from-blue-700 hover:to-violet-700
              hover:shadow-xl hover:shadow-blue-500/25
              active:translate-y-0
            "
          >
            <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
            Create Pool
            <ArrowUpRight
              className="
                h-4 w-4 opacity-70
                transition-transform duration-300
                group-hover:-translate-y-0.5 group-hover:translate-x-0.5
              "
            />
          </button>
        </div>
      </div>

      {/* ================= POOL CONTENT ================= */}
      {loading ? (
        <div
          className="
            flex min-h-[280px] items-center justify-center
            rounded-3xl
            border border-slate-200/80 dark:border-slate-700/80
            bg-white/80 dark:bg-slate-900/70
            shadow-sm
          "
        >
          <LoadingSpinner />
        </div>
      ) : pools.length === 0 ? (
        <div
          className="
            rounded-3xl
            border border-slate-200/80 dark:border-slate-700/80
            bg-white/80 dark:bg-slate-900/70
            p-8 shadow-sm
          "
        >
          <EmptyState
            title="No pools"
            subtitle="Create your first allocation pool"
          />
        </div>
      ) : (
        <div className="grid gap-5">
          {pools.map((pool, index) => {
            const faculty = pool._count?.faculty || 0;
            const students = pool._count?.students || 0;
            const projects = pool._count?.projects || 0;
            const teams = pool._count?.teams || 0;

            return (
              <div
                key={pool.id}
                onClick={() => navigate(`/pools/${pool.id}`)}
                style={{
                  animationDelay: `${index * 70}ms`,
                }}
                className="
                  group relative cursor-pointer overflow-hidden
                  rounded-2xl
                  border border-slate-200/80 dark:border-slate-700/80
                  bg-white dark:bg-slate-900
                  p-5 md:p-6
                  shadow-sm
                  transition-all duration-300
                  hover:-translate-y-1
                  hover:border-blue-200 dark:hover:border-blue-500/30
                  hover:shadow-xl hover:shadow-blue-500/10
                  animate-[fadeInUp_0.5s_ease-out_both]
                "
              >
                {/* Top gradient */}
                <div
                  className="
                    absolute inset-x-0 top-0 h-1
                    bg-gradient-to-r
                    from-blue-500 via-violet-500 to-emerald-400
                    opacity-0 transition-opacity duration-300
                    group-hover:opacity-100
                  "
                />

                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  {/* Pool Identity */}
                  <div className="flex min-w-0 items-start gap-4">
                    <div
                      className="
                        flex h-12 w-12 shrink-0 items-center justify-center
                        rounded-2xl
                        border border-blue-100 dark:border-blue-500/20
                        bg-gradient-to-br
                        from-blue-50 to-violet-50
                        dark:from-blue-500/10 dark:to-violet-500/10
                        transition-all duration-300
                        group-hover:scale-105
                        group-hover:rotate-1
                      "
                    >
                      <FolderKanban
                        className="
                          h-5 w-5
                          text-blue-600 dark:text-blue-400
                        "
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          className="
                            truncate text-base font-bold
                            text-slate-800 dark:text-white
                            md:text-lg
                          "
                        >
                          {pool.name}
                        </h3>

                        <Badge text={pool.status} />
                      </div>

                      <p
                        className="
                          mt-1.5 flex flex-wrap items-center gap-1.5
                          text-sm text-slate-500 dark:text-slate-400
                        "
                      >
                        <span>{pool.academicYear}</span>
                        <span className="text-slate-300 dark:text-slate-600">
                          •
                        </span>
                        <span>{pool.semester}</span>

                        {pool.department && (
                          <>
                            <span className="text-slate-300 dark:text-slate-600">
                              •
                            </span>
                            <span>{pool.department}</span>
                          </>
                        )}
                      </p>

                      <div
                        className="
                          mt-3 flex items-center gap-1.5
                          text-xs text-slate-400 dark:text-slate-500
                        "
                      >
                        <CalendarDays className="h-3.5 w-3.5" />
                        Allocation pool
                      </div>
                    </div>
                  </div>

                  {/* Stats + Arrow */}
                  <div
                    className="
                      flex flex-col gap-4
                      sm:flex-row sm:items-center
                    "
                  >
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {/* Faculty */}
                      <div
                        className="
                          min-w-[105px] rounded-xl
                          border border-slate-100 dark:border-slate-700
                          bg-slate-50/80 dark:bg-slate-800/70
                          px-3 py-2.5
                          transition-colors duration-300
                          group-hover:bg-blue-50/60
                          dark:group-hover:bg-blue-500/5
                        "
                      >
                        <div className="flex items-center gap-1.5">
                          <UserCog className="h-3.5 w-3.5 text-blue-500" />
                          <span
                            className="
                              text-[11px] font-medium
                              text-slate-400 dark:text-slate-500
                            "
                          >
                            Faculty
                          </span>
                        </div>

                        <p
                          className="
                            mt-1 text-base font-bold
                            text-slate-700 dark:text-slate-200
                          "
                        >
                          {faculty}
                        </p>
                      </div>

                      {/* Students */}
                      <div
                        className="
                          min-w-[105px] rounded-xl
                          border border-slate-100 dark:border-slate-700
                          bg-slate-50/80 dark:bg-slate-800/70
                          px-3 py-2.5
                          transition-colors duration-300
                          group-hover:bg-violet-50/60
                          dark:group-hover:bg-violet-500/5
                        "
                      >
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="h-3.5 w-3.5 text-violet-500" />
                          <span
                            className="
                              text-[11px] font-medium
                              text-slate-400 dark:text-slate-500
                            "
                          >
                            Students
                          </span>
                        </div>

                        <p
                          className="
                            mt-1 text-base font-bold
                            text-slate-700 dark:text-slate-200
                          "
                        >
                          {students}
                        </p>
                      </div>

                      {/* Projects */}
                      <div
                        className="
                          min-w-[105px] rounded-xl
                          border border-slate-100 dark:border-slate-700
                          bg-slate-50/80 dark:bg-slate-800/70
                          px-3 py-2.5
                          transition-colors duration-300
                          group-hover:bg-emerald-50/60
                          dark:group-hover:bg-emerald-500/5
                        "
                      >
                        <div className="flex items-center gap-1.5">
                          <Layers3 className="h-3.5 w-3.5 text-emerald-500" />
                          <span
                            className="
                              text-[11px] font-medium
                              text-slate-400 dark:text-slate-500
                            "
                          >
                            Projects
                          </span>
                        </div>

                        <p
                          className="
                            mt-1 text-base font-bold
                            text-slate-700 dark:text-slate-200
                          "
                        >
                          {projects}
                        </p>
                      </div>

                      {/* Teams */}
                      <div
                        className="
                          min-w-[105px] rounded-xl
                          border border-slate-100 dark:border-slate-700
                          bg-slate-50/80 dark:bg-slate-800/70
                          px-3 py-2.5
                          transition-colors duration-300
                          group-hover:bg-amber-50/60
                          dark:group-hover:bg-amber-500/5
                        "
                      >
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-amber-500" />
                          <span
                            className="
                              text-[11px] font-medium
                              text-slate-400 dark:text-slate-500
                            "
                          >
                            Teams
                          </span>
                        </div>

                        <p
                          className="
                            mt-1 text-base font-bold
                            text-slate-700 dark:text-slate-200
                          "
                        >
                          {teams}
                        </p>
                      </div>
                    </div>

                    <div
                      className="
                        hidden h-10 w-10 shrink-0 items-center justify-center
                        rounded-xl
                        border border-slate-200 dark:border-slate-700
                        bg-slate-50 dark:bg-slate-800
                        text-slate-400 dark:text-slate-500
                        transition-all duration-300
                        group-hover:border-blue-200
                        group-hover:bg-blue-50
                        group-hover:text-blue-600
                        dark:group-hover:border-blue-500/30
                        dark:group-hover:bg-blue-500/10
                        dark:group-hover:text-blue-400
                        sm:flex
                      "
                    >
                      <ChevronRight
                        className="
                          h-5 w-5
                          transition-transform duration-300
                          group-hover:translate-x-0.5
                        "
                      />
                    </div>
                  </div>
                </div>

                {/* Mobile action */}
                <div
                  className="
                    mt-4 flex items-center justify-end
                    border-t border-slate-100 dark:border-slate-800
                    pt-4 sm:hidden
                  "
                >
                  <span
                    className="
                      flex items-center gap-1 text-xs font-semibold
                      text-blue-600 dark:text-blue-400
                    "
                  >
                    Open Pool
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= ANIMATION ================= */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

/* =========================================================
   CREATE POOL
========================================================= */

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
  teamFreezeDate: string;
  subadminIds: string[];
  facultyIds: string[];
  studentIds: string[];
}

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
    teamFreezeDate: '',
    subadminIds: [],
    facultyIds: [],
    studentIds: [],
  });

  const [users, setUsers] = useState<{
    subadmins: User[];
    faculty: User[];
    students: User[];
  }>({
    subadmins: [],
    faculty: [],
    students: [],
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
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
    ]).then(([s, f, st]) =>
      setUsers({
        subadmins: s.data,
        faculty: f.data,
        students: st.data,
      }),
    );
  }, []);

  const set = (k: keyof CreatePoolFormState, v: string) =>
    setForm((f) => ({
      ...f,
      [k]: v,
    }));

  const toggle = (
    list: 'subadminIds' | 'facultyIds' | 'studentIds',
    id: string,
  ) => {
    setForm((f) => {
      const arr = f[list];

      return {
        ...f,
        [list]: arr.includes(id)
          ? arr.filter((x) => x !== id)
          : [...arr, id],
      };
    });
  };

  const selectAll = (
    list: 'subadminIds' | 'facultyIds' | 'studentIds',
    ids: string[],
  ) =>
    setForm((f) => ({
      ...f,
      [list]: ids,
    }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data: CreatePoolInput = {
        ...form,
        submissionStart: new Date(
          form.submissionStart,
        ).toISOString(),
        submissionEnd: new Date(
          form.submissionEnd,
        ).toISOString(),
        reviewStart: new Date(form.reviewStart).toISOString(),
        reviewEnd: new Date(form.reviewEnd).toISOString(),
        decisionDeadline: new Date(
          form.decisionDeadline,
        ).toISOString(),
        selectionStart: new Date(
          form.selectionStart,
        ).toISOString(),
        selectionEnd: new Date(
          form.selectionEnd,
        ).toISOString(),
        teamFreezeDate: new Date(
          form.teamFreezeDate,
        ).toISOString(),
      };

      await poolService.create(data);

      toast.success('Pool created!');
      onBack();
    } catch (e: unknown) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const dateFields: {
    key: keyof CreatePoolFormState;
    label: string;
  }[] = [
    {
      key: 'submissionStart',
      label: 'Submission Start (Faculty)',
    },
    {
      key: 'submissionEnd',
      label: 'Submission End (Faculty)',
    },
    {
      key: 'reviewStart',
      label: 'Review Start (Subadmin)',
    },
    {
      key: 'reviewEnd',
      label: 'Review End (Subadmin)',
    },
    {
      key: 'decisionDeadline',
      label: 'Decision Deadline (Admin)',
    },
    {
      key: 'selectionStart',
      label: 'Selection Start (Student)',
    },
    {
      key: 'selectionEnd',
      label: 'Selection End (Student)',
    },
    {
      key: 'teamFreezeDate',
      label: 'Team Freeze (Student)',
    },
  ];

  const userSections: {
    key: 'subadminIds' | 'facultyIds' | 'studentIds';
    label: string;
    items: User[];
    display: (u: User) => string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'subadminIds',
      label: 'Subadmins',
      items: users.subadmins,
      display: (u: User) =>
        `${u.firstName} ${u.lastName} (${u.email})`,
      icon: <ShieldCheck className="h-4 w-4" />,
    },
    {
      key: 'facultyIds',
      label: 'Faculty',
      items: users.faculty,
      display: (u: User) =>
        `${u.firstName} ${u.lastName} (${u.facultyId || ''})`,
      icon: <UserCog className="h-4 w-4" />,
    },
    {
      key: 'studentIds',
      label: 'Students',
      items: users.students,
      display: (u: User) =>
        `${u.firstName} ${u.lastName} (${u.enrollmentNo || ''})`,
      icon: <GraduationCap className="h-4 w-4" />,
    },
  ];

  const inputClass = `
    mt-1.5 w-full rounded-xl
    border border-slate-200 dark:border-slate-700
    bg-white dark:bg-slate-900
    px-3.5 py-2.5
    text-sm text-slate-700 dark:text-slate-200
    placeholder:text-slate-400 dark:placeholder:text-slate-500
    outline-none
    transition-all duration-200
    focus:border-blue-400 dark:focus:border-blue-500
    focus:ring-4 focus:ring-blue-500/10
  `;

  return (
    <div className="min-h-full pb-8">
      <form
        onSubmit={submit}
        className="mx-auto max-w-4xl space-y-5"
      >
        {/* ================= FORM HEADER ================= */}
        <div
          className="
            relative overflow-hidden rounded-3xl
            border border-slate-200/80 dark:border-slate-700/80
            bg-gradient-to-br
            from-[#fffdf8] via-white to-blue-50/60
            dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30
            p-6 md:p-7
            shadow-sm
            animate-[fadeInUp_0.5s_ease-out]
          "
        >
          <div
            className="
              absolute -right-16 -top-16
              h-44 w-44 rounded-full
              bg-blue-200/25 dark:bg-blue-500/10
              blur-3xl
            "
          />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="
                    inline-flex items-center gap-1.5 rounded-full
                    border border-violet-200 dark:border-violet-500/20
                    bg-violet-50 dark:bg-violet-500/10
                    px-3 py-1 text-xs font-semibold
                    text-violet-700 dark:text-violet-300
                  "
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  New Allocation
                </span>
              </div>

              <h2
                className="
                  text-2xl font-bold tracking-tight
                  text-slate-800 dark:text-white
                  md:text-3xl
                "
              >
                Create Pool
              </h2>

              <p
                className="
                  mt-2 text-sm leading-6
                  text-slate-500 dark:text-slate-400
                "
              >
                Configure the academic session, timeline and
                participants for your allocation pool.
              </p>
            </div>

            <button
              type="button"
              onClick={onBack}
              className="
                inline-flex shrink-0 items-center gap-2
                rounded-xl
                border border-slate-200 dark:border-slate-700
                bg-white/80 dark:bg-slate-800/80
                px-3.5 py-2
                text-sm font-medium
                text-slate-600 dark:text-slate-300
                transition-all duration-200
                hover:-translate-x-0.5
                hover:border-blue-200 dark:hover:border-blue-500/30
                hover:text-blue-600 dark:hover:text-blue-400
              "
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          </div>
        </div>

        {/* ================= BASIC INFO ================= */}
        <div
          className="
            rounded-2xl
            border border-slate-200/80 dark:border-slate-700/80
            bg-white dark:bg-slate-900
            p-5 shadow-sm md:p-6
            animate-[fadeInUp_0.55s_ease-out]
          "
        >
          <div className="mb-5 flex items-center gap-3">
            <div
              className="
                flex h-10 w-10 items-center justify-center
                rounded-xl bg-blue-50 dark:bg-blue-500/10
                text-blue-600 dark:text-blue-400
              "
            >
              <FolderKanban className="h-5 w-5" />
            </div>

            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white">
                Basic Information
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Define the identity of this allocation pool.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-3">
              <label
                className="
                  text-sm font-medium
                  text-slate-700 dark:text-slate-300
                "
              >
                Pool Name *
              </label>

              <input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                required
                className={inputClass}
                placeholder="PCS 2027 Odd"
              />
            </div>

            <div>
              <label
                className="
                  text-sm font-medium
                  text-slate-700 dark:text-slate-300
                "
              >
                Academic Year
              </label>

              <input
                value={form.academicYear}
                onChange={(e) =>
                  set('academicYear', e.target.value)
                }
                className={inputClass}
              />
            </div>

            <div>
              <label
                className="
                  text-sm font-medium
                  text-slate-700 dark:text-slate-300
                "
              >
                Semester
              </label>

              <select
                value={form.semester}
                onChange={(e) =>
                  set('semester', e.target.value)
                }
                className={inputClass}
              >
                <option>Odd</option>
                <option>Even</option>
              </select>
            </div>

            <div>
              <label
                className="
                  text-sm font-medium
                  text-slate-700 dark:text-slate-300
                "
              >
                Department
              </label>

              <input
                value={form.department}
                onChange={(e) =>
                  set('department', e.target.value)
                }
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* ================= TIMELINE ================= */}
        <div
          className="
            rounded-2xl
            border border-slate-200/80 dark:border-slate-700/80
            bg-white dark:bg-slate-900
            p-5 shadow-sm md:p-6
            animate-[fadeInUp_0.6s_ease-out]
          "
        >
          <div className="mb-5 flex items-center gap-3">
            <div
              className="
                flex h-10 w-10 items-center justify-center
                rounded-xl bg-violet-50 dark:bg-violet-500/10
                text-violet-600 dark:text-violet-400
              "
            >
              <Clock3 className="h-5 w-5" />
            </div>

            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white">
                Allocation Timeline
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Set the important dates for every allocation stage.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {dateFields.map(({ key, label }) => (
              <div key={key}>
                <label
                  className="
                    text-sm font-medium
                    text-slate-700 dark:text-slate-300
                  "
                >
                  {label} *
                </label>

                <input
                  type="datetime-local"
                  value={form[key] as string}
                  onChange={(e) =>
                    set(key, e.target.value)
                  }
                  required
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ================= USER SECTIONS ================= */}
        {userSections.map(
          ({ key, label, items, display, icon }, sectionIndex) => (
            <div
              key={key}
              className="
                rounded-2xl
                border border-slate-200/80 dark:border-slate-700/80
                bg-white dark:bg-slate-900
                p-5 shadow-sm md:p-6
                animate-[fadeInUp_0.65s_ease-out]
              "
              style={{
                animationDelay: `${sectionIndex * 80}ms`,
              }}
            >
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="
                      flex h-10 w-10 items-center justify-center
                      rounded-xl
                      bg-emerald-50 dark:bg-emerald-500/10
                      text-emerald-600 dark:text-emerald-400
                    "
                  >
                    {icon}
                  </div>

                  <div>
                    <h3
                      className="
                        font-semibold
                        text-slate-800 dark:text-white
                      "
                    >
                      {label}
                    </h3>

                    <p
                      className="
                        text-xs
                        text-slate-400 dark:text-slate-500
                      "
                    >
                      {form[key].length} selected out of{' '}
                      {items.length}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    selectAll(
                      key,
                      items.map((i) => i.id),
                    )
                  }
                  className="
                    self-start rounded-lg
                    border border-blue-100 dark:border-blue-500/20
                    bg-blue-50/70 dark:bg-blue-500/10
                    px-3 py-1.5
                    text-xs font-semibold
                    text-blue-600 dark:text-blue-400
                    transition-all duration-200
                    hover:bg-blue-100 dark:hover:bg-blue-500/15
                    sm:self-auto
                  "
                >
                  Select All
                </button>
              </div>

              <div
                className="
                  max-h-56 overflow-y-auto
                  rounded-xl
                  border border-slate-200 dark:border-slate-700
                  bg-slate-50/50 dark:bg-slate-950/30
                  p-2
                "
              >
                {items.length === 0 ? (
                  <div
                    className="
                      flex min-h-20 items-center justify-center
                      text-sm text-slate-400 dark:text-slate-500
                    "
                  >
                    No active {label.toLowerCase()} available.
                  </div>
                ) : (
                  items.map((u: User) => {
                    const selected = form[key].includes(u.id);

                    return (
                      <label
                        key={u.id}
                        className={`
                          flex cursor-pointer items-center gap-3
                          rounded-xl p-3
                          transition-all duration-200
                          ${
                            selected
                              ? `
                                border border-blue-100
                                bg-blue-50/80
                                dark:border-blue-500/20
                                dark:bg-blue-500/10
                              `
                              : `
                                border border-transparent
                                hover:bg-white
                                dark:hover:bg-slate-800
                              `
                          }
                        `}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() =>
                            toggle(key, u.id)
                          }
                          className="
                            h-4 w-4 rounded
                            border-slate-300
                            text-blue-600
                            focus:ring-blue-500
                            dark:border-slate-600
                            dark:bg-slate-800
                          "
                        />

                        <span
                          className={`
                            min-w-0 text-sm
                            ${
                              selected
                                ? 'font-medium text-blue-700 dark:text-blue-300'
                                : 'text-slate-600 dark:text-slate-300'
                            }
                          `}
                        >
                          {display(u)}
                        </span>

                        {selected && (
                          <CheckCircle2
                            className="
                              ml-auto h-4 w-4 shrink-0
                              text-blue-500 dark:text-blue-400
                            "
                          />
                        )}
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          ),
        )}

        {/* ================= SUBMIT ================= */}
        <div
          className="
            sticky bottom-4 z-10
            rounded-2xl
            border border-slate-200/80 dark:border-slate-700/80
            bg-white/90 dark:bg-slate-900/90
            p-3
            shadow-xl shadow-slate-900/5
            backdrop-blur-xl
            animate-[fadeInUp_0.7s_ease-out]
          "
        >
          <button
            type="submit"
            disabled={loading}
            className="
              group flex w-full items-center justify-center gap-2
              rounded-xl
              bg-gradient-to-r from-blue-600 to-violet-600
              px-5 py-3
              text-sm font-semibold text-white
              shadow-lg shadow-blue-500/20
              transition-all duration-300
              hover:-translate-y-0.5
              hover:from-blue-700 hover:to-violet-700
              hover:shadow-xl hover:shadow-blue-500/25
              disabled:cursor-not-allowed
              disabled:opacity-60
              disabled:hover:translate-y-0
            "
          >
            {loading ? (
              <>
                <span
                  className="
                    h-4 w-4 animate-spin rounded-full
                    border-2 border-white/30
                    border-t-white
                  "
                />
                Creating Pool...
              </>
            ) : (
              <>
                <Plus
                  className="
                    h-4 w-4
                    transition-transform duration-300
                    group-hover:rotate-90
                  "
                />
                Create Pool
              </>
            )}
          </button>
        </div>
      </form>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ManagePoolsPage;