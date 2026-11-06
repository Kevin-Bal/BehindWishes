import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { InviteCard } from '../components/InviteCard'
import { Screen } from '../components/Screen'
import { ChevronLeftIcon, CloseIcon } from '../components/icons'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { TextField } from '../components/ui/TextField'
import { defaultAppearance } from '../lib/appearance'
import { useAuth } from '../lib/auth'
import { formatCode } from '../lib/code'
import { createGroup, LIMITS } from '../lib/groups'

/** Création d'un groupe : nom + prénoms (au moins 2), puis code à partager (A3). */
export function CreateGroupPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [groupName, setGroupName] = useState('')
  const [names, setNames] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const [errors, setErrors] = useState<{ group?: string; members?: string; submit?: string }>({})
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState<{ code: string; name: string } | null>(null)
  const draftRef = useRef<HTMLInputElement>(null)

  function addName() {
    const name = draft.trim()
    if (!name) return
    const lower = name.toLocaleLowerCase('fr-FR')
    if (names.some((n) => n.toLocaleLowerCase('fr-FR') === lower)) {
      setErrors((e) => ({ ...e, members: `${name} est déjà dans la liste.` }))
      return
    }
    setNames((list) => [...list, name])
    setDraft('')
    setErrors((e) => ({ ...e, members: undefined }))
    draftRef.current?.focus()
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    // Un prénom tapé mais pas encore ajouté compte aussi.
    const pending = draft.trim()
    const all = pending && !names.includes(pending) ? [...names, pending] : names
    const nextErrors: typeof errors = {}
    if (!groupName.trim())
      nextErrors.group = 'Donne un nom au groupe, par exemple « Famille Martin ».'
    if (all.length < 2) nextErrors.members = 'Ajoute au moins 2 prénoms.'
    setErrors(nextErrors)
    if (nextErrors.group || nextErrors.members) return
    if (auth.status !== 'ready') {
      return setErrors({ submit: 'Connexion en cours, réessaie dans un instant.' })
    }
    setBusy(true)
    try {
      const code = await createGroup(groupName, all)
      setCreated({ code, name: groupName.trim() })
    } catch {
      setErrors({ submit: 'Création impossible. Vérifie ta connexion et réessaie.' })
    } finally {
      setBusy(false)
    }
  }

  const back = (
    <Link
      to="/"
      aria-label="Retour à l’accueil"
      className="-ml-2 flex size-11 items-center justify-center rounded-full"
    >
      <ChevronLeftIcon className="size-6" />
    </Link>
  )

  if (created) {
    return (
      <Screen title="Groupe créé" leading={back}>
        <Card className="text-center">
          <p className="text-4xl" aria-hidden="true">
            🎉
          </p>
          <h2 className="mt-2 text-2xl font-bold">« {created.name} » est prêt</h2>
          <p className="mt-1 text-ink-muted">
            Garde ce code : il permet à toute la famille d’entrer dans le groupe.
          </p>
        </Card>
        <InviteCard code={created.code} groupName={created.name} />
        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate(`/g/${formatCode(created.code)}/qui`)}
        >
          Continuer
        </Button>
      </Screen>
    )
  }

  return (
    <Screen title="Créer un groupe" leading={back}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Card className="flex flex-col gap-4">
          <TextField
            label="Nom du groupe"
            placeholder="Famille Martin"
            value={groupName}
            maxLength={LIMITS.groupName}
            onChange={(e) => {
              setGroupName(e.target.value)
              setErrors((x) => ({ ...x, group: undefined }))
            }}
            error={errors.group}
            autoComplete="off"
          />
        </Card>

        <Card className="flex flex-col gap-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <TextField
                ref={draftRef}
                label="Qui en fait partie ?"
                hint="Toi compris. Tu pourras en ajouter plus tard."
                placeholder="Prénom"
                value={draft}
                maxLength={LIMITS.memberName}
                autoComplete="off"
                autoCapitalize="words"
                enterKeyHint="next"
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addName()
                  }
                }}
                error={errors.members}
              />
            </div>
          </div>
          <Button onClick={addName} disabled={!draft.trim()}>
            Ajouter ce prénom
          </Button>
          {names.length > 0 && (
            <ul className="flex flex-col gap-1" aria-label="Membres ajoutés">
              {names.map((name, index) => {
                const look = defaultAppearance(index)
                return (
                  <li
                    key={name}
                    className="flex min-h-12 items-center gap-3 rounded-2xl bg-surface-muted pr-1 pl-2"
                  >
                    <Avatar name={name} color={look.color} emoji={look.emoji} size="sm" />
                    <span className="flex-1 truncate font-semibold">{name}</span>
                    <button
                      type="button"
                      aria-label={`Retirer ${name}`}
                      onClick={() => setNames((list) => list.filter((n) => n !== name))}
                      className="flex size-11 items-center justify-center rounded-full"
                    >
                      <CloseIcon className="size-5" />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        {errors.submit && (
          <p role="alert" className="text-center font-semibold text-danger">
            {errors.submit}
          </p>
        )}
        <Button type="submit" variant="primary" size="lg" disabled={busy}>
          {busy ? 'Création…' : 'Créer le groupe'}
        </Button>
      </form>
    </Screen>
  )
}
