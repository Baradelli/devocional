/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// PWA do fiel. Workbox/service worker (offline-first) entram no M5.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
