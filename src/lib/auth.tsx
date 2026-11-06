import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getFirebase } from './firebase'

type AuthState =
  { status: 'loading' } | { status: 'ready'; user: User } | { status: 'error'; error: Error }

const AuthContext = createContext<AuthState>({ status: 'loading' })

/**
 * Connexion anonyme automatique au premier lancement : l'appareil reçoit un uid stable
 * (conservé par le SDK), sans aucun compte à créer.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Config absente ou invalide : on le sait dès l'initialisation, sans effet.
  const [initError] = useState<Error | null>(() => {
    try {
      getFirebase()
      return null
    } catch (error) {
      return toError(error)
    }
  })
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    if (initError) return
    const { auth } = getFirebase()
    return onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          setState({ status: 'ready', user })
        } else {
          signInAnonymously(auth).catch((error: unknown) =>
            setState({ status: 'error', error: toError(error) }),
          )
        }
      },
      (error) => setState({ status: 'error', error }),
    )
  }, [initError])

  const value: AuthState = initError ? { status: 'error', error: initError } : state
  return <AuthContext value={value}>{children}</AuthContext>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  return useContext(AuthContext)
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}
