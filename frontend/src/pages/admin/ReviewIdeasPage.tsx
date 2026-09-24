import React, { useEffect, useMemo, useState } from 'react';
import { poolService } from '@/services/poolService';
import { ideaService } from '@/services/ideaService';
import { Badge } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  CheckCircle2,
  Clock3,
  FileText,
  Lightbulb,
  MessageSquare,
  User,
  UserCheck,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { StudentIdea, Pool } from '@/types';

type Supervisor = {
  id: string;
  firstName: string;
  lastName: string;
  facultyId?: string | null;
};

const ReviewIdeasPage: React.FC = () => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [selectedPool, setSelectedPool] = useState('');
  const [ideas, setIdeas] = useState<StudentIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [supervisors, setSupervisors] = useState<
    Record<string, Supervisor[]>
  >({});

  const [selectedSupervisor, setSelectedSupervisor] = useState<
    Record<string, string>
  >({});

  const [loadingSupervisors, setLoadingSupervisors] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    const loadPools = async () => {
      try {
        const response = await poolService.list();
        const poolList = response.data || [];

        setPools(poolList);

        if (poolList.length > 0) {
          setSelectedPool(poolList[0].id);
        }
      } catch {
        toast.error('Failed to load pools');
      } finally {
        setLoading(false);
      }
    };

    loadPools();
  }, []);

  useEffect(() => {
    if (!selectedPool) {
      setIdeas([]);
      return;
    }

    const loadIdeas = async () => {
      setLoading(true);

      try {
        const response = await ideaService.listByPool(selectedPool);
        setIdeas(response || []);
      } catch {
        toast.error('Failed to load student ideas');
        setIdeas([]);
      } finally {
        setLoading(false);
      }
    };

    loadIdeas();
  }, [selectedPool]);

  const reloadIdeas = async () => {
    const response = await ideaService.listByPool(selectedPool);
    setIdeas(response || []);
  };

  const getPreferredSupervisors = (
    idea: StudentIdea
  ) => {
    return [...(idea.supervisorPreferences || [])].sort(
      (a, b) => a.preferenceOrder - b.preferenceOrder
    );
  };

  const decide = async (
    ideaId: string,
    action: 'approve' | 'reject'
  ) => {
    try {
      setProcessingId(ideaId);

      const fb = feedback[ideaId]?.trim() || '';

      if (action === 'approve') {
        await ideaService.approve(
          selectedPool,
          ideaId,
          fb
        );
      } else {
        await ideaService.reject(
          selectedPool,
          ideaId,
          fb
        );
      }

      toast.success(
        action === 'approve'
          ? 'Idea approved successfully'
          : 'Idea rejected successfully'
      );

      await reloadIdeas();

      setFeedback((current) => {
        const updated = { ...current };
        delete updated[ideaId];
        return updated;
      });
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          `Failed to ${action} idea`
      );
    } finally {
      setProcessingId(null);
    }
  };

  const loadSupervisors = async (idea: StudentIdea) => {
    if (idea.status !== 'UNDER_REVIEW') {
      return;
    }

    if (supervisors[idea.id]) {
      return;
    }

    try {
      setLoadingSupervisors((current) => ({
        ...current,
        [idea.id]: true,
      }));

      const response =
        await ideaService.getAvailableSupervisorsForAdmin(
          selectedPool
        );

      const available = response || [];

      setSupervisors((current) => ({
        ...current,
        [idea.id]: available,
      }));

      if (available.length === 1) {
        setSelectedSupervisor((current) => ({
          ...current,
          [idea.id]: available[0].id,
        }));
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          'Failed to load available supervisors'
      );
    } finally {
      setLoadingSupervisors((current) => ({
        ...current,
        [idea.id]: false,
      }));
    }
  };

  const assignSupervisor = async (ideaId: string) => {
    const supervisorId = selectedSupervisor[ideaId];

    if (!supervisorId) {
      toast.error('Please select a supervisor');
      return;
    }

    try {
      setProcessingId(ideaId);

      await ideaService.assignSupervisor(
        selectedPool,
        ideaId,
        supervisorId
      );

      toast.success(
        'Supervisor assigned successfully'
      );

      await reloadIdeas();

      setSelectedSupervisor((current) => {
        const updated = { ...current };
        delete updated[ideaId];
        return updated;
      });

      setSupervisors((current) => {
        const updated = { ...current };
        delete updated[ideaId];
        return updated;
      });
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          'Failed to assign supervisor'
      );
    } finally {
      setProcessingId(null);
    }
  };

  const pendingIdeas = useMemo(
    () =>
      ideas.filter(
        (idea) =>
          idea.status === 'SUBMITTED' ||
          idea.status === 'UNDER_REVIEW'
      ),
    [ideas]
  );

  const approvedIdeas = useMemo(
    () =>
      ideas.filter(
        (idea) => idea.status === 'APPROVED'
      ),
    [ideas]
  );

  const rejectedIdeas = useMemo(
    () =>
      ideas.filter(
        (idea) => idea.status === 'REJECTED'
      ),
    [ideas]
  );

  const selectedPoolName =
    pools.find((pool) => pool.id === selectedPool)?.name ||
    'Select Pool';

  if (loading && pools.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-full space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">
              <Lightbulb className="h-6 w-6 text-blue-600" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Student Ideas
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Review, approve, or reject student-proposed
                project ideas.
              </p>
            </div>
          </div>
        </div>

        {/* Pool Selector */}
        <div className="flex items-center gap-3">
          <label
            htmlFor="pool-select"
            className="text-sm font-medium text-gray-600"
          >
            Pool
          </label>

          <select
            id="pool-select"
            value={selectedPool}
            onChange={(event) =>
              setSelectedPool(event.target.value)
            }
            className="min-w-[190px] rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            {pools.length === 0 && (
              <option value="">No pools available</option>
            )}

            {pools.map((pool) => (
              <option
                key={pool.id}
                value={pool.id}
              >
                {pool.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Current Pool */}
      {selectedPool && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Current Pool
              </p>

              <p className="mt-1 text-sm font-semibold text-blue-950">
                {selectedPoolName}
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-blue-700">
              <FileText className="h-4 w-4" />

              {ideas.length} total idea
              {ideas.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Pending */}
        <div className="rounded-xl border border-yellow-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Pending Review
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {pendingIdeas.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100">
              <Clock3 className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Approved */}
        <div className="rounded-xl border border-green-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Approved
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {approvedIdeas.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>

        {/* Rejected */}
        <div className="rounded-xl border border-red-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Rejected
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {rejectedIdeas.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && selectedPool && (
        <div className="rounded-xl border bg-white p-10">
          <LoadingSpinner />
        </div>
      )}

      {/* Pending Ideas */}
      {!loading && pendingIdeas.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Pending Review
              </h2>

              <p className="text-sm text-gray-500">
                Submitted ideas require approval. Under-review ideas
                require manual supervisor assignment.
              </p>
            </div>

            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
              {pendingIdeas.length} pending
            </span>
          </div>

          <div className="space-y-4">
            {pendingIdeas.map((idea) => {
              const isProcessing =
                processingId === idea.id;

              const isUnderReview =
                idea.status === 'UNDER_REVIEW';

              const availableSupervisors =
                supervisors[idea.id] || [];

              const isLoadingSupervisors =
                loadingSupervisors[idea.id] || false;

              const preferredSupervisors =
                getPreferredSupervisors(idea);

              return (
                <div
                  key={idea.id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  {/* Card Header */}
                  <div className="border-b border-gray-100 bg-gray-50/70 px-5 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-100">
                          <Lightbulb className="h-5 w-5 text-yellow-600" />
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-gray-900">
                            {idea.title}
                          </h3>

                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">
                            <User className="h-3.5 w-3.5" />

                            <span>
                              {idea.student?.firstName}{' '}
                              {idea.student?.lastName}
                            </span>

                            {idea.student?.enrollmentNo && (
                              <>
                                <span className="text-gray-300">
                                  •
                                </span>

                                <span>
                                  {idea.student.enrollmentNo}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <Badge text={idea.status} />
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="space-y-5 p-5">
                    {/* Under Review Notice */}
                    {isUnderReview && (
                      <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                        <div className="flex items-start gap-3">
                          <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />

                          <div>
                            <p className="text-sm font-semibold text-orange-900">
                              Supervisor assignment required
                            </p>

                            <p className="mt-1 text-sm leading-5 text-orange-800">
                              All three preferred supervisors rejected
                              this request. The idea is now under review
                              and requires manual supervisor assignment.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Project Description
                      </p>

                      <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                        {idea.description ||
                          'No description provided.'}
                      </p>
                    </div>

                    {/* Information Grid */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {/* Domain */}
                      <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Domain
                        </p>

                        {idea.domain ? (
                          <div className="mt-2">
                            <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                              {idea.domain}
                            </span>
                          </div>
                        ) : (
                          <p className="mt-2 text-sm text-gray-400">
                            Not specified
                          </p>
                        )}
                      </div>

                      {/* Preferred Supervisors */}
                      <div className="min-w-[280px] rounded-lg bg-gray-50 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-gray-400" />

                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Preferred Supervisors
                          </p>
                        </div>

                        <div className="mt-2 space-y-2">
                          {preferredSupervisors.length > 0 ? (
                            preferredSupervisors.map(
                              (preference) => (
                                <div
                                  key={preference.id}
                                  className="rounded-md border border-gray-200 bg-white px-3 py-2"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-medium text-gray-800">
                                      {preference.faculty?.firstName}{' '}
                                      {preference.faculty?.lastName}
                                    </p>

                                    <span className="text-[10px] font-semibold text-gray-500">
                                      #
                                      {
                                        preference.preferenceOrder
                                      }
                                    </span>
                                  </div>

                                  {preference.faculty?.facultyId && (
                                    <p className="mt-0.5 text-xs text-gray-500">
                                      {
                                        preference.faculty
                                          .facultyId
                                      }
                                    </p>
                                  )}

                                  <span
                                    className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                      preference.responseStatus ===
                                      'ACCEPTED'
                                        ? 'bg-green-100 text-green-700'
                                        : preference.responseStatus ===
                                          'REJECTED'
                                        ? 'bg-red-100 text-red-700'
                                        : preference.responseStatus ===
                                          'CLOSED'
                                        ? 'bg-gray-100 text-gray-600'
                                        : 'bg-yellow-100 text-yellow-700'
                                    }`}
                                  >
                                    {
                                      preference.responseStatus
                                    }
                                  </span>
                                </div>
                              )
                            )
                          ) : (
                            <p className="text-sm text-gray-400">
                              Not specified
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Manual Supervisor Assignment */}
                    {isUnderReview && (
                      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                        <div className="flex items-start gap-3">
                          <UserCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

                          <div className="w-full">
                            <p className="text-sm font-semibold text-blue-900">
                              Assign Supervisor
                            </p>

                            <p className="mt-1 text-sm text-blue-700">
                              Select an available faculty member to
                              manually assign as supervisor.
                            </p>

                            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                              <select
                                value={
                                  selectedSupervisor[idea.id] || ''
                                }
                                onFocus={() =>
                                  loadSupervisors(idea)
                                }
                                onChange={(event) =>
                                  setSelectedSupervisor(
                                    (current) => ({
                                      ...current,
                                      [idea.id]:
                                        event.target.value,
                                    })
                                  )
                                }
                                disabled={
                                  isProcessing ||
                                  isLoadingSupervisors
                                }
                                className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-100"
                              >
                                <option value="">
                                  {isLoadingSupervisors
                                    ? 'Loading supervisors...'
                                    : 'Select a supervisor'}
                                </option>

                                {availableSupervisors.map(
                                  (supervisor) => (
                                    <option
                                      key={supervisor.id}
                                      value={supervisor.id}
                                    >
                                      {supervisor.firstName}{' '}
                                      {supervisor.lastName}
                                      {supervisor.facultyId
                                        ? ` (${supervisor.facultyId})`
                                        : ''}
                                    </option>
                                  )
                                )}
                              </select>

                              <button
                                type="button"
                                onClick={() =>
                                  assignSupervisor(idea.id)
                                }
                                disabled={
                                  isProcessing ||
                                  isLoadingSupervisors ||
                                  !selectedSupervisor[idea.id]
                                }
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <UserCheck className="h-4 w-4" />

                                {isProcessing
                                  ? 'Assigning...'
                                  : 'Assign Supervisor'}
                              </button>
                            </div>

                            {!isLoadingSupervisors &&
                              supervisors[idea.id] &&
                              availableSupervisors.length === 0 && (
                                <p className="mt-3 text-sm font-medium text-red-600">
                                  No faculty member currently has
                                  available supervisor capacity.
                                </p>
                              )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Feedback */}
                    {!isUnderReview && (
                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-gray-400" />

                          <label
                            htmlFor={`feedback-${idea.id}`}
                            className="text-xs font-semibold uppercase tracking-wide text-gray-500"
                          >
                            Admin Feedback
                          </label>

                          <span className="text-xs text-gray-400">
                            Optional
                          </span>
                        </div>

                        <textarea
                          id={`feedback-${idea.id}`}
                          value={feedback[idea.id] || ''}
                          onChange={(event) =>
                            setFeedback((current) => ({
                              ...current,
                              [idea.id]: event.target.value,
                            }))
                          }
                          placeholder="Add feedback for the student..."
                          rows={3}
                          disabled={isProcessing}
                          className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-100"
                        />
                      </div>
                    )}

                    {/* Actions */}
                    {!isUnderReview && (
                      <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            decide(idea.id, 'reject')
                          }
                          disabled={isProcessing}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />

                          {isProcessing
                            ? 'Processing...'
                            : 'Reject'}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            decide(idea.id, 'approve')
                          }
                          disabled={isProcessing}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-4 w-4" />

                          {isProcessing
                            ? 'Processing...'
                            : 'Approve & Assign to Team'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Decision History */}
      {!loading &&
        (approvedIdeas.length > 0 ||
          rejectedIdeas.length > 0) && (
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Decision History
              </h2>

              <p className="text-sm text-gray-500">
                Previously reviewed student ideas.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="divide-y divide-gray-100">
                {[...approvedIdeas, ...rejectedIdeas].map(
                  (idea) => {
                    const preferredSupervisors =
                      getPreferredSupervisors(idea);

                    return (
                      <div
                        key={idea.id}
                        className={`p-5 ${
                          idea.status === 'REJECTED'
                            ? 'bg-gray-50/60'
                            : 'bg-white'
                        }`}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex min-w-0 items-start gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                                idea.status === 'APPROVED'
                                  ? 'bg-green-100'
                                  : 'bg-red-100'
                              }`}
                            >
                              {idea.status === 'APPROVED' ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-600" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-semibold text-gray-900">
                                  {idea.title}
                                </h3>

                                <Badge text={idea.status} />
                              </div>

                              <p className="mt-1 text-sm text-gray-500">
                                {idea.student?.firstName}{' '}
                                {idea.student?.lastName}

                                {idea.student?.enrollmentNo && (
                                  <>
                                    {' '}
                                    •{' '}
                                    {idea.student.enrollmentNo}
                                  </>
                                )}
                              </p>

                              {idea.domain && (
                                <span className="mt-2 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">
                                  {idea.domain}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Preferred Supervisors */}
                          <div className="min-w-[280px] rounded-lg bg-gray-50 px-4 py-3">
                            <div className="flex items-center gap-2">
                              <UserCheck className="h-4 w-4 text-gray-400" />

                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                Preferred Supervisors
                              </p>
                            </div>

                            <div className="mt-2 space-y-2">
                              {preferredSupervisors.length > 0 ? (
                                preferredSupervisors.map(
                                  (preference) => (
                                    <div
                                      key={preference.id}
                                      className="rounded-md border border-gray-200 bg-white px-3 py-2"
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-medium text-gray-800">
                                          {preference.faculty?.firstName}{' '}
                                          {preference.faculty?.lastName}
                                        </p>

                                        <span className="text-[10px] font-semibold text-gray-500">
                                          #
                                          {
                                            preference.preferenceOrder
                                          }
                                        </span>
                                      </div>

                                      {preference.faculty
                                        ?.facultyId && (
                                        <p className="mt-0.5 text-xs text-gray-500">
                                          {
                                            preference.faculty
                                              .facultyId
                                          }
                                        </p>
                                      )}

                                      <span
                                        className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                          preference.responseStatus ===
                                          'ACCEPTED'
                                            ? 'bg-green-100 text-green-700'
                                            : preference.responseStatus ===
                                              'REJECTED'
                                            ? 'bg-red-100 text-red-700'
                                            : preference.responseStatus ===
                                              'CLOSED'
                                            ? 'bg-gray-100 text-gray-600'
                                            : 'bg-yellow-100 text-yellow-700'
                                        }`}
                                      >
                                        {
                                          preference.responseStatus
                                        }
                                      </span>
                                    </div>
                                  )
                                )
                              ) : (
                                <p className="text-sm text-gray-400">
                                  Not specified
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Admin Feedback */}
                        {idea.adminFeedback && (
                          <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />

                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Admin Feedback
                                </p>

                                <p className="mt-1 text-sm leading-5 text-gray-600">
                                  {idea.adminFeedback}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </section>
        )}

      {/* Empty State */}
      {!loading &&
        selectedPool &&
        ideas.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-2">
            <EmptyState
              title="No student ideas"
              subtitle="Students haven't submitted any ideas for this pool yet."
            />
          </div>
        )}

      {/* No Pool */}
      {!loading && pools.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <FileText className="h-6 w-6 text-gray-400" />
          </div>

          <h3 className="mt-4 text-base font-semibold text-gray-900">
            No pools available
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Create a project pool before reviewing student
            ideas.
          </p>
        </div>
      )}
    </div>
  );
};

export default ReviewIdeasPage;