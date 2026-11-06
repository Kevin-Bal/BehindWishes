import { InviteCard } from '../../components/InviteCard'
import { CalendarIcon } from '../../components/icons'
import { Card } from '../../components/ui/Card'
import { useMe } from '../../lib/groupContext'
import { GroupScreen } from './GroupScreen'

/** Accueil du groupe. Les cartes d'évènements (C1) arrivent au lot 2. */
export function GroupHomePage() {
  const { group, code } = useMe()
  return (
    <GroupScreen title={group.name}>
      <Card className="flex flex-col items-center gap-2 py-8 text-center">
        <CalendarIcon className="size-10 text-ink-muted" />
        <h2 className="text-lg font-semibold">Aucun évènement pour l’instant</h2>
        <p className="text-ink-muted">
          Bientôt, tu pourras créer « Noël 2026 » ou un anniversaire ici.
        </p>
      </Card>
      <InviteCard code={code} groupName={group.name} />
    </GroupScreen>
  )
}
