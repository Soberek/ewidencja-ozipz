/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { viteSqlitePlugin } from "./src/db/vite-sqlite-plugin";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), viteSqlitePlugin()],
  clearScreen: false,
  server: {
    port: 1421,
    strictPort: true,
    host: "0.0.0.0",
  },
  preview: {
    port: 1421,
    strictPort: true,
    host: "127.0.0.1",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    testTimeout: 15000,
    hookTimeout: 15000,
    poolOptions: {
      forks: {
        maxForks: 4,
        minForks: 1,
      },
    },
  },
  envPrefix: ["VITE_", "TAURI_ENV_*"],
  build: {
    target: process.env.TAURI_ENV_PLATFORM == "windows" ? "chrome105" : "safari13",
    minify: !process.env.TAURI_ENV_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("exceljs") || id.includes("xlsx")) {
              return "vendor-excel";
            }
            if (
              id.includes("react") ||
              id.includes("zustand") ||
              id.includes("@radix-ui") ||
              id.includes("lucide-react") ||
              id.includes("sonner")
            ) {
              return "vendor-framework";
            }
          }
        },
      },
    },
  },
});
