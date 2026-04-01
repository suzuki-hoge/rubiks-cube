import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

const plugins: PluginOption[] = [react()];
if (process.env.HTTPS) {
  plugins.push(basicSsl());
}

export default defineConfig({
  plugins,
  base: '/rubiks-cube/',
  define: {
    __BUILD_VERSION__: JSON.stringify(process.env.BUILD_VERSION ?? 'dev'),
  },
  build: {
    outDir: 'docs',
    chunkSizeWarningLimit: 1200,
  },
});
