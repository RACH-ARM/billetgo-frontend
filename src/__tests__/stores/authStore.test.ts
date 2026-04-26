import { describe, it, expect, beforeEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — avant tout import du store
// ---------------------------------------------------------------------------

// Mock de l'instance axios (api.ts) pour éviter les vraies requêtes réseau
vi.mock('../../services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

// Mock du queryClient
vi.mock('../../lib/queryClient', () => ({
  queryClient: { clear: vi.fn() },
}));

// Mock du cartStore
vi.mock('../../stores/cartStore', () => ({
  useCartStore: {
    getState: () => ({ clearCart: vi.fn() }),
  },
}));

// ---------------------------------------------------------------------------
// Import après mocks
// ---------------------------------------------------------------------------
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import type { User } from '../../types/user';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-abc',
    email: 'tiami@billetgab.com',
    phone: null,
    firstName: 'Tiamiyou',
    lastName: 'Arèmou',
    role: 'BUYER',
    isVerified: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// Réinitialiser le store entre les tests
function resetStore() {
  useAuthStore.setState({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('authStore — state initial', () => {
  beforeEach(resetStore);

  it('commence avec user null et isAuthenticated false', () => {
    const { user, isAuthenticated } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(isAuthenticated).toBe(false);
  });
});

describe('authStore — login', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('passe isAuthenticated à true et peuple user après un login réussi', async () => {
    const user = makeUser();
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { data: { user, accessToken: 'access-123', refreshToken: 'refresh-456' } },
    });

    await useAuthStore.getState().login({ email: 'tiami@billetgab.com', password: 'secret123' });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(user);
    expect(state.accessToken).toBe('access-123');
    expect(state.refreshToken).toBe('refresh-456');
    expect(state.isLoading).toBe(false);
  });

  it('stocke les tokens dans localStorage', async () => {
    const user = makeUser();
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { data: { user, accessToken: 'access-123', refreshToken: 'refresh-456' } },
    });

    await useAuthStore.getState().login({ email: 'tiami@billetgab.com', password: 'secret123' });

    expect(localStorage.getItem('accessToken')).toBe('access-123');
    expect(localStorage.getItem('refreshToken')).toBe('refresh-456');
  });

  it('lève une erreur et remet isLoading à false si le login échoue', async () => {
    const error = new Error('Identifiants incorrects');
    (api.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error);

    await expect(
      useAuthStore.getState().login({ email: 'mauvais@billetgab.com', password: 'wrong' })
    ).rejects.toThrow('Identifiants incorrects');

    expect(useAuthStore.getState().isLoading).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

describe('authStore — logout', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
    localStorage.setItem('accessToken', 'old-access');
    localStorage.setItem('refreshToken', 'old-refresh');
    // Simuler un état connecté
    useAuthStore.setState({
      user: makeUser(),
      accessToken: 'old-access',
      refreshToken: 'old-refresh',
      isAuthenticated: true,
    });
  });

  it('remet isAuthenticated à false et user à null', async () => {
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
  });

  it('supprime les tokens du localStorage', async () => {
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

    await useAuthStore.getState().logout();

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });
});

describe('authStore — setTokens', () => {
  beforeEach(resetStore);

  it('met à jour les tokens dans le store et le localStorage', () => {
    useAuthStore.getState().setTokens('new-access', 'new-refresh');
    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('new-access');
    expect(state.refreshToken).toBe('new-refresh');
    expect(localStorage.getItem('accessToken')).toBe('new-access');
    expect(localStorage.getItem('refreshToken')).toBe('new-refresh');
  });
});

describe('authStore — markEmailVerified', () => {
  beforeEach(resetStore);

  it('passe isVerified à true sur l\'utilisateur courant', () => {
    useAuthStore.setState({ user: makeUser({ isVerified: false }) });
    useAuthStore.getState().markEmailVerified();
    expect(useAuthStore.getState().user?.isVerified).toBe(true);
  });

  it('ne plante pas si user est null', () => {
    useAuthStore.setState({ user: null });
    expect(() => useAuthStore.getState().markEmailVerified()).not.toThrow();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
