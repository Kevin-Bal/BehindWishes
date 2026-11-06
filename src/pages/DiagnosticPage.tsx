import { doc, getDoc, serverTimestamp, setDoc, type Timestamp } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Screen } from '../components/Screen'
import { GlassButton, GlassSheet, SegmentedControl } from '../components/glass'
import { Avatar } from '../components/ui/Avatar'
import { Card } from '../components/ui/Card'
import { StatusChip } from '../components/ui/StatusChip'
import { ChevronLeftIcon, PlusIcon } from '../components/icons'
import { useAuth } from '../lib/auth'
import { getFirebase, missingFirebaseEnv, usingEmulators } from '../lib/firebase'
import {
  applyEventTheme,
  getTransparency,
  setTransparency,
  type EventTheme,
  type Transparency,
} from '../lib/preferences'

type Check =
  | { state: 'idle' }
  | { state: 'running' }
  | { state: 'ok'; writtenAt: string }
  | { state: 'error'; message: string }

/**
 * Page technique (non liée depuis l'interface) : vérifie Auth anonyme + lecture/écriture
 * Firestore (définition de « terminé » du Lot 0) et montre les composants Liquid Glass.
 */
export function DiagnosticPage() {
  const auth = useAuth()
  const [check, setCheck] = useState<Check>({ state: 'idle' })
  const [transparency, setTransparencyState] = useState<Transparency>(getTransparency)
  const [theme, setTheme] = useState<EventTheme>('neutral')
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    applyEventTheme(theme)
    return () => applyEventTheme('neutral')
  }, [theme])

  async function runFirestoreCheck() {
    if (auth.status !== 'ready') return
    setCheck({ state: 'running' })
    try {
      const { db } = getFirebase()
      const ref = doc(db, 'healthchecks', auth.user.uid)
      await setDoc(ref, { at: serverTimestamp(), userAgent: navigator.userAgent.slice(0, 200) })
      const snap = await getDoc(ref)
      const at = snap.get('at') as Timestamp | undefined
      setCheck({
        state: 'ok',
        writtenAt: at ? at.toDate().toLocaleString('fr-FR') : '(horodatage en attente)',
      })
    } catch (error) {
      setCheck({ state: 'error', message: error instanceof Error ? error.message : String(error) })
    }
  }

  return (
    <Screen
      title="Diagnostic"
      leading={
        <Link
          to="/"
          aria-label="Retour à l’accueil"
          className="-ml-2 flex size-11 items-center justify-center rounded-full"
        >
          <ChevronLeftIcon className="size-6" />
        </Link>
      }
      identity={{ name: 'Léa', onChange: () => undefined }}
      fab={
        <GlassButton
          variant="tint"
          shape="fab"
          aria-label="Ouvrir la feuille de démonstration"
          onClick={() => setSheetOpen(true)}
        >
          <PlusIcon className="size-7" />
        </GlassButton>
      }
    >
      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Firebase</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-ink-muted">Projet</dt>
          <dd className="font-mono break-all">
            {import.meta.env.VITE_FIREBASE_PROJECT_ID || '—'}
            {usingEmulators && ' (émulateurs)'}
          </dd>
          <dt className="text-ink-muted">Auth</dt>
          <dd className="font-mono break-all">
            {auth.status === 'loading' && 'connexion…'}
            {auth.status === 'ready' && `anonyme · ${auth.user.uid}`}
            {auth.status === 'error' && `erreur · ${auth.error.message}`}
          </dd>
        </dl>
        {missingFirebaseEnv.length > 0 && (
          <p className="rounded-xl bg-reserved-bg p-3 text-sm text-reserved">
            Variables manquantes : {missingFirebaseEnv.join(', ')}. Voir <code>.env.example</code>.
          </p>
        )}
        <button
          type="button"
          onClick={runFirestoreCheck}
          disabled={auth.status !== 'ready' || check.state === 'running'}
          className="min-h-11 rounded-full bg-surface-muted px-4 font-semibold disabled:opacity-50"
        >
          Tester l'écriture puis la lecture Firestore
        </button>
        <p role="status" className="text-sm">
          {check.state === 'running' && 'Test en cours…'}
          {check.state === 'ok' && `✅ Document écrit puis relu (${check.writtenAt}).`}
          {check.state === 'error' && `❌ ${check.message}`}
        </p>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Apparence</h2>
        <SegmentedControl
          label="Transparence"
          value={transparency}
          onChange={(value) => {
            setTransparency(value)
            setTransparencyState(value)
          }}
          options={[
            { value: 'standard', label: 'Standard' },
            { value: 'reduced', label: 'Réduite' },
          ]}
        />
        <SegmentedControl
          label="Ambiance"
          value={theme}
          onChange={setTheme}
          options={[
            { value: 'neutral', label: 'Neutre' },
            { value: 'noel', label: 'Noël' },
          ]}
        />
        <p className="text-sm text-ink-muted">
          Clair/sombre et contraste élevé suivent les réglages du système.
        </p>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Composants de contenu</h2>
        <div className="flex items-center gap-2">
          <Avatar name="Léa" color="#b8322a" emoji="🦊" />
          <Avatar name="Tom" color="#2f6b4f" />
          <Avatar name="Mamie" color="#6b4fa8" emoji="🌷" size="lg" />
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusChip status="free" />
          <StatusChip status="reserved" count={2} />
          <StatusChip status="purchased" count={1} />
        </div>
      </Card>

      {Array.from({ length: 6 }, (_, i) => (
        <Card key={i}>
          <p className="font-semibold">Souhait d'exemple n° {i + 1}</p>
          <p className="text-sm text-ink-muted">
            Le contenu défile sous les barres de verre pour vérifier le flou.
          </p>
        </Card>
      ))}

      <GlassSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Nouveau souhait">
        <label className="flex flex-col gap-1.5">
          <span className="font-semibold">Titre</span>
          <input className="min-h-12 rounded-2xl border border-line bg-surface px-4" />
        </label>
        <GlassButton variant="tint" onClick={() => setSheetOpen(false)}>
          Ajouter
        </GlassButton>
      </GlassSheet>
    </Screen>
  )
}
