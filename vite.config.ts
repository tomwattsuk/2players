
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'lucide-react']
        }
      }
    }
  },
  server: {
    port: 5173,
    host: true,
    hmr: {
      clientPort: 443,
      host: '0.0.0.0'
    },
    proxy: {
      '/ws': {
        target: 'ws://localhost:3000',
        ws: true
      }
    }
  }
});
