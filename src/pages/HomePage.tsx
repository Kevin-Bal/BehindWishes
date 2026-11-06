import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Card } from '../components/ui/Card'
import { GiftIcon } from '../components/icons'

/** Accueil : saisie du code de groupe (branché sur Firestore au Lot 1, story A1). */
export function HomePage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = code.trim()
    if (trimmed) navigate(`/g/${encodeURIComponent(trimmed)}`)
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-4 pt-[max(env(safe-area-inset-top),2rem)] pb-[max(env(safe-area-inset-bottom),2rem)]">
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-16 items-center justify-center rounded-[20px] bg-accent text-on-accent shadow-lg">
          <GiftIcon className="size-9" />
        </span>
        <h1 className="text-3xl font-bold tracking-tight">Derrière la liste</h1>
        <p className="text-ink-muted">
          Les listes de souhaits de la famille, sans gâcher la surprise.
        </p>
      </header>

      <Card className="flex flex-col gap-4 p-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label htmlFor="group-code" className="text-base font-semibold">
            Code du groupe
          </label>
          <input
            id="group-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="K7M2-QX4P"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            inputMode="text"
            className="min-h-14 rounded-2xl border border-line bg-surface-muted px-4 text-center font-mono text-2xl tracking-[0.2em] uppercase placeholder:text-ink-muted/50"
          />
          <button
            type="submit"
            disabled={!code.trim()}
            className="min-h-14 rounded-full bg-accent text-lg font-semibold text-on-accent transition-transform duration-200 active:scale-[0.98] disabled:opacity-50"
          >
            Entrer
          </button>
        </form>
      </Card>

      <p className="text-center">
        Pas encore de groupe ?{' '}
        <Link to="/nouveau" className="font-semibold text-accent underline underline-offset-4">
          Créer un groupe
        </Link>
      </p>
    </main>
  )
}
