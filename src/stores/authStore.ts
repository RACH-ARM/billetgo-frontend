import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginPayload, RegisterPayload } from '../types/user';
import api from '../services/api';
import { useCartStore } from './cartStore';
import { queryClient } from '../lib/queryClient';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
  markEmailVerified: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (payload) => {
        set({ isLoading: true });
        // Purge tout le cache avant de charger les données du nouveau compte
        queryClient.clear();
        try {
          const { data } = await api.post('/auth/login', payload);
          const { user, accessToken, refreshToken } = data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      register: async (payload) => {
        set({ isLoading: true });
        queryClient.clear();
        try {
          const { data } = await api.post('/auth/register', payload);
          const { user, accessToken, refreshToken } = data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        const { refreshToken } = get();
        // 1. Vider le store et le panier de façon synchrone, avant la redirection
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
        useCartStore.getState().clearCart();
        // 2. Purger tout le cache React Query — aucune donnée de l'ancienne session ne survit
        queryClient.clear();
        // 3. Nettoyer le localStorage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // 4. Fire-and-forget — ne bloque pas sur l'appel serveur
        if (refreshToken) api.post('/auth/logout', { refreshToken }).catch(() => {});
      },

      setTokens: (accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ accessToken, refreshToken });
      },

      markEmailVerified: () => {
        set((state) => state.user ? { user: { ...state.user, isVerified: true } } : {});
      },

    }),
    {
      name: 'billetgo-auth',
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken, refreshToken: state.refreshToken, isAuthenticated: state.isAuthenticated }),
    }
  )
);
