import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, "VITE_");

  return {
    root: path.join(projectRoot, "android-web"),
    envDir: projectRoot,
    publicDir: path.join(projectRoot, "public"),
    base: "./",
    define: {
      "import.meta.env.VITE_API_BASE_URL": JSON.stringify(
        env.VITE_ANDROID_API_BASE_URL?.trim() || "https://satark-drishti-api.onrender.com",
      ),
      "import.meta.env.VITE_CAPACITOR_ANDROID": "true",
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { "@": path.join(projectRoot, "src") },
      tsconfigPaths: true,
    },
    build: {
      outDir: path.join(projectRoot, "dist", "android-web"),
      emptyOutDir: true,
    },
  };
});
