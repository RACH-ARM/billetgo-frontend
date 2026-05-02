import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
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
