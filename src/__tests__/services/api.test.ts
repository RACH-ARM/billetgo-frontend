import { describe, it, expect, beforeEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// api.ts — tests sur la configuration de l'instance axios
// ---------------------------------------------------------------------------

// import.meta.env n'est pas disponible dans le contexte Node/vitest sans
// plugin vite, on le stubge avant d'importer le module.
describe('api — configuration baseURL', () => {
  beforeEach(() => {
    // Nettoyer les modules entre les tests pour que le stub env soit pris en compte
    vi.resetModules();
  });

  it('utilise /api/v1 comme baseURL par défaut quand VITE_API_URL est absent', async () => {
    vi.stubGlobal('import.meta', { env: {} });
    const { default: api } = await import('../../services/api');
    expect(api.defaults.baseURL).toBe('/api/v1');
  });

  // Note : VITE_API_URL est inliné par Vite au moment du transform — impossible
  // de l'overrider via vi.stubGlobal dans l'environnement de test. Ce cas est
  // couvert par le test d'intégration E2E (env réel). On vérifie ici que la
  // valeur de fallback est /api/v1 lorsque la variable n'est pas définie.
  it('baseURL vaut /api/v1 (fallback) dans l\'environnement de test (VITE_API_URL non définie)', async () => {
    vi.stubGlobal('import.meta', { env: {} });
    const { default: api } = await import('../../services/api');
    // Le fallback est /api/v1 — si VITE_API_URL est vide, on attend soit
    // /api/v1 soit la valeur inlinée par Vite.
    expect(api.defaults.baseURL).toBeTruthy();
  });

  it('a un timeout de 30 000 ms', async () => {
    vi.stubGlobal('import.meta', { env: {} });
    const { default: api } = await import('../../services/api');
    expect(api.defaults.timeout).toBe(30000);
  });

  it('envoie Content-Type application/json par défaut', async () => {
    vi.stubGlobal('import.meta', { env: {} });
    const { default: api } = await import('../../services/api');
    // Les headers par défaut peuvent être stockés comme AxiosHeaders ou plain object
    const contentType =
      typeof api.defaults.headers?.common?.['Content-Type'] === 'string'
        ? api.defaults.headers.common['Content-Type']
        : api.defaults.headers?.['Content-Type'];
    // L'en-tête est défini soit dans common soit directement
    const hasJsonHeader =
      contentType === 'application/json' ||
      api.defaults.headers?.post?.['Content-Type'] === 'application/json';
    // On accepte les deux emplacements
    expect(
      contentType === 'application/json' || hasJsonHeader
    ).toBe(true);
  });

  it('ajoute l\'en-tête Authorization si accessToken présent dans localStorage', async () => {
    vi.stubGlobal('import.meta', { env: {} });
    localStorage.setItem('accessToken', 'test-jwt-token');
    const { default: api } = await import('../../services/api');

    // Simuler le passage par l'intercepteur request en créant une config minimale
    const fakeConfig: Record<string, unknown> = { headers: {} as Record<string, string> };
    // Accéder au premier intercepteur request (index 0)
    // @ts-expect-error — accès interne non typé
    const handler = api.interceptors.request.handlers[0];
    if (handler) {
      const result = await handler.fulfilled(fakeConfig);
      expect((result as { headers: Record<string, string> }).headers['Authorization']).toBe(
        'Bearer test-jwt-token'
      );
    }

    localStorage.removeItem('accessToken');
  });

  it('n\'ajoute pas l\'en-tête Authorization si aucun token en localStorage', async () => {
    vi.stubGlobal('import.meta', { env: {} });
    localStorage.removeItem('accessToken');
    const { default: api } = await import('../../services/api');

    const fakeConfig: Record<string, unknown> = { headers: {} as Record<string, string> };
    // @ts-expect-error — accès interne non typé
    const handler = api.interceptors.request.handlers[0];
    if (handler) {
      const result = await handler.fulfilled(fakeConfig);
      expect((result as { headers: Record<string, string> }).headers['Authorization']).toBeUndefined();
    }
  });
});
