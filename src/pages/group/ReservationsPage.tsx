import { GiftIcon } from '../../components/icons'
import { Card } from '../../components/ui/Card'
import { GroupScreen } from './GroupScreen'

/** « Mes réservations » (E4) — arrive au lot 4. */
export function ReservationsPage() {
  return (
    <GroupScreen title="Mes cadeaux">
      <Card className="flex flex-col items-center gap-2 py-8 text-center">
        <GiftIcon className="size-10 text-ink-muted" />
        <h2 className="text-lg font-semibold">Rien de réservé pour l’instant</h2>
        <p className="text-ink-muted">Les cadeaux que tu prends apparaîtront ici.</p>
      </Card>
    </GroupScreen>
  )
}
