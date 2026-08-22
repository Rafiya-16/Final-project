import { api } from '@/config/api';
import type { Permission, TemporaryPermission } from '@/types';

interface CreateTemporaryPermissionInput {
  userId: string;
  permission: Permission;
  startsAt: string;
  expiresAt: string;
}

export const temporaryPermissionService = {
  listAll: async (): Promise<TemporaryPermission[]> => {
    const { data } = await api.get('/temporary-permissions');
    return data.data;
  },

  listForUser: async (userId: string): Promise<TemporaryPermission[]> => {
    const { data } = await api.get(`/temporary-permissions/user/${userId}`);
    return data.data;
  },

  create: async (body: CreateTemporaryPermissionInput): Promise<TemporaryPermission> => {
    const { data } = await api.post('/temporary-permissions', body);
    return data.data;
  },

  revoke: async (id: string): Promise<TemporaryPermission> => {
    const { data } = await api.delete(`/temporary-permissions/${id}`);
    return data.data;
  },
};
