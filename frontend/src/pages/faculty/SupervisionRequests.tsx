import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle,
  Clock,
  FileText,
  GraduationCap,
  Loader2,
  Mail,
  RefreshCw,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { ideaService } from '@/services/ideaService';
import { poolService } from '@/services/poolService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getErrorMessage } from '@/types';
import type {
  Pool,
  SupervisorPreferenceStatus,
  SupervisionRequest,
} from '@/types';

const MAX_SUPERVISOR_CAPACITY = 4;

const SupervisionRequests: React.FC = () => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [selectedPool, setSelectedPool] = useState('');
  const [requests, setRequests] = useState<SupervisionRequest[]>([]);
  const [loadingPools, setLoadingPools] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [processingIdeaId, setProcessingIdeaId] = useState<string | null>(
    null
  );
  const [rejectingIdeaId, setRejectingIdeaId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadPools = async () => {
      setLoadingPools(true);

      try {
        const response = await poolService.list();
        const poolData: Pool[] = response.data || [];

        setPools(poolData);

        if (poolData.length > 0) {
          setSelectedPool((current) => current || poolData[0].id);
        }
      } catch (error: unknown) {
        toast.error(getErrorMessage(error));
        setPools([]);
      } finally {
        setLoadingPools(false);
      }
    };

    loadPools();
  }, []);

  const loadRequests = async () => {
    if (!selectedPool) {
      setRequests([]);
      return;
    }

    setLoadingRequests(true);

    try {
      const data = await ideaService.getSupervisionRequests(selectedPool);
      setRequests(data || []);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [selectedPool]);

  const filteredRequests = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return requests;
    }

    return requests.filter((request) => {
      const idea = request.studentIdea;
      const student = idea.student;

      const searchableText = [
        idea.title,
        idea.description,
        idea.domain || '',
        student?.firstName || '',
        student?.lastName || '',
        student?.email || '',
        student?.enrollmentNo || '',
      ]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [requests, searchTerm]);

  const acceptRequest = async (ideaId: string) => {
    setProcessingIdeaId(ideaId);

    try {
      await ideaService.acceptSupervision(selectedPool, ideaId);

      toast.success('Student proposal accepted successfully.');

      await loadRequests();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setProcessingIdeaId(null);
    }
  };

  const rejectRequest = async (ideaId: string) => {
    setProcessingIdeaId(ideaId);

    try {
      await ideaService.rejectSupervision(
        selectedPool,
        ideaId,
        rejectNote.trim() || undefined
      );

      toast.success('Supervision request rejected.');

      setRejectingIdeaId(null);
      setRejectNote('');

      await loadRequests();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setProcessingIdeaId(null);
    }
  };

  const selectedPoolData = pools.find((pool) => pool.id === selectedPool);

  if (loadingPools) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27]/5 via-[#CADEFC]/20 to-[#C3BEF0]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a0e27] via-[#0f172a] to-[#1a1a3e] p-6 shadow-xl">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#C3BEF0]/10 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/15 rounded-xl">
                  <GraduationCap className="w-7 h-7 text-blue-400" />
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Student Proposals
                  </h1>
                  <p className="text-blue-200/60 text-sm mt-1">
                    Review student project ideas requesting your supervision
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={loadRequests}
              disabled={loadingRequests || !selectedPool}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  loadingRequests ? 'animate-spin' : ''
                }`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Pool selector */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-[#CADEFC]/60 shadow-sm p-5">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <label
                htmlFor="supervision-pool"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Project Pool
              </label>

              <select
                id="supervision-pool"
                value={selectedPool}
                onChange={(event) => setSelectedPool(event.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#CADEFC] bg-white text-gray-700 text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
              >
                {pools.length === 0 ? (
                  <option value="">No pools available</option>
                ) : (
                  pools.map((pool) => (
                    <option key={pool.id} value={pool.id}>
                      {pool.name} — {pool.academicYear} / {pool.semester}
                    </option>
                  ))
                )}
              </select>
            </div>

            {selectedPoolData && (
              <div className="md:min-w-[220px]">
                <p className="text-xs text-gray-500 mb-1">Pool Status</p>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 text-sm font-medium">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  {selectedPoolData.status.replace(/_/g, ' ')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={<Clock className="w-5 h-5 text-amber-600" />}
            iconClass="bg-amber-100"
            value={requests.length}
            label="Pending Requests"
          />

          <StatCard
            icon={<Users className="w-5 h-5 text-blue-600" />}
            iconClass="bg-blue-100"
            value={MAX_SUPERVISOR_CAPACITY}
            label="Maximum Student Ideas"
          />

          <StatCard
            icon={<UserCheck className="w-5 h-5 text-emerald-600" />}
            iconClass="bg-emerald-100"
            value={`${MAX_SUPERVISOR_CAPACITY - requests.length < 0 ? 0 : MAX_SUPERVISOR_CAPACITY - requests.length}`}
            label="Remaining Capacity*"
          />
        </div>

        <p className="text-xs text-gray-500">
          * Remaining capacity shown here is based only on pending requests.
          Existing approved projects and already-assigned student ideas also
          count toward the supervisor's actual capacity.
        </p>

        {/* Search */}
        {requests.length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-[#CADEFC]/60 p-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by student, enrollment number, title, domain..."
              className="w-full px-4 py-2.5 rounded-xl border border-[#CADEFC] text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            />
          </div>
        )}

        {/* Requests */}
        {loadingRequests ? (
          <div className="bg-white/90 rounded-2xl border border-[#CADEFC]/60 p-12 flex justify-center">
            <div className="flex items-center gap-3 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading supervision requests...
            </div>
          </div>
        ) : !selectedPool ? (
          <EmptyState
            title="No project pool available"
            message="There are currently no project pools available for supervision requests."
          />
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            title={
              requests.length === 0
                ? 'No pending supervision requests'
                : 'No matching requests'
            }
            message={
              requests.length === 0
                ? 'You do not have any approved student proposals waiting for your response.'
                : 'Try changing your search term.'
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <SupervisionRequestCard
                key={request.id}
                request={request}
                processing={
                  processingIdeaId === request.studentIdea.id
                }
                rejecting={
                  rejectingIdeaId === request.studentIdea.id
                }
                rejectNote={rejectNote}
                onAccept={() => acceptRequest(request.studentIdea.id)}
                onStartReject={() => {
                  setRejectingIdeaId(request.studentIdea.id);
                  setRejectNote('');
                }}
                onCancelReject={() => {
                  setRejectingIdeaId(null);
                  setRejectNote('');
                }}
                onReject={() => rejectRequest(request.studentIdea.id)}
                onRejectNoteChange={setRejectNote}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  iconClass: string;
  value: string | number;
  label: string;
}> = ({ icon, iconClass, value, label }) => (
  <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-[#CADEFC]/60 p-5 shadow-sm">
    <div className="flex items-center gap-3">
      <div className={`p-2.5 rounded-xl ${iconClass}`}>{icon}</div>

      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  </div>
);

const SupervisionRequestCard: React.FC<{
  request: SupervisionRequest;
  processing: boolean;
  rejecting: boolean;
  rejectNote: string;
  onAccept: () => void;
  onStartReject: () => void;
  onCancelReject: () => void;
  onReject: () => void;
  onRejectNoteChange: (value: string) => void;
}> = ({
  request,
  processing,
  rejecting,
  rejectNote,
  onAccept,
  onStartReject,
  onCancelReject,
  onReject,
  onRejectNoteChange,
}) => {
  const idea = request.studentIdea;
  const student = idea.student;

  const preferenceLabel = (status: SupervisorPreferenceStatus) => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'ACCEPTED':
        return 'Accepted';
      case 'REJECTED':
        return 'Rejected';
      case 'CLOSED':
        return 'Closed';
      case 'EXPIRED':
        return 'Expired';
      default:
        return status;
    }
  };

  return (
    <div className="bg-white/95 rounded-2xl border border-[#CADEFC]/60 shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div className="flex gap-4 flex-1">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-[#C3BEF0] flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-blue-700" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-gray-800">
                  {idea.title}
                </h2>

                <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
                  Pending
                </span>
              </div>

              {idea.domain && (
                <p className="text-sm text-blue-600 font-medium mt-1">
                  {idea.domain}
                </p>
              )}

              <p className="text-xs text-gray-500 mt-2">
                Submitted{' '}
                {idea.createdAt
                  ? new Date(idea.createdAt).toLocaleDateString()
                  : '—'}
              </p>
            </div>
          </div>

          {/* Student information */}
          <div className="lg:min-w-[280px] bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Student
            </p>

            <p className="font-semibold text-gray-800">
              {student
                ? `${student.firstName} ${student.lastName}`
                : 'Student'}
            </p>

            {student?.enrollmentNo && (
              <p className="text-xs text-gray-500 mt-1">
                Enrollment: {student.enrollmentNo}
              </p>
            )}

            {student?.email && (
              <a
                href={`mailto:${student.email}`}
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline mt-1"
              >
                <Mail className="w-3 h-3" />
                {student.email}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Project Idea
        </h3>

        <p className="text-sm text-gray-600 leading-6 whitespace-pre-wrap">
          {idea.description}
        </p>
      </div>

      {/* Supervisor preferences */}
      {idea.supervisorPreferences?.length > 0 && (
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Student's Supervisor Preferences
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {idea.supervisorPreferences
              .slice()
              .sort((a, b) => a.preferenceOrder - b.preferenceOrder)
              .map((preference) => (
                <div
                  key={preference.id}
                  className={`rounded-xl border p-3 ${
                    preference.id === request.id
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-gray-500">
                      Preference {preference.preferenceOrder}
                    </span>

                    <span className="text-[11px] font-semibold text-gray-500">
                      {preferenceLabel(preference.responseStatus)}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-gray-800 mt-2">
                    {preference.faculty.firstName}{' '}
                    {preference.faculty.lastName}
                  </p>

                  {preference.faculty.designation && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {preference.faculty.designation}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-6">
        {rejecting ? (
          <div className="space-y-3">
            <label
              htmlFor={`reject-note-${idea.id}`}
              className="block text-sm font-semibold text-gray-700"
            >
              Rejection note
            </label>

            <textarea
              id={`reject-note-${idea.id}`}
              value={rejectNote}
              onChange={(event) => onRejectNoteChange(event.target.value)}
              rows={3}
              placeholder="Optional note for the student/admin..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none resize-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
            />

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onReject}
                disabled={processing}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserX className="w-4 h-4" />
                )}
                Confirm Rejection
              </button>

              <button
                type="button"
                onClick={onCancelReject}
                disabled={processing}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-700">
                Supervision decision
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Accepting assigns you as the supervisor for this student idea.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onStartReject}
                disabled={processing}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <UserX className="w-4 h-4" />
                Reject
              </button>

              <button
                type="button"
                onClick={onAccept}
                disabled={processing}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Accept Supervision
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const EmptyState: React.FC<{
  title: string;
  message: string;
}> = ({ title, message }) => (
  <div className="bg-white/90 rounded-2xl border border-[#CADEFC]/60 p-12 text-center">
    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 flex items-center justify-center">
      <GraduationCap className="w-8 h-8 text-blue-500" />
    </div>

    <h2 className="text-lg font-bold text-gray-800">{title}</h2>

    <p className="text-sm text-gray-500 mt-2 max-w-lg mx-auto">
      {message}
    </p>
  </div>
);

export default SupervisionRequests;