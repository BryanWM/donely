import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist/client', emptyOutDir: true },
  server: {
    host: '127.0.0.1',
    port: 5173,
    // em desenvolvimento a interface roda no Vite e repassa /api para o servidor local
    proxy: { '/api': 'http://127.0.0.1:3333' },
    // a interface importa os tokens de cor e o logo de ../brand
    fs: { allow: ['..'] },
  },
});
