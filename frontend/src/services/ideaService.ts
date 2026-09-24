import api from '@/config/api';
import type {
  AvailableSupervisor,
  IdeaInput,
  SupervisionRequest,
} from '@/types';

export const ideaService = {
  submit: async (
    poolId: string,
    body: IdeaInput
  ) => {
    const { data } = await api.post(
      `/pools/${poolId}/ideas`,
      body
    );

    return data.data;
  },

  getMyIdeas: async (poolId: string) => {
    const { data } = await api.get(
      `/pools/${poolId}/ideas/mine`
    );

    return data.data;
  },

  listByPool: async (poolId: string) => {
    const { data } = await api.get(
      `/pools/${poolId}/ideas`
    );

    return data.data;
  },

  getAvailableSupervisors: async (
    poolId: string
  ): Promise<AvailableSupervisor[]> => {
    const { data } = await api.get(
      `/pools/${poolId}/ideas/available-supervisors`
    );

    return data.data;
  },

  getAvailableSupervisorsForAdmin: async (
  poolId: string
): Promise<AvailableSupervisor[]> => {
  const { data } = await api.get(
    `/pools/${poolId}/ideas/available-supervisors/admin`
  );

  return data.data;
},

  approve: async (
    poolId: string,
    id: string,
    feedback?: string
  ) => {
    const { data } = await api.post(
      `/pools/${poolId}/ideas/${id}/approve`,
      { feedback }
    );

    return data.data;
  },

  reject: async (
    poolId: string,
    id: string,
    feedback?: string
  ) => {
    const { data } = await api.post(
      `/pools/${poolId}/ideas/${id}/reject`,
      { feedback }
    );

    return data.data;
  },

  getSupervisionRequests: async ( poolId: string
  ): Promise<SupervisionRequest[]> => {
    const { data } = await api.get(
      `/pools/${poolId}/ideas/supervision-requests`
    );

    return data.data;
  },

  acceptSupervision: async (
    poolId: string,
    ideaId: string,
    note?: string
  ) => {
    const { data } = await api.post(
      `/pools/${poolId}/ideas/${ideaId}/supervision/accept`,
      { note }
    );

    return data.data;
  },

  rejectSupervision: async (
    poolId: string,
    ideaId: string,
    note?: string
  ) => {
    const { data } = await api.post(
      `/pools/${poolId}/ideas/${ideaId}/supervision/reject`,
      { note }
    );

    return data.data;
  },

  assignSupervisor: async (
    poolId: string,
    ideaId: string,
    supervisorId: string
  ) => {
    const { data } = await api.post(
      `/pools/${poolId}/ideas/${ideaId}/supervisor`,
      { supervisorId }
    );

    return data.data;
  },
};