// frontend/src/services/authService.ts
import api from '@/config/api';

export const authService = {
  login: async (identifier: string, password: string) => {
  const response = await api.post('/auth/login', { identifier, password, });
  return response.data;
},
  logout: async () => { await api.post('/auth/logout'); },
  getMe: async () => { const { data } = await api.get('/auth/me'); return data.data; },
  changePassword: async (oldPassword: string, newPassword: string) => {
    await api.put('/auth/change-password', { oldPassword, newPassword });
  },
};