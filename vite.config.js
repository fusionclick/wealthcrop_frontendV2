import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      // ponytail: Kotak sirf admin server IP se — local PHP WAF pe fail hota hai
      "/api/internal": {
        target: "https://admin.wealthcrop.co",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
