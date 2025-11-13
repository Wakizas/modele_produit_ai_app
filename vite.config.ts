import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Inclut les icônes et captures d'écran dans le cache pour le mode hors-ligne.
      // IMPORTANT: Assurez-vous que ces fichiers existent bien dans votre dossier `/public`.
      includeAssets: [
        'favicon.ico',
        'vite.svg', 
        'icon-192x192.png', 
        'icon-512x512.png', 
        'apple-touch-icon.png',
        'screenshot-1.png',
        'screenshot-2.png',
      ],
      manifest: {
        name: 'AfroVibe Aura Studio',
        short_name: 'Aura Studio',
        description: 'Libérez le potentiel de vos produits avec des visuels afro-futuristes générés par IA. Créez des mannequins virtuels uniques qui incarnent votre marque.',
        theme_color: '#7F00FF',
        background_color: '#0D0D0D',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        id: '/',
        orientation: 'portrait',
        categories: ['business', 'photo', 'design', 'shopping'],
        shortcuts: [
          {
            name: 'Commencer une nouvelle génération',
            short_name: 'Nouveau',
            description: 'Lancer un nouveau projet de modèle virtuel',
            url: '/',
            icons: [{ src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' }]
          }
        ],
        screenshots: [
          {
            src: '/screenshot-1.png',
            sizes: '1080x1920',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Étape de téléversement et de personnalisation du modèle'
          },
          {
            src: '/screenshot-2.png',
            sizes: '1080x1920',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Affichage des résultats de la génération'
          }
        ],
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // Met en cache tous les assets générés par le build pour le fonctionnement hors-ligne
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // S'assure que le nouveau service worker prend le contrôle immédiatement
        skipWaiting: true,
        clientsClaim: true,
      },
      // Active les fonctionnalités PWA en mode développement pour faciliter les tests
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