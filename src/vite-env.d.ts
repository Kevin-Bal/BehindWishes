/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string
  readonly VITE_FIREBASE_PROJECT_ID?: string
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string
  readonly VITE_FIREBASE_APP_ID?: string
  readonly VITE_USE_EMULATORS?: string
  /** Clé de site reCAPTCHA v3 pour App Check (facultatif). */
  readonly VITE_APPCHECK_SITE_KEY?: string
  /** Adresse du proxy de saisie intelligente des liens (worker Cloudflare, facultatif). */
  readonly VITE_LINK_PREVIEW_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
