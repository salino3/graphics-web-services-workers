import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import copy from "rollup-plugin-copy";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/graphics-web-services-workers/",
  plugins: [
    react(),
    // This plugin copies the Service Worker file to the build output directory
    // so it can be registered by the browser.
    copy({
      targets: [{ src: "src/sw.ts", dest: "dist" }],
      hook: "writeBundle", // Use this hook to ensure the file is copied after the bundle is written
    }),
  ],
  // We need to tell Vite to treat the Service Worker file as a module.
  // This helps with type checking and imports.
  // This is a good practice, but you might not strictly need it.
  build: {
    rollupOptions: {
      input: {
        main: "./index.html",
        sw: "./src/sw.ts",
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Keep the service worker name as sw.js
          if (chunkInfo.name === "sw") {
            return "sw.js";
          }
          return "assets/[name]-[hash].js";
        },
      },
    },
  },
});
