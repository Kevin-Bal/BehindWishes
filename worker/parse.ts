/**
 * Extraction des informations d'une page produit à partir de son HTML :
 * balises Open Graph / Twitter, <title>, et données structurées JSON-LD (schema.org).
 * Code pur, testé dans worker/parse.test.ts.
 */

export interface LinkPreview {
  title?: string
  image?: string
  /** Prix en euros, seulement si la page l'annonce en EUR. */
  price?: number
  siteName?: string
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  eacute: 'é',
  egrave: 'è',
  agrave: 'à',
  ccedil: 'ç',
  ecirc: 'ê',
  ocirc: 'ô',
  rsquo: '’',
  euro: '€',
}

export function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (match, name: string) => ENTITIES[name.toLowerCase()] ?? match)
}

function clean(text: string | undefined, max: number): string | undefined {
  if (!text) return undefined
  const value = decodeEntities(text).replace(/\s+/g, ' ').trim()
  return value ? value.slice(0, max) : undefined
}

/** Toutes les balises <meta> : clé (property, name ou itemprop) → content. */
function readMetas(html: string): Map<string, string> {
  const metas = new Map<string, string>()
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attr = (name: string) =>
      new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i').exec(tag)
    const key = attr('property') ?? attr('name') ?? attr('itemprop')
    const content = attr('content')
    if (!key || !content) continue
    const k = (key[2] ?? key[3] ?? '').toLowerCase()
    const v = content[2] ?? content[3] ?? ''
    if (k && !metas.has(k)) metas.set(k, v)
  }
  return metas
}

function parsePrice(raw: unknown): number | undefined {
  if (typeof raw === 'number') return raw >= 0 && raw <= 100_000 ? raw : undefined
  if (typeof raw !== 'string') return undefined
  // « 1 299,99 », « 1,299.99 », « 24.90 »
  let s = raw.replace(/[^\d.,]/g, '')
  if (s.includes(',') && s.includes('.')) {
    s =
      s.lastIndexOf(',') > s.lastIndexOf('.')
        ? s.replace(/\./g, '').replace(',', '.')
        : s.replace(/,/g, '')
  } else {
    s = s.replace(',', '.')
  }
  const value = Number(s)
  return Number.isFinite(value) && value >= 0 && value <= 100_000 && s !== '' ? value : undefined
}

/** Cherche un prix en EUR dans les blocs JSON-LD (Product → offers). */
function priceFromJsonLd(html: string): number | undefined {
  const blocks = html.matchAll(
    /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )
  for (const [, json] of blocks) {
    let data: unknown
    try {
      data = JSON.parse(json ?? '')
    } catch {
      continue
    }
    const stack: unknown[] = [data]
    while (stack.length) {
      const node = stack.pop()
      if (Array.isArray(node)) {
        stack.push(...node)
      } else if (node && typeof node === 'object') {
        const obj = node as Record<string, unknown>
        const currency = obj.priceCurrency
        const price = obj.price ?? obj.lowPrice
        if (price !== undefined && (currency === undefined || currency === 'EUR')) {
          const value = parsePrice(price)
          if (value !== undefined && currency === 'EUR') return value
        }
        stack.push(...Object.values(obj))
      }
    }
  }
  return undefined
}

function absoluteHttps(url: string | undefined, base: string): string | undefined {
  if (!url) return undefined
  try {
    const resolved = new URL(decodeEntities(url.trim()), base)
    if (resolved.protocol === 'http:') resolved.protocol = 'https:'
    return resolved.protocol === 'https:' && resolved.href.length <= 1000
      ? resolved.href
      : undefined
  } catch {
    return undefined
  }
}

/**
 * Retire le nom de la boutique collé en fin de titre :
 * « Le Petit Prince | Decitre », « Livre : Amazon.fr: Livres » → « Le Petit Prince », « Livre ».
 */
export function stripSiteSuffix(title: string, pageUrl: string): string {
  let brand: string | undefined
  try {
    const labels = new URL(pageUrl).hostname.replace(/^www\./, '').split('.')
    brand = labels.length >= 2 ? labels[labels.length - 2] : labels[0]
  } catch {
    return title
  }
  if (!brand || brand.length < 3) return title
  const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const stripped = title.replace(new RegExp(`\\s*[|:–—-]\\s*[^|:–—]*${escaped}[\\s\\S]*$`, 'i'), '')
  return stripped.trim().length >= 3 ? stripped.trim() : title
}

export function parsePreview(html: string, pageUrl: string): LinkPreview {
  const metas = readMetas(html)
  const titleTag = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]

  const rawTitle = clean(metas.get('og:title') ?? metas.get('twitter:title') ?? titleTag, 200)
  const title = rawTitle ? stripSiteSuffix(rawTitle, pageUrl).slice(0, 120) : undefined
  const image = absoluteHttps(
    metas.get('og:image:secure_url') ?? metas.get('og:image') ?? metas.get('twitter:image'),
    pageUrl,
  )
  const metaCurrency = (
    metas.get('product:price:currency') ??
    metas.get('og:price:currency') ??
    metas.get('pricecurrency')
  )?.toUpperCase()
  const metaPrice = parsePrice(
    metas.get('product:price:amount') ?? metas.get('og:price:amount') ?? metas.get('price'),
  )
  const price =
    metaPrice !== undefined && metaCurrency === 'EUR' ? metaPrice : priceFromJsonLd(html)

  return {
    ...(title ? { title } : {}),
    ...(image ? { image } : {}),
    ...(price !== undefined ? { price } : {}),
    ...(metas.get('og:site_name') ? { siteName: clean(metas.get('og:site_name'), 60) } : {}),
  }
}
