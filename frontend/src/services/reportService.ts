// frontend/src/services/reportService.ts
import api from '@/config/api';

export const reportService = {
  teamReport: async (poolId: string) => { const { data } = await api.get(`/pools/${poolId}/reports/teams`); return data.data; },
  summary: async (poolId: string) => { const { data } = await api.get(`/pools/${poolId}/reports/summary`); return data.data; },
  facultyReport: async (poolId: string) => { const { data } = await api.get(`/pools/${poolId}/reports/faculty`); return data.data; },
  unassigned: async (poolId: string) => { const { data } = await api.get(`/pools/${poolId}/reports/unassigned`); return data.data; },
};