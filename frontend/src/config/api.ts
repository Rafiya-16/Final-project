import axios from 'axios';

const API_URL =
  import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/*
 * Attach access token to every API request.
 */
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('accessToken');

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/*
 * Handle expired access tokens.
 */
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    /*
     * Access token expired.
     */
    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !originalRequest?.url?.includes('/auth/')
    ) {
      originalRequest._retry = true;

      try {
        const { data } =
          await api.post('/auth/refresh');

        const newAccessToken =
          data?.data?.accessToken;

        if (!newAccessToken) {
          throw new Error(
            'Access token missing from refresh response'
          );
        }

        localStorage.setItem(
          'accessToken',
          newAccessToken
        );

        originalRequest.headers =
          originalRequest.headers || {};

        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem(
          'accessToken'
        );

        /*
         * Clear persisted auth state as well.
         */
        localStorage.removeItem('auth');

        window.location.href = '/login';

        return Promise.reject(refreshError);
      }
    }

    /*
     * 403 means the server received the request
     * but refused permission.
     *
     * Do NOT redirect to login here because
     * the user may already be authenticated.
     */
    if (error.response?.status === 403) {
      console.error(
        '403 Forbidden:',
        error.response?.data
      );
    }

    return Promise.reject(error);
  }
);

export default api;