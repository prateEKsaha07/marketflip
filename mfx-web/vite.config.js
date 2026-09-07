import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'MarketFlip',
        short_name: 'MarketFlip',
        description: 'Reverse marketplace — post what you want, let shops bid',
        theme_color: '#FFBE91',
        background_color: '#F8F6F0',
        display: 'standalone',
        icons: [
          { src: '/Logo.png', sizes: '192x192', type: 'image/png' },
          { src: '/Logo.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Group by package name
            const match = id.match(/node_modules\/(?:@[^/]+\/)?([^/]+)/)
            if (match) {
              const packageName = match[1]
              
              // Map specific packages to vendor groups
              if (['react', 'react-dom', 'react-router-dom', 'react-router'].includes(packageName)) {
                return 'vendor-react'
              }
              if (packageName === 'lottie-web') {
                return 'vendor-lottie'
              }
              if (['@mui', '@emotion'].includes(packageName)) {
                return 'vendor-ui'
              }
              
              // All other node_modules go to vendor
              return 'vendor'
            }
          }
        },
        // Add these options to improve chunking
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      }
    },
    chunkSizeWarningLimit: 1000,
    // Enable sourcemaps for better debugging (optional)
    sourcemap: false,
  }
})