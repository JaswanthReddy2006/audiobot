import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // In production: Express serves /frontend/dist as static files.
  // In local dev: proxy /api calls to the backend Express server.
  server: {
    port: 5173,
    proxy: {
      "/api": {
        // Local dev only – points to Express backend running on same machine
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    // Relative asset paths so Express can serve them from any sub-path
    assetsDir: "assets",
  },
});
