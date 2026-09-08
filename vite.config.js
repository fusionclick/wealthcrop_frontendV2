import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      // ponytail: default prod — Kotak sirf admin server IP se chalta hai. Local
      // Laravel ke liye: VITE_API_TARGET=http://127.0.0.1:8000 npm run dev
      "/api/internal": {
        target: process.env.VITE_API_TARGET || "https://admin.wealthcrop.co",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
