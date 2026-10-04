// frontend/src/services/poolService.ts

import api from '@/config/api';

import type {
  CreatePoolInput,
  AssignUsersInput,
  Pool,
} from '@/types';

export type PoolListScope =
  | 'all'
  | 'faculty'
  | 'subadmin'
  | 'student';

export const poolService = {
 
  list: async (
    page = 1,
    scope: PoolListScope = 'all'
  ) => {
    const { data } = await api.get(
      `/pools?page=${page}&scope=${scope}`
    );

    return data;
  },

  getById: async (
    id: string
  ) => {
    const { data } =
      await api.get(`/pools/${id}`);

    return data.data;
  },

  create: async (
    body: CreatePoolInput
  ) => {
    const { data } =
      await api.post('/pools', body);

    return data.data;
  },

  update: async (
    id: string,
    body: Partial<Pool>
  ) => {
    const { data } =
      await api.put(
        `/pools/${id}`,
        body
      );

    return data;
  },

  activate: async (
    id: string
  ) => {
    const { data } =
      await api.post(
        `/pools/${id}/activate`
      );

    return data;
  },

  advancePhase: async (
    id: string
  ) => {
    const { data } =
      await api.post(
        `/pools/${id}/advance-phase`
      );

    return data;
  },

  freeze: async (
    id: string
  ) => {
    const { data } =
      await api.post(
        `/pools/${id}/freeze`
      );

    return data;
  },

  archive: async (
    id: string
  ) => {
    const { data } =
      await api.post(
        `/pools/${id}/archive`
      );

    return data;
  },

  assignUsers: async (
    id: string,
    body: AssignUsersInput
  ) => {
    const { data } =
      await api.post(
        `/pools/${id}/assign-users`,
        body
      );

    return data;
  },

  removeFaculty: async (
    poolId: string,
    facultyId: string
  ) => {
    const { data } =
      await api.delete(
        `/pools/${poolId}/faculty/${facultyId}`
      );

    return data.data;
  },

  removeSubadmin: async (
    poolId: string,
    subadminId: string
  ) => {
    const { data } =
      await api.delete(
        `/pools/${poolId}/subadmins/${subadminId}`
      );

    return data.data;
  },

  getStats: async (
    id: string
  ) => {
    const { data } =
      await api.get(
        `/pools/${id}/stats`
      );

    return data.data;
  },
};