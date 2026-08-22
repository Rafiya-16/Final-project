import { api } from '@/config/api';

export const temporaryPermissionService = {
  getMyPermissions: async () => {
    const { data } = await api.get(
      '/temporary-permissions/me'
    );

    return data.data;
  },
};