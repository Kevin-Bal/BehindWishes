import { WISH_LIMITS } from './wishFormat'

/**
 * Saisie intelligente d'un lien (V1.5) : demande au proxy Cloudflare (worker/) le titre,
 * l'image et le prix d'une page produit. Désactivée si VITE_LINK_PREVIEW_URL est absent.
 */
const endpoint = import.meta.env.VITE_LINK_PREVIEW_URL?.replace(/\/$/, '')

export const linkPreviewEnabled = Boolean(endpoint)

export interface LinkPreview {
  title?: string
  image?: string
  price?: number
}

/** Ne garde que des valeurs sûres et conformes aux règles Firestore. */
export function sanitizePreview(data: unknown): LinkPreview {
  if (!data || typeof data !== 'object') return {}
  const raw = data as Record<string, unknown>
  const title =
    typeof raw.title === 'string' ? raw.title.trim().slice(0, WISH_LIMITS.title) : undefined
  const image =
    typeof raw.image === 'string' &&
    raw.image.startsWith('https://') &&
    raw.image.length <= WISH_LIMITS.imageUrl
      ? raw.image
      : undefined
  const price =
    typeof raw.price === 'number' && raw.price >= 0 && raw.price <= WISH_LIMITS.maxPrice
      ? Math.round(raw.price * 100) / 100
      : undefined
  return {
    ...(title ? { title } : {}),
    ...(image ? { image } : {}),
    ...(price !== undefined ? { price } : {}),
  }
}

export async function fetchLinkPreview(url: string, signal: AbortSignal): Promise<LinkPreview> {
  if (!endpoint) return {}
  const response = await fetch(`${endpoint}/preview?url=${encodeURIComponent(url)}`, { signal })
  if (!response.ok) return {}
  return sanitizePreview(await response.json())
}
