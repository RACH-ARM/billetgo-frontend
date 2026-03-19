import './lib/sentry'; // doit être le premier import
import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { queryClient } from './lib/queryClient';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<div style={{ color: '#fff', padding: 40, textAlign: 'center' }}>Une erreur inattendue s'est produite.</div>}>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1A1A35',
            color: '#fff',
            border: '1px solid rgba(123, 47, 190, 0.4)',
          },
          success: { iconTheme: { primary: '#00E5FF', secondary: '#0D0D1A' } },
          error: { iconTheme: { primary: '#E040FB', secondary: '#0D0D1A' } },
        }}
      />
    </QueryClientProvider>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
