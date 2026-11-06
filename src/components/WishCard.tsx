import { useState, type ReactNode } from 'react'
import { formatPrice, urlDomain } from '../lib/wishFormat'
import type { Wish } from '../lib/wishes'
import { Stars } from './Stars'
import { Card } from './ui/Card'

/**
 * Carte opaque d'un souhait. Toute la carte ouvre une action (modifier sur ma liste,
 * détail des réservations sur celle d'un autre) ; le lien reste une cible distincte,
 * ouverte dans un nouvel onglet.
 */
export function WishCard({
  wish,
  onOpen,
  openLabel = 'Modifier',
  footer,
}: {
  wish: Wish
  onOpen?: () => void
  openLabel?: string
  footer?: ReactNode
}) {
  const [imageBroken, setImageBroken] = useState(false)
  const showImage = wish.imageUrl && !imageBroken
  const body = (
    <div className="flex gap-3">
      {showImage && (
        <img
          src={wish.imageUrl}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImageBroken(true)}
          className="size-16 shrink-0 rounded-xl border border-line bg-white object-contain"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1 text-lg leading-snug font-semibold break-words">
            {wish.title}
          </h3>
          {wish.priority && <Stars priority={wish.priority} className="mt-1 shrink-0" />}
        </div>
        {wish.description && (
          <p className="mt-1 line-clamp-3 text-ink-muted break-words whitespace-pre-line">
            {wish.description}
          </p>
        )}
      </div>
    </div>
  )

  return (
    <Card className="flex flex-col gap-2">
      {onOpen ? (
        <button type="button" onClick={onOpen} className="-m-1 rounded-2xl p-1 text-left">
          {body}
          <span className="sr-only">{openLabel}</span>
        </button>
      ) : (
        <div>{body}</div>
      )}
      {(wish.url || wish.priceEstimate !== undefined) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {wish.priceEstimate !== undefined && (
            <span className="font-semibold">{formatPrice(wish.priceEstimate)}</span>
          )}
          {wish.url && (
            <a
              href={wish.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1 font-semibold text-accent underline underline-offset-4"
            >
              Voir sur {urlDomain(wish.url)}
              <span aria-hidden="true">↗</span>
              <span className="sr-only">(nouvel onglet)</span>
            </a>
          )}
        </div>
      )}
      {footer}
    </Card>
  )
}
