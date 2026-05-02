import './lib/sentry'; // doit être le premier import

// Safari BFCache : quand l'utilisateur revient sur un onglet mis en veille,
// Safari restaure la page depuis la mémoire (persisted=true) sans refaire de
// requête réseau → les chunks JS ont des hashes périmés et plantent.
// On force un vrai rechargement réseau dès la détection.
window.addEventListener('pageshow', (e) => {
  if (e.persisted) {
    sessionStorage.removeItem('vite-chunk-reload');
    window.location.reload();
  }
});

import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { QueryClientProvider } from 'react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { queryClient } from './lib/queryClient';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<div style={{minHeight:'100vh',background:'#09060F',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,0.4)',fontFamily:'Sora,sans-serif',fontSize:14}}>Une erreur inattendue s'est produite.</div>}>
    <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="bottom-center"
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
    </HelmetProvider>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
