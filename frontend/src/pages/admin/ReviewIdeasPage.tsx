// frontend/src/pages/admin/ReviewIdeasPage.tsx

import React, { useState, useEffect } from 'react';
import { poolService } from '@/services/poolService';
import { ideaService } from '@/services/ideaService';
import { Badge } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Lightbulb,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { StudentIdea, Pool } from '@/types';

const ReviewIdeasPage: React.FC = () => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [selectedPool, setSelectedPool] = useState('');
  const [ideas, setIdeas] = useState<StudentIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  useEffect(() => {
    poolService
      .list()
      .then((r) => {
        const p = r.data || [];

        setPools(p);

        if (p.length) {
          setSelectedPool(p[0].id);
        }
      })
      .catch(() => {
        toast.error('Failed to load pools');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedPool) return;

    setLoading(true);

    ideaService
      .listByPool(selectedPool)
      .then((r) => {
        setIdeas(r || []);
      })
      .catch(() => {
        toast.error('Failed to load student ideas');
        setIdeas([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedPool]);

  const decide = async (
    ideaId: string,
    action: 'approve' | 'reject'
  ) => {
    try {
      const fb = feedback[ideaId] || '';

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

      toast.success(`Idea ${action}d`);

      const r = await ideaService.listByPool(selectedPool);
      setIdeas(r || []);

      setFeedback((current) => {
        const updated = { ...current };
        delete updated[ideaId];
        return updated;
      });
    } catch (e: any) {
      toast.error(
        e.response?.data?.message ||
          `Failed to ${action} idea`
      );
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const pending = ideas.filter(
    (idea) =>
      idea.status === 'SUBMITTED' ||
      idea.status === 'UNDER_REVIEW'
  );

  const decided = ideas.filter(
    (idea) =>
      idea.status === 'APPROVED' ||
      idea.status === 'REJECTED'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Student Ideas
        </h1>

        <select
          value={selectedPool}
          onChange={(e) =>
            setSelectedPool(e.target.value)
          }
          className="px-3 py-2 border rounded-lg text-sm outline-none"
        >
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

      {/* Pending Ideas */}
      {pending.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-yellow-800">
            Pending Review ({pending.length})
          </h2>

          {pending.map((idea) => (
            <div
              key={idea.id}
              className="bg-white rounded-xl border p-5"
            >
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-yellow-500 mt-1" />

                <div className="flex-1">
                  {/* Title + Status */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">
                      {idea.title}
                    </h3>

                    <Badge text={idea.status} />
                  </div>

                  {/* Student */}
                  <p className="text-sm text-gray-500 mt-1">
                    By:{' '}
                    {idea.student?.firstName}{' '}
                    {idea.student?.lastName}

                    {idea.student?.enrollmentNo && (
                      <>
                        {' '}
                        ({idea.student.enrollmentNo})
                      </>
                    )}
                  </p>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mt-2">
                    {idea.description}
                  </p>

                  {/* Preferred Supervisor */}
                  {idea.preferredSupervisor && (
                    <div >
                      <p className="text-s font-semibold text-gray-500 mt-1.5 uppercase">
                        Preferred Supervisor
                      </p>

                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {idea.preferredSupervisor.firstName}{' '}
                        {idea.preferredSupervisor.lastName}
                      </p>

                      {idea.preferredSupervisor.facultyId && (
                        <p className="text-xs text-gray-500 mt-1">
                          Faculty ID:{' '}
                          {idea.preferredSupervisor.facultyId}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Domain */}
                  {idea.domain && (
                    <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      {idea.domain}
                    </span>
                  )}

                  {/* Feedback */}
                  <div className="mt-4">
                    <textarea
                      value={feedback[idea.id] || ''}
                      onChange={(e) =>
                        setFeedback((current) => ({
                          ...current,
                          [idea.id]: e.target.value,
                        }))
                      }
                      placeholder="Admin feedback (optional)"
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={() =>
                        decide(idea.id, 'approve')
                      }
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve & Assign to Team
                    </button>

                    <button
                      onClick={() =>
                        decide(idea.id, 'reject')
                      }
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Decided Ideas */}
      {decided.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">
            Decided ({decided.length})
          </h2>

          {decided.map((idea) => (
            <div
              key={idea.id}
              className={`bg-white rounded-xl border p-4 ${
                idea.status === 'REJECTED'
                  ? 'opacity-60'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {idea.title}
                  </h4>

                  <p className="text-sm text-gray-500">
                    {idea.student?.firstName}{' '}
                    {idea.student?.lastName}
                  </p>
                </div>

                <Badge text={idea.status} />
              </div>

              {/* Preferred Supervisor */}
              {idea.preferredSupervisor && (
                <p className="text-sm text-gray-500 mt-2">
                  Preferred Supervisor:{' '}
                  {idea.preferredSupervisor.firstName}{' '}
                  {idea.preferredSupervisor.lastName}
                </p>
              )}

              {/* Admin Feedback */}
              {idea.adminFeedback && (
                <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                  Feedback: {idea.adminFeedback}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {ideas.length === 0 && (
        <EmptyState
          title="No student ideas"
          subtitle="Students haven't submitted any ideas yet"
        />
      )}
    </div>
  );
};

export default ReviewIdeasPage;