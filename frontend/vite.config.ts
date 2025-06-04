import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import checker from 'vite-plugin-checker'

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "env-config.js": ["env-config.js"]
        },
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.name === "env-config.js") {
            return "env-config.js";
          }
          return "[name]-[hash].js";
        }
      }
    }
  },
  server: {
    proxy: {
    '/api': {
        target: 'http://localhost:3333',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    }
  },
  plugins: [react(), checker({typescript: true})],
})
