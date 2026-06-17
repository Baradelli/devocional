/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// PWA do fiel: offline-first. Workbox pré-cacheia o app shell e faz cache em
// runtime do devocional do dia (NetworkFirst) e das mídias (CacheFirst).
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Devocional',
        short_name: 'Devocional',
        description: 'Seu devocional diário.',
        lang: 'pt-BR',
        start_url: '/',
        display: 'standalone',
        background_color: '#f7f4ec',
        theme_color: '#4f7a4a',
        icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname === '/devotionals/today',
            handler: 'NetworkFirst',
            options: { cacheName: 'today', networkTimeoutSeconds: 5 },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/media/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'media',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: { port: 5173 },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
