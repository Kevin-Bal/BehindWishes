import { useState } from 'react'
import { ENVIES, type Envie } from '../data/noel'
import { imageLegere } from '../lib/images'

/**
 * Briques néo-brutalistes partagées par la vitrine `/#/noel` et sa page d'édition.
 * Styles dans src/styles/noel.css (classes .nb-*).
 */

export function EnvieBadge({ envie }: { envie: Envie }) {
  const { etoiles, libelle } = ENVIES[envie]
  return (
    <span className={`nb-envie nb-envie--${envie}`}>
      <span aria-hidden="true">{etoiles}</span> {libelle}
    </span>
  )
}

/**
 * Photo produit, demandée à la taille affichée (`largeur`, en pixels réels) ; si le
 * CDN refuse la version réduite, on retente l'originale, puis on dessine un paquet cadeau.
 */
export function CadeauImage({
  src,
  className,
  largeur = 700,
}: {
  src?: string
  className?: string
  largeur?: number
}) {
  const [essai, setEssai] = useState<'leger' | 'original' | 'ko'>('leger')
  if (!src || essai === 'ko') return <GiftIcon />
  const leger = imageLegere(src, largeur)
  return (
    <img
      className={className}
      src={essai === 'leger' ? leger : src}
      alt=""
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setEssai(essai === 'leger' && leger !== src ? 'original' : 'ko')}
    />
  )
}

export function GiftIcon() {
  return (
    <svg className="nb-gift" viewBox="0 0 64 64" aria-hidden="true">
      <rect
        x="8"
        y="26"
        width="48"
        height="32"
        fill="var(--nb-red)"
        stroke="#111"
        strokeWidth="3"
      />
      <rect
        x="4"
        y="16"
        width="56"
        height="12"
        fill="var(--nb-red)"
        stroke="#111"
        strokeWidth="3"
      />
      <rect
        x="27"
        y="16"
        width="10"
        height="42"
        fill="var(--nb-gold)"
        stroke="#111"
        strokeWidth="3"
      />
      <path
        d="M32 16c-6-10-18-10-16-2s16 2 16 2zm0 0c6-10 18-10 16-2s-16 2-16 2z"
        fill="var(--nb-gold)"
        stroke="#111"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const STAR = 'M12 1l3.2 7 7.6.8-5.7 5.1 1.6 7.5L12 17.6 5.3 21.4l1.6-7.5L1.2 8.8l7.6-.8z'
const FLAKE = 'M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9 3.5l3 2.5 3-2.5M9 20.5l3-2.5 3 2.5'

/** Étoiles et flocons décoratifs autour du titre. */
export function Decor() {
  return (
    <div className="nb-decor" aria-hidden="true">
      <svg className="nb-decor__star nb-decor__star--a" viewBox="0 0 24 24">
        <path d={STAR} />
      </svg>
      <svg className="nb-decor__flake nb-decor__flake--b" viewBox="0 0 24 24">
        <path d={FLAKE} />
      </svg>
      <svg className="nb-decor__flake nb-decor__flake--c" viewBox="0 0 24 24">
        <path d={FLAKE} />
      </svg>
      <svg className="nb-decor__star nb-decor__star--d" viewBox="0 0 24 24">
        <path d={STAR} />
      </svg>
    </div>
  )
}
