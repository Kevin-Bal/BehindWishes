import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Le site est servi sur https://kevin-bal.github.io/BehindWishes/
export default defineConfig({
  base: '/BehindWishes/',
  plugins: [
    react(),
    tailwindcss(),
    // PWA installable (V1.5) : icône sur l'écran d'accueil, ouverture rapide,
    // coquille de l'app disponible hors ligne (les données viennent du cache Firestore).
    VitePWA({
      registerType: 'autoUpdate',
      // Icônes : voir pwa-assets.config.ts
      pwaAssets: { config: true, overrideManifestIcons: true },
      manifest: {
        name: 'Derrière la liste',
        short_name: 'Derrière la liste',
        description: 'Les listes de souhaits de la famille, sans gâcher la surprise.',
        lang: 'fr',
        start_url: '/BehindWishes/',
        scope: '/BehindWishes/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f6f1e9',
        theme_color: '#b8322a',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        maximumFileSizeToCacheInBytes: 3_000_000,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'worker/**/*.test.ts'],
  },
})
