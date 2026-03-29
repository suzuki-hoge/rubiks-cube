import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/rubiks-cube/',
  define: {
    __BUILD_VERSION__: JSON.stringify(process.env.BUILD_VERSION ?? 'dev'),
  },
  build: {
    outDir: 'docs',
    chunkSizeWarningLimit: 1200,
  },
});
