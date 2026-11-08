import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Screen } from '../../components/Screen'
import { CalendarIcon, GiftIcon, UsersIcon } from '../../components/icons'
import { useMe } from '../../lib/groupContext'

/**
 * Gabarit des écrans d'un groupe : identité (avatar + prénom) et onglets toujours
 * visibles, y compris sur les écrans de détail (évènement, liste, réglages), qui
 * passent un bouton retour en `leading`.
 */
export function GroupScreen({
  title,
  leading,
  fab,
  children,
}: {
  title: string
  leading?: ReactNode
  fab?: ReactNode
  children: ReactNode
}) {
  const { me, basePath } = useMe()
  const navigate = useNavigate()
  return (
    <Screen
      title={title}
      leading={leading}
      identity={{
        name: me.name,
        color: me.color,
        emoji: me.emoji,
        onChange: () => navigate(`${basePath}/qui`),
      }}
      fab={fab}
      tabs={[
        {
          to: basePath,
          label: 'Évènements',
          icon: CalendarIcon,
          end: true,
          also: [`${basePath}/e/`],
        },
        { to: `${basePath}/reservations`, label: 'Mes cadeaux', icon: GiftIcon },
        {
          to: `${basePath}/membres`,
          label: 'Membres',
          icon: UsersIcon,
          also: [`${basePath}/reglages`],
        },
      ]}
    >
      {children}
    </Screen>
  )
}
