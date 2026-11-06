/** Utilitaires purs des souhaits : liens, prix, priorité, tri (D2, D4). */

export const WISH_LIMITS = {
  title: 120,
  description: 500,
  url: 500,
  maxPrice: 100_000,
  imageUrl: 1000,
} as const

export type Priority = 1 | 2 | 3

/**
 * Valide un lien (http/https uniquement). Ajoute `https://` si l'adresse est
 * collée sans protocole (« amazon.fr/… »). Renvoie `null` si invalide.
 */
export function normalizeUrl(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const url = new URL(withScheme)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    if (!url.hostname.includes('.')) return null
    const href = url.href
    return href.length <= WISH_LIMITS.url ? href : null
  } catch {
    return null
  }
}

/** « https://www.amazon.fr/dp/123 » → « amazon.fr » */
export function urlDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/** « 12,50 », « 12.5 € », « 30 » → nombre ; vide → null ; invalide → NaN. */
export function parsePrice(input: string): number | null {
  // \s couvre aussi les espaces insécables (« 1 000 € » copié depuis un site).
  const cleaned = input.replace(/[€\s]/g, '').replace(',', '.')
  if (!cleaned) return null
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return Number.NaN
  const value = Number(cleaned)
  return value <= WISH_LIMITS.maxPrice ? value : Number.NaN
}

const euroWhole = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})
const euroCents = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
})

/** « 30 € », « 24,90 € » */
export function formatPrice(value: number): string {
  return (Number.isInteger(value) ? euroWhole : euroCents).format(value)
}

/** Prix → valeur du champ de saisie (« 12,5 »). */
export function priceInputValue(value: number | undefined): string {
  return value === undefined ? '' : String(value).replace('.', ',')
}

/** Tri D4 : priorité décroissante (sans priorité en dernier), puis date d'ajout. */
export function compareWishes(
  a: { priority?: Priority; createdAt: Date },
  b: { priority?: Priority; createdAt: Date },
): number {
  const byPriority = (b.priority ?? 0) - (a.priority ?? 0)
  return byPriority !== 0 ? byPriority : a.createdAt.getTime() - b.createdAt.getTime()
}
