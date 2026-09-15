import { defineConfig } from 'vite';

// Em desenvolvimento, o cliente corre no 5173 e faz proxy do Socket.IO para o
// servidor (porta 3000). Em produção (Render), tudo é servido pela mesma origem.
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/socket.io': { target: 'http://localhost:3000', ws: true },
    },
  },
  build: {
    chunkSizeWarningLimit: 6000, // o Monaco é grande mas é carregado sob demanda
  },
});
