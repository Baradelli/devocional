/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Painel do admin (Vitor): desktop-only, online, sem PWA/offline.
export default defineConfig({
  plugins: [react()],
  server: { port: 5174 },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
