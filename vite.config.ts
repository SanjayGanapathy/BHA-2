import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Production optimizations
  build: {
    // Target modern browsers
    target: "esnext",

    // Simple minification without terser for now
    minify: "esbuild",

    // Chunk size warnings
    chunkSizeWarningLimit: 1000,

    // Source maps for production debugging
    sourcemap: false,

    // CSS optimization
    cssCodeSplit: true,
    cssMinify: true,
  },

  // Development server configuration
  server: {
    port: 3000,
    host: true, // Allow external connections
    open: false, // Don't auto-open browser in container
  },

  // Preview server configuration
  preview: {
    port: 4173,
    host: true,
  },

  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },

  // Dependency optimization
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "lucide-react",
      "class-variance-authority",
      "clsx",
      "tailwind-merge",
    ],
  },

  // CSS configuration
  css: {
    devSourcemap: true,
  },
});
