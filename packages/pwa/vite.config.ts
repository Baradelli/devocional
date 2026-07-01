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
      // Sem isto o service worker (logo: instalar + push) não roda em `vite dev`.
      // Em dev, ainda exige contexto seguro no device: https ou localhost
      // (ex.: chrome://inspect com port-forwarding) — IP da rede via http não serve.
      devOptions: { enabled: true, type: 'module' },
      manifest: {
        name: 'Devocional',
        short_name: 'Devocional',
        description: 'Seu devocional diário.',
        lang: 'pt-BR',
        start_url: '/',
        display: 'standalone',
        background_color: '#f7f4ec',
        theme_color: '#4f7a4a',
        icons: [
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Em produção a API vive sob /api (nginx). O SW da PWA controla o escopo
        // '/', então excluímos /admin e /api do fallback de navegação (SPA) para
        // não sequestrar o painel admin nem as chamadas de API.
        navigateFallbackDenylist: [/^\/admin/, /^\/api/],
        // Handlers de Web Push (push + notificationclick) anexados ao SW gerado.
        importScripts: ['push-handler.js'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname === '/api/devotionals/today',
            handler: 'NetworkFirst',
            options: { cacheName: 'today', networkTimeoutSeconds: 5 },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/media/'),
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
  // host: true expõe o dev server na rede local (0.0.0.0) para abrir pelo celular via IP.
  server: { port: 5173, host: true },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
