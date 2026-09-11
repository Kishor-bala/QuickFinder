import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// ESM-compatible __dirname replacement
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the MONOREPO ROOT — single .env for the whole project.
export default defineConfig(({ mode }) => {
  // Load env from root (two levels up from apps/web/)
  const rootDir = resolve(__dirname, '..', '..');
  const env = loadEnv(mode, rootDir, '');

  return {
    plugins: [react()],
    // Make VITE_ vars from root .env available to the frontend
    define: {
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY),
      'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN),
      'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(env.VITE_FIREBASE_PROJECT_ID),
      'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET),
      'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID),
      'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(env.VITE_FIREBASE_APP_ID),
    },
    server: {
      port: 5173,
      strictPort: true,
      host: true,
      allowedHosts: true,
      proxy: {
        '/api': {
          target: `http://localhost:${env.PORT || 5000}`,
          changeOrigin: true,
        },
        '/uploads': {
          target: `http://localhost:${env.PORT || 5000}`,
          changeOrigin: true,
        },
      },
    },
  };
});
