import api from '@/config/api';
import type { ProjectInput, ReviewDecision } from '@/types';

export const projectService = {
  listByPool: async (poolId: string) => {
    const { data } = await api.get(`/pools/${poolId}/projects`);
    return data.data;
  },

  getById: async (poolId: string, id: string) => {
    const { data } = await api.get(`/pools/${poolId}/projects/${id}`);
    return data.data;
  },

  submit: async (poolId: string, body: ProjectInput) => {
    const { data } = await api.post(`/pools/${poolId}/projects`, body);
    return data.data;
  },

  finalize: async (poolId: string) => {
    const { data } = await api.post(`/pools/${poolId}/projects/finalize`);
    return data;
  },

  edit: async (
    poolId: string,
    id: string,
    body: Partial<ProjectInput>
  ) => {
    const { data } = await api.put(
      `/pools/${poolId}/projects/${id}`,
      body
    );

    return data.data;
  },

  remove: async (poolId: string, id: string) => {
    const { data } = await api.delete(
      `/pools/${poolId}/projects/${id}`
    );

    return data;
  },

  lock: async (
    poolId: string,
    id: string,
    note?: string
  ) => {
    const { data } = await api.post(
      `/pools/${poolId}/projects/${id}/lock`,
      { note }
    );

    return data;
  },

  hold: async (
    poolId: string,
    id: string,
    note?: string
  ) => {
    const { data } = await api.post(
      `/pools/${poolId}/projects/${id}/hold`,
      { note }
    );

    return data;
  },

  reviewBatch: async (
    poolId: string,
    facultyId: string,
    decisions: ReviewDecision[]
  ) => {
    const { data } = await api.post(
      `/pools/${poolId}/faculty/${facultyId}/review`,
      { decisions }
    );

    return data;
  },

  approve: async (
    poolId: string,
    id: string,
    note?: string
  ) => {
    const { data } = await api.post(
      `/pools/${poolId}/projects/${id}/approve`,
      { note }
    );

    return data;
  },

  reject: async (
    poolId: string,
    id: string,
    note?: string
  ) => {
    const { data } = await api.post(
      `/pools/${poolId}/projects/${id}/reject`,
      { note }
    );

    return data;
  },

  /*
   * Check a proposed project against existing projects
   * in the selected pool.
   */
  checkSimilarity: async (
    poolId: string,
    data: {
      title: string;
      description: string;
      domain?: string;
    }
  ) => {
    const response = await api.post(
      `/pools/${poolId}/projects/check-similarity`,
      data
    );

    return response.data.data;
  },

  approveAllLocked: async (poolId: string) => {
    const { data } = await api.post(
      `/pools/${poolId}/projects/approve-all-locked`
    );

    return data;
  },

  getHeld: async (poolId: string) => {
    const { data } = await api.get(
      `/pools/${poolId}/projects/on-hold`
    );

    return data.data;
  },

  getFacultyStatus: async (poolId: string) => {
    const { data } = await api.get(
      `/pools/${poolId}/faculty-status`
    );

    return data.data;
  },
};