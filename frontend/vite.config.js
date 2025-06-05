import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {

  const env = loadEnv(mode, process.cwd(), '');

  const targetUrl = env.API_URL || 'http://127.0.0.1:8000';

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/v1': {
          target: targetUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/v1/, '')
        }
      }
    }
  }
});