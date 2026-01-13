
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // loadEnv pobiera zmienne z .env i środowiska Vercel
  const env = loadEnv(mode, process.cwd(), '');
  
  // Logowanie pomocnicze podczas budowania (widoczne w logs na Vercel)
  const keyToInject = env.API_KEY || process.env.API_KEY || "";
  console.log(`[Vite Build] Mode: ${mode}`);
  console.log(`[Vite Build] API_KEY detected: ${keyToInject ? 'YES (Length: ' + keyToInject.length + ')' : 'NO'}`);

  return {
    plugins: [react()],
    define: {
      // Wstrzykujemy klucz bezpośrednio w kod źródłowy jako stałą string
      'process.env.API_KEY': JSON.stringify(keyToInject)
    },
    server: {
      port: 3000,
      open: true
    },
    build: {
      sourcemap: false
    }
  };
});
