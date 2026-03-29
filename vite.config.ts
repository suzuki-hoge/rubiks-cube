import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/rubiks-cube/',
  build: {
    outDir: 'docs',
    chunkSizeWarningLimit: 1200,
  },
});
