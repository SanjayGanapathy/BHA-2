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

    // Optimize bundle
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          // React dependencies
          "react-vendor": ["react", "react-dom", "react-router-dom"],

          // UI components
          'ui-vendor': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip'
          ],
          ],

          // Icons and utilities
          "utils-vendor": [
            "lucide-react",
            "clsx",
            "tailwind-merge",
            "class-variance-authority",
          ],

          // Forms and validation
          "forms-vendor": ["react-hook-form", "@hookform/resolvers", "zod"],

          // Date and utility libraries
          "date-vendor": ["date-fns"],
        },

        // Optimize file names for caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split("/").pop()
            : "chunk";
          return `js/[name]-[hash].js`;
        },

        entryFileNames: "js/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) {
            return "css/[name]-[hash].css";
          }
          return "assets/[name]-[hash].[ext]";
        },
      },
    },

    // Minification options
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true, // Remove debugger statements
        pure_funcs: ["console.log", "console.info"], // Remove specific console methods
      },
      mangle: {
        safari10: true, // Support Safari 10
      },
      format: {
        comments: false, // Remove comments
      },
    },

    // Chunk size warnings
    chunkSizeWarningLimit: 1000,

    // Source maps for production debugging
    sourcemap: false, // Set to true if you need source maps in production

    // CSS optimization
    cssCodeSplit: true,
    cssMinify: true,
  },

  // Development server configuration
  server: {
    port: 3000,
    host: true, // Allow external connections
    open: true, // Open browser on start
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
      "@radix-ui/react-slot",
      "class-variance-authority",
      "clsx",
      "tailwind-merge",
    ],
  },

  // CSS configuration
  css: {
    devSourcemap: true,
  },

  // Public directory
  publicDir: "public",

  // Asset handling
  assetsInclude: [
    "**/*.svg",
    "**/*.png",
    "**/*.jpg",
    "**/*.jpeg",
    "**/*.gif",
    "**/*.webp",
  ],

  // Worker configuration
  worker: {
    format: "es",
  },
});