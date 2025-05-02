import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "lucide-react"],
        },
      },
    },
  },
  server: {
    allowedHosts: [
      "eb52ca21-820d-4c07-8177-5001feaf9192-00-2u1k5bghj3yfs.riker.replit.dev",
    ],
    port: 5173,
    host: true,
    hmr: {
      clientPort: 443,
      host: "0.0.0.0",
    },
    proxy: {
      "/ws": {
        target: "ws://localhost:3000",
        ws: true,
      },
    },
  },
});
