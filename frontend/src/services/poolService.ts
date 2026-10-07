import api from '@/config/api';
import type {
  CreatePoolInput,
  AssignUsersInput,
  Pool,
} from '@/types';

export const poolService = {
  /*
   * Get pools available to the currently logged-in user.
   *
   * Backend automatically filters:
   * ADMIN    -> all pools
   * SUBADMIN -> assigned pools
   * FACULTY  -> assigned pools
   * STUDENT  -> assigned pools
   */
  list: async (page = 1) => {
    const { data } = await api.get(`/pools?page=${page}`);

    return data;
  },

  /*
   * Get one pool by ID.
   */
  getById: async (id: string) => {
    const { data } = await api.get(`/pools/${id}`);

    return data.data;
  },

  /*
   * Create pool - ADMIN only.
   */
  create: async (body: CreatePoolInput) => {
    const { data } = await api.post('/pools', body);

    return data.data;
  },

  /*
   * Update pool - ADMIN only.
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

  /*
   * Activate pool - ADMIN only.
   */
  activate: async (id: string) => {
    const { data } = await api.post(
      `/pools/${id}/activate`
    );

    return data;
  },

  /*
   * Move pool to next phase - ADMIN only.
   */
  advancePhase: async (id: string) => {
    const { data } = await api.post(
      `/pools/${id}/advance-phase`
    );

    return data;
  },

  /*
   * Freeze pool - ADMIN only.
   */
  freeze: async (id: string) => {
    const { data } = await api.post(
      `/pools/${id}/freeze`
    );

    return data;
  },

  /*
   * Archive pool - ADMIN only.
   */
  archive: async (id: string) => {
    const { data } = await api.post(
      `/pools/${id}/archive`
    );

    return data;
  },

  /*
   * Assign students/faculty/subadmins - ADMIN only.
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

  /*
   * Pool statistics.
   */
  getStats: async (id: string) => {
    const { data } = await api.get(
      `/pools/${id}/stats`
    );

    return data.data;
  },
};

export default poolService;