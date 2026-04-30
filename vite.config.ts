import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import mkcert from 'vite-plugin-mkcert';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    mkcert(),    // HTTPS de confiance pour le dev server (localhost)
    basicSsl(),  // HTTPS auto-signé pour le preview server (réseau local)
    VitePWA({
      registerType: 'autoUpdate',
      // Inclure le SW dans le build
      includeAssets: ['favicon.svg', 'favicon.ico'],
      manifest: {
        name: 'BilletGab',
        short_name: 'BilletGab',
        description: 'Plateforme de billetterie événementielle du Gabon',
        theme_color: '#7B2FBE',
        background_color: '#0D0D1A',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // Précacher uniquement les assets légers et critiques
        globPatterns: ['**/*.{css,html,ico,svg,woff,woff2}', 'assets/{index,vendor-*,PageLayout,Home,Login,EventDetail,EventCard,formatDate,Button,Badge}*.js'],
        // Exclure les gros chunks réservés à des rôles spécifiques
        // (admin, organisateur, scanner) — inutile de les télécharger pour tous les visiteurs
        globIgnores: [
          '**/vendor-charts-*.js',       // 384 KB — uniquement OrganizerDashboard
          '**/vendor-qrcode-*.js',        // 334 KB — uniquement ScannerApp
          '**/ScannerApp-*.js',
          '**/OrganizerDashboard-*.js',
          '**/AdminBackoffice-*.js',
          '**/MesEvenements-*.js',
          '**/Versements-*.js',
          '**/ContratOrganisateur-*.js',
          '**/ContratPrint-*.js',
          '**/Register-*.js',             // 89 KB — chargé à la demande
        ],
        // ← Clé : renvoyer index.html pour toute navigation SPA (ex: /scanner sans réseau)
        navigateFallback: 'index.html',
        // Ne pas intercepter les appels API avec navigateFallback
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          // Polices Google Fonts
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          // Chunks JS non précachés : mise en cache au premier accès (NetworkFirst)
          {
            urlPattern: /\/assets\/.*\.js$/,
            handler: 'NetworkFirst',
            options: { cacheName: 'js-chunks', networkTimeoutSeconds: 10, expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    target: 'es2019',
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return;
          // Recharts + D3 : ~380 KB, uniquement sur OrganizerDashboard
          if (id.includes('recharts') || id.includes('/d3-') || id.includes('/d3/')) return 'vendor-charts';
          // html5-qrcode : ~334 KB, uniquement sur ScannerApp
          if (id.includes('html5-qrcode')) return 'vendor-qrcode';
          // React core : très stable → cache long, rarement invalidé
          if (id.includes('react-dom') || id.includes('scheduler')) return 'vendor-react';
          // Router : séparé pour ne pas invalider le cache React lors d'un changement de route
          if (id.includes('react-router') || id.includes('@remix-run')) return 'vendor-router';
          // Framer-motion : 115 KB, présent sur toutes les pages → chunk stable dédié
          if (id.includes('framer-motion') || id.includes('framesync') || id.includes('popmotion')) return 'vendor-motion';
          // react-query + zustand : légers, mais très stables
          if (id.includes('react-query') || id.includes('zustand')) return 'vendor-query';
          // Les autres libs (axios, date-fns, lucide, etc.) restent dans leurs chunks naturels
        },
      },
    },
  },
  preview: {
    host: true,
    port: 4173,
    https: {},   // basicSsl injecte les certificats ici
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          // Nécessaire pour que les SSE (Server-Sent Events) passent sans être bufferisés
          proxy.on('proxyRes', (_proxyRes, _req, res) => {
            res.setHeader('X-Accel-Buffering', 'no');
          });
        },
      },
    },
  },
});
