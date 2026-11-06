import { initializeApp, type FirebaseApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth'
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore'

const env = import.meta.env

/** Variables indispensables pour parler à Firebase. */
const REQUIRED = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
] as const

export const missingFirebaseEnv: string[] = REQUIRED.filter((key) => !env[key])
export const usingEmulators = env.VITE_USE_EMULATORS === 'true'

interface FirebaseServices {
  app: FirebaseApp
  auth: Auth
  db: Firestore
}

let services: FirebaseServices | null = null

/** Initialise Firebase à la demande (une seule fois). Lève une erreur si la config manque. */
export function getFirebase(): FirebaseServices {
  if (services) return services
  if (missingFirebaseEnv.length > 0) {
    throw new Error(`Configuration Firebase incomplète : ${missingFirebaseEnv.join(', ')}`)
  }

  const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  })
  const auth = getAuth(app)
  auth.languageCode = 'fr'
  // Cache local persistant : les listes déjà vues restent lisibles hors ligne,
  // et les écritures partent dès le retour du réseau.
  const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  })

  if (usingEmulators) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
    connectFirestoreEmulator(db, '127.0.0.1', 8080)
  }

  services = { app, auth, db }
  return services
}

/**
 * Hors ligne, Firestore applique l'écriture localement tout de suite mais ne confirme
 * qu'au retour du réseau : on n'attend pas cette confirmation, sinon l'interface
 * resterait bloquée sur « Enregistrement… ».
 */
export async function queued(write: Promise<unknown>): Promise<void> {
  if (typeof navigator === 'undefined' || navigator.onLine) {
    await write
    return
  }
  write.catch((error: unknown) => console.error('Écriture refusée au retour du réseau', error))
}
