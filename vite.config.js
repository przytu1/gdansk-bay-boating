import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { OFFLINE_CACHE_NAME } from './src/utils/offlineMaps.js'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      workbox: {
        runtimeCaching: [
          {
            // Mapbox GL JS has no offline-region API on the web; this lets
            // the service worker persist style/sprite/glyph/tile responses
            // it has already seen so they still load without a network.
            urlPattern: ({ url }) => url.origin === 'https://api.mapbox.com',
            handler: 'CacheFirst',
            options: {
              cacheName: OFFLINE_CACHE_NAME,
              expiration: { maxEntries: 20000, maxAgeSeconds: 60 * 60 * 24 * 180 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'Navigator',
        short_name: 'Navigator',
        description: 'Aplikacja nawigacyjna do żeglarstwa i motorowodniactwa w Zatoce Gdańskiej',
        theme_color: '#0d2b3e',
        background_color: '#0d2b3e',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'logo.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
    }),
  ],
})
