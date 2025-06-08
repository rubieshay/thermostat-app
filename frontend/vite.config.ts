import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import checker from 'vite-plugin-checker'
import path from 'path'
import { exec } from 'child_process'

// Custom plugin to watch .env file changes
const envWatcherPlugin = () => {
  return {
    name: 'env-watcher',
    configureServer(server: any) {
      const envPath = path.resolve(process.cwd(), '.env')
      
      // Watch the .env file
      server.watcher.add(envPath)
      
      server.watcher.on('change', (file: any) => {
        if (file === envPath) {
          console.log('🔄 .env file changed, running custom script...')
          
          // Replace 'your-script.sh' with your actual script path
          exec('bash ./bin/updateenv.sh', (error, stdout, stderr) => {
            if (error) {
              console.error(`❌ Script execution error: ${error}`)
              return
            }
            if (stderr) {
              console.error(`❌ Script stderr: ${stderr}`)
              return
            }
            console.log(`✅ Script output: ${stdout}`)
            
            // Restart the entire dev server after script completes
            console.log('🔄 Restarting Vite dev server...')
            setTimeout(() => {
              process.exit(0)
            }, 100) // Small delay to ensure logs are printed
          })
        }
      })
    }
  }
}

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
  plugins: [react(),
      checker({typescript: true}),
      envWatcherPlugin()
    ],
})
