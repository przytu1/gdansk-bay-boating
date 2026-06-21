import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      manifest: {
        name: 'Nawigacja Zatoka Gdańska',
        short_name: 'Bay Nav',
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
