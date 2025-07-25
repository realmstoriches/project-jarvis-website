import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }: { mode: string }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // --- THIS IS THE CRITICAL ADDITION FOR PRODUCTION BUILDS ---
      base: '/jarvis-app/',
      // -----------------------------------------------------------

      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // Explicitly set the root directory
      root: '.',
      // Configure the server
      server: {
        port: 3000,
        host: true, // Listen on all addresses
        open: true, // Open browser on start
        hmr: {
          protocol: 'ws',
          host: 'localhost',
          port: 3000,
        },
      },
      // Configure the build
      build: {
        outDir: 'dist',
        emptyOutDir: true,
      }
    };
});
