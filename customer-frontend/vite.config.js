import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],

    define: {
      "import.meta.env.RENDER_API_URL": JSON.stringify(
        env.RENDER_API_URL
      ),
    },

    server: {
      port: 5173,
      host: "0.0.0.0",
    },

    preview: {
      port: 4173,
      host: "0.0.0.0",
    },

    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
  };
});