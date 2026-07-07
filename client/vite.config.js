import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Raise the warning threshold slightly — auction images can be large
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 5173,
  },
});
