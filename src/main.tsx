import './lib/sentry'; // doit être le premier import

// Nouveau déploiement Vercel : les anciens chunks (hash périmé) n'existent plus.
// Vite émet 'vite:preloadError' → on recharge une seule fois pour récupérer
// le nouvel index.html avec les bons hashes. Le flag sessionStorage évite
// une boucle infinie si le chunk est réellement absent du nouveau déploiement.
window.addEventListener('vite:preloadError', () => {
  const last = sessionStorage.getItem('vite-chunk-reload');
  const now = Date.now();
  // Reload si on n'a pas déjà rechargé dans les 10 dernières secondes
  // (évite la boucle infinie, mais permet de recharger à chaque navigation)
  if (!last || now - parseInt(last) > 10_000) {
    sessionStorage.setItem('vite-chunk-reload', String(now));
    // Couvrir immédiatement la page violette de Sentry avec un overlay propre
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#09060F;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.45);font-family:Sora,sans-serif;font-size:13px;letter-spacing:0.03em';
    el.textContent = 'Mise à jour en cours…';
    document.body.appendChild(el);
    setTimeout(() => window.location.reload(), 900);
  }
});

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
