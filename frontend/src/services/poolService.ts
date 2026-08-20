import api from '@/config/api';
import type { CreatePoolInput, AssignUsersInput, Pool } from '@/types';

export const poolService = {
  list: async (page = 1) => { const { data } = await api.get(`/pools?page=${page}`); return data; },
  getById: async (id: string) => { const { data } = await api.get(`/pools/${id}`); return data.data; },
  create: async (body: CreatePoolInput) => { const { data } = await api.post('/pools', body); return data.data; },
  update: async (id: string, body: Partial<Pool>) => { const { data } = await api.put(`/pools/${id}`, body); return data; },
  activate: async (id: string) => { const { data } = await api.post(`/pools/${id}/activate`); return data; },
  advancePhase: async (id: string) => { const { data } = await api.post(`/pools/${id}/advance-phase`); return data; },
  freeze: async (id: string) => { const { data } = await api.post(`/pools/${id}/freeze`); return data; },
  archive: async (id: string) => { const { data } = await api.post(`/pools/${id}/archive`); return data; },
  restore: async (id: string) => {
  const { data } = await api.post(`/pools/${id}/restore`);
  return data;
},
  assignUsers: async (id: string, body: AssignUsersInput) => { const { data } = await api.post(`/pools/${id}/assign-users`, body); return data; },
  getStats: async (id: string) => { const { data } = await api.get(`/pools/${id}/stats`); return data.data; },
};