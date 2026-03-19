import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mocks — à déclarer avant l'import du hook
// ---------------------------------------------------------------------------

// Mock react-hot-toast (utilisé dans le hook)
vi.mock('react-hot-toast', () => ({
  default: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

// Mock du store authStore
const mockAuthStore = {
  isAuthenticated: false,
  user: null as { id: string } | null,
};
vi.mock('../../stores/authStore', () => ({
  useAuthStore: () => mockAuthStore,
}));

// Mock api — sera remplacé par spy dans les tests
let apiGetMock = vi.fn();
let apiPatchMock = vi.fn();
vi.mock('../../services/api', () => ({
  default: {
    get: (...args: unknown[]) => apiGetMock(...args),
    patch: (...args: unknown[]) => apiPatchMock(...args),
  },
}));

// Mock EventSource (non disponible dans jsdom)
class MockEventSource {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;
  url: string;
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  listeners: Record<string, () => void> = {};
  constructor(url: string) { this.url = url; }
  addEventListener(event: string, handler: () => void) { this.listeners[event] = handler; }
  close() {}
}
vi.stubGlobal('EventSource', MockEventSource);

// ---------------------------------------------------------------------------
// Import du hook après les mocks
// ---------------------------------------------------------------------------
import { useNotifications, type AppNotification } from '../../hooks/useNotifications';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeNotification(overrides: Partial<AppNotification & { data?: { netAmount?: number } }> = {}) {
  return {
    id: '1',
    type: 'INFO',
    title: 'Titre',
    message: 'Message',
    isRead: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('useNotifications — logique de transformation des notifications', () => {
  beforeEach(() => {
    mockAuthStore.isAuthenticated = false;
    mockAuthStore.user = null;
    apiGetMock = vi.fn().mockResolvedValue({ data: { data: [] } });
    apiPatchMock = vi.fn().mockResolvedValue({});
    localStorage.setItem('accessToken', 'fake-token');
  });

  it('retourne des listes vides et unreadCount = 0 quand non authentifié', () => {
    mockAuthStore.isAuthenticated = false;
    const { result } = renderHook(() => useNotifications());
    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it('charge les notifications initiales depuis l\'API quand authentifié', async () => {
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.user = { id: 'user-1' };
    const rawNotifs = [makeNotification({ isRead: false }), makeNotification({ id: '2', isRead: true })];
    apiGetMock = vi.fn().mockResolvedValue({ data: { data: rawNotifs } });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(2);
    });
    expect(result.current.unreadCount).toBe(1);
  });

  it('transforme data.netAmount en amount pour les notifications NEW_SALE', async () => {
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.user = { id: 'user-1' };

    const rawNotif = {
      ...makeNotification({ type: 'NEW_SALE' }),
      data: { netAmount: 5000 },
    };
    apiGetMock = vi.fn().mockResolvedValue({ data: { data: [rawNotif] } });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(1);
    });
    expect(result.current.notifications[0].amount).toBe(5000);
  });

  it('ne modifie pas amount pour les notifications de type autre que NEW_SALE', async () => {
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.user = { id: 'user-1' };

    const rawNotif = {
      ...makeNotification({ type: 'INFO', amount: undefined }),
      data: { netAmount: 9999 },
    };
    apiGetMock = vi.fn().mockResolvedValue({ data: { data: [rawNotif] } });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(1);
    });
    // Pour un type autre que NEW_SALE, amount ne doit pas prendre netAmount
    expect(result.current.notifications[0].amount).toBeUndefined();
  });

  it('markAllRead met isRead à true sur toutes les notifications et remet unreadCount à 0', async () => {
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.user = { id: 'user-1' };
    const rawNotifs = [makeNotification({ isRead: false }), makeNotification({ id: '2', isRead: false })];
    apiGetMock = vi.fn().mockResolvedValue({ data: { data: rawNotifs } });
    apiPatchMock = vi.fn().mockResolvedValue({});

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(2);
    });

    await act(async () => {
      await result.current.markAllRead();
    });

    expect(result.current.unreadCount).toBe(0);
    expect(result.current.notifications.every((n) => n.isRead)).toBe(true);
    expect(apiPatchMock).toHaveBeenCalledWith('/notifications/read-all');
  });

  it('markAllRead ne fait pas d\'appel API si unreadCount vaut déjà 0', async () => {
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.user = { id: 'user-1' };
    // Toutes les notifs déjà lues
    const rawNotifs = [makeNotification({ isRead: true })];
    apiGetMock = vi.fn().mockResolvedValue({ data: { data: rawNotifs } });
    apiPatchMock = vi.fn().mockResolvedValue({});

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(0);
    });

    await act(async () => {
      await result.current.markAllRead();
    });

    expect(apiPatchMock).not.toHaveBeenCalled();
  });

  it('gère silencieusement l\'erreur API lors du chargement initial', async () => {
    mockAuthStore.isAuthenticated = true;
    mockAuthStore.user = { id: 'user-1' };
    apiGetMock = vi.fn().mockRejectedValue(new Error('Network Error'));

    const { result } = renderHook(() => useNotifications());

    // Aucune erreur levée, listes vides
    await waitFor(() => {
      // Le hook ne doit pas planter — on attend juste que useEffect s'exécute
      expect(result.current.notifications).toEqual([]);
    });
  });
});
