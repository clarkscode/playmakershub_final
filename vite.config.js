import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // Split vendor dependencies into a separate chunk
            return "vendor";
          }
          if (id.includes("components/chat")) {
            // Split ChatPage component into its own chunk
            return "chat";
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
