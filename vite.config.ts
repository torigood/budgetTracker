import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      includeAssets: ['icons/logo_512.png'],
      manifest: {
        name: 'Budget Tracker',
        short_name: 'Budget',
        description: '개인 가계부 앱',
        theme_color: '#f4f5f8',
        background_color: '#f4f5f8',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icons/logo_512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      injectManifest: {
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,svg}'],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('recharts') || id.includes('d3-')) return 'charts'
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('node_modules')) return 'vendor'
        },
      },
    },
  },
})
