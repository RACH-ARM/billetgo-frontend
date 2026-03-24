import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Intercepteur request — ajouter le token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Promise partagée pour éviter les refreshs concurrents (plusieurs 401 simultanés)
let refreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;

const doRefresh = (token: string) => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        `${api.defaults.baseURL}/auth/refresh`,
        { refreshToken: token },
        { headers: { 'Content-Type': 'application/json' } }
      )
      .then(({ data }) => data.data as { accessToken: string; refreshToken: string })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

// Intercepteur response — gérer le refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    // Tente un refresh si 401, pas déjà en retry, et pas une route qui ne doit pas déclencher de refresh
    // (refresh lui-même, login, register — mais PAS /auth/me qui est une route protégée)
    const noRefreshRoutes = ['/auth/refresh', '/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password', '/auth/verify-email'];
    const isNoRefreshRoute = noRefreshRoutes.some((r) => original.url?.includes(r));
    if (status === 401 && !original._retry && !isNoRefreshRoute) {
      original._retry = true;
      const token = localStorage.getItem('refreshToken');
      if (token) {
        try {
          const { accessToken: newAccess, refreshToken: newRefresh } = await doRefresh(token);
          localStorage.setItem('accessToken', newAccess);
          localStorage.setItem('refreshToken', newRefresh);
          // Sync le store Zustand (import dynamique pour éviter la dépendance circulaire)
          import('../stores/authStore').then(({ useAuthStore }) => {
            useAuthStore.getState().setTokens(newAccess, newRefresh);
          });
          original.headers.Authorization = `Bearer ${newAccess}`;
          return api(original);
        } catch (refreshError) {
          // Ne pas déconnecter si le refresh a échoué à cause du réseau
          const isNetworkError = !(refreshError as { response?: unknown }).response;
          if (isNetworkError) return Promise.reject(refreshError);
          // Refresh échoué côté serveur (token révoqué, expiré) — purger et rediriger sans reload
          Promise.all([
            import('../stores/authStore').then(({ useAuthStore }) => useAuthStore.getState().forceLogout()),
            import('../router').then(({ router }) => router.navigate('/login', { replace: true })),
          ]);
          return Promise.reject(error);
        }
      } else {
        // Pas de refresh token — session invalide
        Promise.all([
          import('../stores/authStore').then(({ useAuthStore }) => useAuthStore.getState().forceLogout()),
          import('../router').then(({ router }) => router.navigate('/login', { replace: true })),
        ]);
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
