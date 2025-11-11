import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      manifest: {
        name: 'Modèle Produit Réaliste',
        short_name: 'ModèleProduit',
        description: 'Générez des visuels ultra-réalistes de vos produits portés par des modèles virtuels.',
        theme_color: '#7F00FF',
        background_color: '#0D0D0D',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  // FIX: Expose API_KEY to the client-side code as process.env.API_KEY to align with Gemini API guidelines.
  // This reads the API_KEY from the build environment and makes it available in the app.
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
})