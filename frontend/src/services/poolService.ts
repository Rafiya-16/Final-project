
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
  /**
   * Get pools available to the current user.
   *
   * The backend may filter results based on the user's role
   * and assigned pools. Scope can further control the result set.
   */
  list: async (
    page = 1,
    scope: PoolListScope = 'all'
  ) => {
    const { data } = await api.get(
      `/pools?page=${page}&scope=${scope}`
    );

    return data;
  },

  /**
   * Get one pool by ID.
   */
  getById: async (id: string) => {
    const { data } = await api.get(`/pools/${id}`);

    return data.data;
  },

  /**
   * Create a pool.
   */
  create: async (body: CreatePoolInput) => {
    const { data } = await api.post('/pools', body);

    return data.data;
  },

  /**
   * Update a pool.
   */
  update: async (
    id: string,
    body: Partial<Pool>
  ) => {
    const { data } = await api.put(
      `/pools/${id}`,
      body
    );

    return data;
  },

  /**
   * Activate a pool.
   */
  activate: async (id: string) => {
    const { data } = await api.post(
      `/pools/${id}/activate`
    );

    return data;
  },

  /**
   * Move a pool to the next phase.
   */
  advancePhase: async (id: string) => {
    const { data } = await api.post(
      `/pools/${id}/advance-phase`
    );

    return data;
  },

  /**
   * Freeze a pool.
   */
  freeze: async (id: string) => {
    const { data } = await api.post(
      `/pools/${id}/freeze`
    );

    return data;
  },

  /**
   * Archive a pool.
   */
  archive: async (id: string) => {
    const { data } = await api.post(
      `/pools/${id}/archive`
    );

    return data;
  },

  /**
   * Assign students, faculty, or subadmins to a pool.
   */
  assignUsers: async (
    id: string,
    body: AssignUsersInput
  ) => {
    const { data } = await api.post(
      `/pools/${id}/assign-users`,
      body
    );

    return data;
  },

  /**
   * Remove faculty from a pool.
   */
  removeFaculty: async (
    poolId: string,
    facultyId: string
  ) => {
    const { data } = await api.delete(
      `/pools/${poolId}/faculty/${facultyId}`
    );

    return data.data;
  },

  /**
   * Remove a subadmin from a pool.
   */
  removeSubadmin: async (
    poolId: string,
    subadminId: string
  ) => {
    const { data } = await api.delete(
      `/pools/${poolId}/subadmins/${subadminId}`
    );

    return data.data;
  },

  /**
   * Get pool statistics.
   */
  getStats: async (id: string) => {
    const { data } = await api.get(
      `/pools/${id}/stats`
    );

    return data.data;
  },
};

export default poolService;
