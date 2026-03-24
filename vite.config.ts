import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'BilletGo',
        short_name: 'BilletGo',
        description: 'Plateforme de billetterie événementielle du Gabon',
        theme_color: '#7B2FBE',
        background_color: '#0D0D1A',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
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
