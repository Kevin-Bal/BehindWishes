import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { MemberSheet } from '../../components/MemberSheet'
import { Screen } from '../../components/Screen'
import { ChevronLeftIcon } from '../../components/icons'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { defaultAppearance } from '../../lib/appearance'
import { useGroup } from '../../lib/groupContext'
import { addMember, type Member } from '../../lib/groups'
import { getRecentIdentities } from '../../lib/identity'

/**
 * « Qui es-tu ? » (A2) : grille des membres, les trois dernières identités utilisées
 * sur l'appareil en tête pour basculer en un tap.
 */
export function WhoPage() {
  const { code, group, members, me, chooseIdentity, basePath } = useGroup()
  const navigate = useNavigate()
  const [adding, setAdding] = useState(false)

  const active = members.filter((m) => !m.archived)
  const recentIds = getRecentIdentities(code).filter((id) => id !== me?.id)
  const recent = recentIds
    .map((id) => active.find((m) => m.id === id))
    .filter((m): m is Member => Boolean(m))
  const others = active.filter((m) => !recent.includes(m))

  function choose(memberId: string) {
    chooseIdentity(memberId)
    navigate(basePath, { replace: true })
  }

  return (
    <Screen
      title={group.name}
      leading={
        me ? (
          <Link
            to={basePath}
            aria-label="Retour"
            className="-ml-2 flex size-11 items-center justify-center rounded-full"
          >
            <ChevronLeftIcon className="size-6" />
          </Link>
        ) : undefined
      }
    >
      <header className="pt-2 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Qui es-tu ?</h2>
        {me && (
          <p className="mt-1 text-ink-muted">
            Tu es actuellement {me.name}. Choisis un autre prénom si ce n’est pas toi.
          </p>
        )}
      </header>

      {recent.length > 0 && (
        <section aria-labelledby="recent-title" className="flex flex-col gap-2">
          <h3 id="recent-title" className="text-sm font-semibold text-ink-muted">
            Récemment sur cet appareil
          </h3>
          <MemberGrid members={recent} onChoose={choose} />
        </section>
      )}

      <section aria-label="Tous les membres" className="flex flex-col gap-2">
        {recent.length > 0 && (
          <h3 className="text-sm font-semibold text-ink-muted">Tout le monde</h3>
        )}
        <MemberGrid members={others} onChoose={choose} currentId={me?.id} />
      </section>

      <Button variant="ghost" onClick={() => setAdding(true)} className="self-center">
        Je ne suis pas dans la liste
      </Button>

      <MemberSheet
        open={adding}
        onClose={() => setAdding(false)}
        defaults={defaultAppearance(members.length)}
        takenNames={active.map((m) => m.name)}
        onSubmit={async (draft) => {
          const id = await addMember(code, draft)
          choose(id)
        }}
      />
    </Screen>
  )
}

function MemberGrid({
  members,
  onChoose,
  currentId,
}: {
  members: Member[]
  onChoose: (id: string) => void
  currentId?: string
}) {
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {members.map((m) => (
        <li key={m.id}>
          <button
            type="button"
            onClick={() => onChoose(m.id)}
            aria-current={m.id === currentId ? 'true' : undefined}
            className="flex w-full flex-col items-center gap-2 rounded-[20px] border border-line bg-surface px-2 py-4 transition-transform duration-200 active:scale-95 aria-[current]:border-accent aria-[current]:border-2"
          >
            <Avatar name={m.name} color={m.color} emoji={m.emoji} size="lg" />
            <span className="w-full truncate text-center font-semibold">{m.name}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
