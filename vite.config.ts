import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'vite.svg',
      ],
      manifest: {
        name: 'AfroVibe Aura Studio',
        short_name: 'Aura Studio',
        description: 'Libérez le potentiel de vos produits avec des visuels afro-futuristes générés par IA. Créez des mannequins virtuels uniques qui incarnent votre marque.',
        theme_color: '#7F00FF',
        background_color: '#0D0D0D',
        display: 'standalone',
        display_override: ['standalone', 'fullscreen'],
        scope: '/',
        start_url: '/',
        id: '/?v=1', // ID stable pour l'application
        orientation: 'portrait',
        dir: 'ltr',
        categories: ['business', 'photo', 'design', 'shopping'],
        // Configuration d'icônes robuste utilisant les fichiers existants
        icons: [
          {
            src: 'favicon.ico',
            sizes: '64x64 32x32 24x24 16x16',
            type: 'image/x-icon'
          },
          {
            src: 'vite.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable' // 'maskable' est une bonne pratique
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        skipWaiting: true,
        clientsClaim: true,
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  // FIX: Expose API_KEY to the client-side code as process.env.API_KEY to align with Gemini API guidelines.
  // This reads the API_KEY from the build environment and makes it available in the app.
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
})