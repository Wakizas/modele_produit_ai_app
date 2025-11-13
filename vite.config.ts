import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Seuls les assets de base sont inclus pour éviter les erreurs 404.
      // NOTE: Pour réactiver les captures d'écran, etc., ajoutez les fichiers dans /public et réinsérez-les ici.
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
        // Les icônes PNG ont été retirées car les fichiers n'existent pas.
        // PWABuilder peut utiliser les icônes du favicon par défaut.
        // Ajoutez vos fichiers icon-192x192.png et icon-512x512.png dans /public pour les réactiver.
        icons: [
          {
            src: 'vite.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
        // Les sections 'shortcuts' et 'screenshots' ont été retirées car les fichiers image étaient manquants, causant des erreurs.
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