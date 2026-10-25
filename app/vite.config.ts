import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist/client', emptyOutDir: true },
  server: {
    host: '127.0.0.1',
    port: 5173,
    // em desenvolvimento a interface roda no Vite e repassa /api para o servidor local
    // changeOrigin: false mantém o Host original, para a API poder recusar pedidos que não vêm desta máquina.
    proxy: { '/api': { target: 'http://127.0.0.1:3333', changeOrigin: false } },
    // a interface importa os tokens de cor e o logo de ../brand
    fs: { allow: ['..'] },
  },
});
