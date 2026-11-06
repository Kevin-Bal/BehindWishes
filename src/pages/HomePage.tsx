import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { GiftIcon } from '../components/icons'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAuth } from '../lib/auth'
import { formatCode, formatCodeInput, isValidCode, normalizeCode } from '../lib/code'
import { groupExists } from '../lib/groups'
import { getLastGroup } from '../lib/identity'

const UNKNOWN_CODE =
  'Ce code ne correspond à aucun groupe. Vérifie-le auprès de la personne qui te l’a envoyé.'

/** Accueil : saisie du code de groupe (A1) et accès à la création (A3). */
export function HomePage() {
  const navigate = useNavigate()
  const auth = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string>()
  const [checking, setChecking] = useState(false)
  const [lastGroup] = useState(getLastGroup)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const normalized = normalizeCode(code)
    // Même message pour un code mal formé ou inconnu : aucun indice sur les codes existants.
    if (!isValidCode(normalized)) return setError(UNKNOWN_CODE)
    if (auth.status !== 'ready') {
      return setError('Connexion en cours, réessaie dans un instant.')
    }
    setChecking(true)
    try {
      if (await groupExists(normalized)) {
        navigate(`/g/${formatCode(normalized)}`)
      } else {
        setError(UNKNOWN_CODE)
      }
    } catch {
      setError('Impossible de vérifier le code. Tu es peut-être hors ligne.')
    } finally {
      setChecking(false)
    }
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

      {lastGroup && isValidCode(lastGroup) && (
        <Link
          to={`/g/${formatCode(lastGroup)}`}
          className="flex min-h-14 items-center justify-center rounded-full bg-accent px-5 text-lg font-semibold text-on-accent"
        >
          Retourner dans mon groupe
        </Link>
      )}

      <Card className="flex flex-col gap-4 p-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
          <label htmlFor="group-code" className="text-base font-semibold">
            {lastGroup ? 'Entrer dans un autre groupe' : 'Code du groupe'}
          </label>
          <input
            id="group-code"
            value={code}
            onChange={(event) => {
              setCode(formatCodeInput(event.target.value))
              setError(undefined)
            }}
            placeholder="K7M2-QX4P"
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'group-code-error' : undefined}
            className="min-h-14 rounded-2xl border border-line bg-surface-muted px-4 text-center font-mono text-2xl tracking-[0.2em] uppercase placeholder:text-ink-muted/50"
          />
          {error && (
            <p id="group-code-error" role="alert" className="text-sm font-semibold text-danger">
              {error}
            </p>
          )}
          <Button
            type="submit"
            variant={lastGroup ? 'secondary' : 'primary'}
            size="lg"
            disabled={normalizeCode(code).length === 0 || checking}
          >
            {checking ? 'Vérification…' : 'Entrer'}
          </Button>
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
