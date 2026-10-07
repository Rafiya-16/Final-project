// frontend/src/services/teamService.ts

import api from '@/config/api';

export const teamService = {
  // ============================================================
  // Team Creation & Listing
  // ============================================================

  create: async (poolId: string, name: string) => {
    const { data } = await api.post(`/pools/${poolId}/teams`, {
      name,
    });

    return data.data;
  },

  listByPool: async (poolId: string) => {
    const { data } = await api.get(`/pools/${poolId}/teams`);

    return data.data;
  },

  getMyTeam: async (poolId: string) => {
    const { data } = await api.get(`/pools/${poolId}/my-team`);

    return data.data;
  },

  getMyInvites: async (poolId: string) => {
    const { data } = await api.get(`/pools/${poolId}/my-invites`);

    return data.data;
  },

  // ============================================================
  // Team Invitations
  // ============================================================

  invite: async (
    poolId: string,
    teamId: string,
    studentId: string,
    message?: string
  ) => {
    const { data } = await api.post(
      `/pools/${poolId}/teams/${teamId}/invite`,
      {
        studentId,
        message,
      }
    );

    return data;
  },

  respond: async (
    poolId: string,
    inviteId: string,
    accept: boolean
  ) => {
    const { data } = await api.post(
      `/pools/${poolId}/invites/${inviteId}/respond`,
      {
        accept,
      }
    );

    return data;
  },

  // ============================================================
  // Project Selection
  // ============================================================

  selectProject: async (
    poolId: string,
    teamId: string,
    projectId: string
  ) => {
    const { data } = await api.post(
      `/pools/${poolId}/teams/${teamId}/select-project`,
      {
        projectId,
      }
    );

    return data;
  },

  // ============================================================
  // Team Leave Request
  // ============================================================

  /**
   * Student submits a leave request.
   *
   * The student is NOT removed from the team immediately.
   * Supervisor/Faculty must approve the request first.
   */
  createLeaveRequest: async (
    poolId: string,
    teamId: string,
    reason: string
  ) => {
    const { data } = await api.post(
      `/pools/${poolId}/teams/${teamId}/leave-request`,
      {
        reason,
      }
    );

    return data;
  },

  /**
   * Legacy direct leave method.
   *
   * Backend now blocks direct leaving and requires
   * a supervisor-approved leave request.
   */
  leave: async (
    poolId: string,
    teamId: string
  ) => {
    const { data } = await api.post(
      `/pools/${poolId}/teams/${teamId}/leave`
    );

    return data;
  },

  // ============================================================
  // Faculty - Team Leave Requests
  // ============================================================

  /**
   * Get all team leave requests for the logged-in faculty member.
   *
   * Backend endpoint:
   * GET /api/pools/team-leave-requests
   */
  getLeaveRequestsForFaculty: async () => {
    const { data } = await api.get(
      '/pools/team/leave-requests'
    );

    return data.data ?? data;
  },

  /**
   * Faculty approves or rejects a team leave request.
   *
   * status:
   * - APPROVED
   * - REJECTED
   *
   * responseNote is optional.
   */
  reviewLeaveRequest: async (
    requestId: string,
    status: 'APPROVED' | 'REJECTED',
    responseNote?: string
  ) => {
    const { data } = await api.patch(
      `/pools/team/leave-requests/${requestId}`,
      {
        status,
        responseNote,
      }
    );

    return data.data ?? data;
  },

  // ============================================================
  // Other Team Operations
  // ============================================================

  removeMember: async (
    poolId: string,
    teamId: string,
    memberId: string
  ) => {
    const { data } = await api.delete(
      `/pools/${poolId}/teams/${teamId}/members/${memberId}`
    );

    return data;
  },

  dissolve: async (
    poolId: string,
    teamId: string
  ) => {
    const { data } = await api.post(
      `/pools/${poolId}/teams/${teamId}/dissolve`
    );

    return data;
  },

 createDissolveRequest: async (
  poolId: string,
  teamId: string,
  reason: string
) => {
  const { data } = await api.post(
    `/pools/${poolId}/teams/${teamId}/dissolve-request`,
    { reason }
  );

  return data;
},

getDissolveRequestsForFaculty: async () => {
  const { data } = await api.get(
    '/pools/team/dissolve-requests'
  );

  return data.data ?? data;
},

reviewDissolveRequest: async (
  requestId: string,
  status: 'APPROVED' | 'REJECTED',
  responseNote?: string
) => {
  const { data } = await api.patch(
    `/pools/team/dissolve-requests/${requestId}`,
    {
      status,
      responseNote,
    }
  );

  return data.data ?? data;
},
};