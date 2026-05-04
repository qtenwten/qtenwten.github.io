import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  test: {
    environment: 'node',
    exclude: ['tests/**', 'node_modules/**', 'dist/**'],
  },
  server: {
    port: 3001,
    host: '0.0.0.0'
  },
  build: {
    chunkSizeWarningLimit: 600,
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

          if (id.includes('react-dom')) {
            return 'react-dom-vendor'
          }

          if (id.includes('react-router-dom')) {
            return 'router-vendor'
          }

          if (id.includes('/react/')) {
            return 'react-vendor'
          }
        }
      }
    }
  }
})
