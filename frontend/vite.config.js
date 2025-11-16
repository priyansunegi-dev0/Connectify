import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: false // Allow fallback to next available port
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Reduce build size for production
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'socket.io-client']
        }
      }
    }
  }
})
