import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type UserConfig } from "vite";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.API_PROXY_TARGET || "https://satark-drishti-api.onrender.com";
  const apiAccessToken = env.API_ACCESS_TOKEN?.trim();
  const server: NonNullable<UserConfig["server"]> = {};

  if (command === "serve") {
    if (!apiAccessToken || apiAccessToken.length < 32) {
      throw new Error("Set a valid (at least 32-character) API_ACCESS_TOKEN in .env.local.");
    }

    const targetUrl = new URL(apiTarget);
    if (!["http:", "https:"].includes(targetUrl.protocol)) {
      throw new Error("API_PROXY_TARGET must use HTTP or HTTPS.");
    }

    Object.assign(server, {
      host: "127.0.0.1",
      port: 5173,
      strictPort: true,
      watch: { ignored: ["**/desktop-app/**", "**/release/**"] },
      proxy: {
        "/api": {
          target: targetUrl.origin,
          changeOrigin: true,
          configure(proxy) {
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.setHeader("Authorization", `Bearer ${apiAccessToken}`);
            });
          },
        },
      },
    });
  }

  return {
    server,
    plugins: [
      tanstackStart({ server: { entry: "server" } }),
      react(),
      tailwindcss(),
    ],
    resolve: { tsconfigPaths: true },
  };
});
