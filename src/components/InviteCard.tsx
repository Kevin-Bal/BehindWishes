import { useState } from 'react'
import { formatCode, groupLink } from '../lib/code'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

/** Code du groupe avec « Copier » et « Partager » (A3). */
export function InviteCard({ code, groupName }: { code: string; groupName: string }) {
  const [copied, setCopied] = useState(false)
  const link = groupLink(code)
  const canShare = typeof navigator.share === 'function'

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Presse-papiers refusé : le code reste lisible à l'écran.
    }
  }

  async function share() {
    try {
      await navigator.share({
        title: 'Derrière la liste',
        text: `Rejoins « ${groupName} » sur Derrière la liste avec le code ${formatCode(code)}`,
        url: link,
      })
    } catch {
      // Partage annulé par l'utilisateur.
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold">Invite ta famille</h2>
        <p className="text-sm text-ink-muted">Envoie ce code ou le lien : pas besoin de compte.</p>
      </div>
      <p
        className="rounded-2xl bg-surface-muted py-3 text-center font-mono text-3xl font-semibold tracking-[0.15em]"
        aria-label={`Code du groupe : ${formatCode(code).split('').join(' ')}`}
      >
        {formatCode(code)}
      </p>
      <div className="flex gap-2">
        <Button onClick={copy} className="flex-1">
          <span aria-live="polite">{copied ? 'Lien copié ✓' : 'Copier le lien'}</span>
        </Button>
        {canShare && (
          <Button variant="primary" onClick={share} className="flex-1">
            Partager
          </Button>
        )}
      </div>
    </Card>
  )
}
