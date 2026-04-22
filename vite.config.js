import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 3001
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return
          }

          if (id.includes('react-helmet-async')) {
            return 'helmet'
          }

          if (id.includes('react-chartjs-2') || id.includes('chart.js')) {
            return 'chart-vendor'
          }

          if (id.includes('qrcode')) {
            return 'qr-vendor'
          }

          if (
            id.includes('react-router-dom') ||
            id.includes('react-dom') ||
            id.includes('/react/')
          ) {
            return 'react-vendor'
          }
        }
      }
    }
  }
})
