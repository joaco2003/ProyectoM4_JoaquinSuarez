import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://proyecto-m4-joaquin-suarez.vercel.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
