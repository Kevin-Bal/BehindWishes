import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Icônes de la PWA générées au build depuis public/icon.svg (fond rouge plein,
// sans bordure blanche ; le système applique son propre masque arrondi).
const red = '#b8322a'

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, padding: 0.1, resizeOptions: { background: red } },
    apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: { background: red } },
  },
  images: ['public/icon.svg'],
})
