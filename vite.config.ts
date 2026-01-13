

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Wczytujemy zmienne ze środowiska (Vercel)
  // Fix: Zastąpiono process.cwd() kropką '.', aby uniknąć problemów z typowaniem 'Process' w konfiguracji Vite.
  const env = loadEnv(mode, '.', '');
  const apiKey = env.API_KEY || process.env.API_KEY || "";

  console.log(`--- VITE BUILD DEBUG ---`);
  console.log(`Mode: ${mode}`);
  console.log(`API_KEY Length: ${apiKey.length}`);
  console.log(`------------------------`);

  return {
    plugins: [react()],
    define: {
      // Definiujemy klucz jako stałą globalną dostępną w kodzie
      'process.env.API_KEY': JSON.stringify(apiKey)
    },
    server: {
      port: 3000,
      open: true
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});
