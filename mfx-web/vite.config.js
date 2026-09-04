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
          { src: '/letter-m.png', sizes: '192x192', type: 'image/png' },
          { src: '/letter-m.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})