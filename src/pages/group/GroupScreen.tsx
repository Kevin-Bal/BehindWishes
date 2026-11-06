import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Screen } from '../../components/Screen'
import { CalendarIcon, GiftIcon, UsersIcon } from '../../components/icons'
import { useMe } from '../../lib/groupContext'

/** Gabarit des écrans d'un groupe : barre d'identité « Tu es Léa · Changer » et onglets. */
export function GroupScreen({
  title,
  fab,
  children,
}: {
  title: string
  fab?: ReactNode
  children: ReactNode
}) {
  const { me, basePath } = useMe()
  const navigate = useNavigate()
  return (
    <Screen
      title={title}
      identity={{ name: me.name, onChange: () => navigate(`${basePath}/qui`) }}
      fab={fab}
      tabs={[
        { to: basePath, label: 'Évènements', icon: CalendarIcon, end: true },
        { to: `${basePath}/reservations`, label: 'Mes cadeaux', icon: GiftIcon },
        { to: `${basePath}/membres`, label: 'Membres', icon: UsersIcon },
      ]}
    >
      {children}
    </Screen>
  )
}
