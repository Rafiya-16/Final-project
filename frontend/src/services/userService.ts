import api from '@/config/api';
import type { CreateUserInput } from '@/types';

export const userService = {
  list: async (params: Record<string, string> = {}) => {
    const q = new URLSearchParams(params).toString();
    const { data } = await api.get(`/users?${q}`);
    return data;
  },
  getById: async (id: string) => { const { data } = await api.get(`/users/${id}`); return data.data; },
  create: async (body: CreateUserInput) => { const { data } = await api.post('/users', body); return data.data; },
  update: async (id: string, body: Partial<CreateUserInput>) => { const { data } = await api.put(`/users/${id}`, body); return data; },
  toggleStatus: async (id: string) => { const { data } = await api.patch(`/users/${id}/toggle-status`); return data; },
  resetPassword: async (id: string) => { const { data } = await api.post(`/users/${id}/reset-password`); return data.data; },
  getStats: async () => { const { data } = await api.get('/users/stats'); return data.data; },
  bulkImport: async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);

    const { data } = await api.post('/users/bulk-import', fd, {
      timeout: 180000,
    });

    return data.data;
  },
  downloadTemplate: async () => {
    const { data } = await api.get('/users/import/template', { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([data]));
    const a = document.createElement('a'); a.href = url; a.download = 'template.csv'; a.click(); URL.revokeObjectURL(url);
  },
  getImportHistory: async (page = 1) => { const { data } = await api.get(`/users/import/jobs?page=${page}`); return data; },
};