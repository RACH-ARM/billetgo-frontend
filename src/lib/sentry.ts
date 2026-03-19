import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN as string | undefined,
  environment: import.meta.env.MODE,
  enabled: !!import.meta.env.VITE_SENTRY_DSN,
  // 10 % des sessions en prod pour limiter les quotas
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: import.meta.env.PROD ? 1.0 : 0,
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  // Ne pas capturer les erreurs réseau attendues (401, 404)
  ignoreErrors: [
    'Network Error',
    'Request aborted',
    /status code 401/,
    /status code 404/,
  ],
});

export { Sentry };
