import { Link } from 'react-router'
import { Screen } from '../components/Screen'
import { Card } from '../components/ui/Card'
import { ChevronLeftIcon } from '../components/icons'

/** Écran provisoire pour les routes des lots suivants. */
export function PlaceholderPage({ title, lot }: { title: string; lot: string }) {
  return (
    <Screen
      title={title}
      leading={
        <Link
          to="/"
          aria-label="Retour à l'accueil"
          className="-ml-2 flex size-11 items-center justify-center rounded-full"
        >
          <ChevronLeftIcon className="size-6" />
        </Link>
      }
    >
      <Card>
        <p className="text-ink-muted">Cet écran arrive avec le {lot}.</p>
      </Card>
    </Screen>
  )
}
