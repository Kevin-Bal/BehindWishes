import { useState } from 'react'
import { Link } from 'react-router'
import { Screen } from '../../components/Screen'
import { SegmentedControl } from '../../components/glass'
import { ChevronLeftIcon } from '../../components/icons'
import { Card } from '../../components/ui/Card'
import { useMe } from '../../lib/groupContext'
import { getTransparency, setTransparency, type Transparency } from '../../lib/preferences'

/**
 * Réglages d'affichage, propres à cet appareil. « Transparence réduite » rend les
 * barres et boutons opaques, en plus des réglages du système (transparence réduite,
 * contraste élevé, mouvement réduit, thème sombre), toujours respectés.
 */
export function SettingsPage() {
  const { basePath } = useMe()
  const [transparency, setValue] = useState<Transparency>(getTransparency)

  return (
    <Screen
      title="Affichage"
      leading={
        <Link
          to={`${basePath}/membres`}
          aria-label="Retour aux membres"
          className="-ml-2 flex size-11 items-center justify-center rounded-full"
        >
          <ChevronLeftIcon className="size-6" />
        </Link>
      }
    >
      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Transparence</h2>
        <p className="text-ink-muted">
          Si les barres en verre te gênent pour lire, passe en « Réduite » : elles deviennent
          opaques.
        </p>
        <SegmentedControl
          label="Transparence"
          value={transparency}
          onChange={(value) => {
            setTransparency(value)
            setValue(value)
          }}
          options={[
            { value: 'standard', label: 'Standard' },
            { value: 'reduced', label: 'Réduite' },
          ]}
        />
      </Card>
      <Card className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Réglages du téléphone</h2>
        <p className="text-ink-muted">
          L’app suit aussi automatiquement le mode sombre, le contraste élevé, la transparence
          réduite et la réduction des animations de ton téléphone.
        </p>
      </Card>
    </Screen>
  )
}
