/**
 * Proxy de saisie intelligente des liens (V1.5), déployé sur Cloudflare Workers (gratuit).
 * Un navigateur ne peut pas lire les pages d'autres sites (CORS) : ce worker récupère
 * la page demandée et renvoie seulement titre, image et prix (balises Open Graph).
 *
 *   GET /preview?url=https://…  →  { title?, image?, price?, siteName? }
 *
 * Garde-fous : origines autorisées uniquement, http(s) seulement, pas d'adresse IP
 * ni de localhost, délai de 6 s, HTML lu sur 1 Mo au plus, réponse mise en cache 1 jour.
 */
import { parsePreview } from './parse'

interface Env {
  /** Origines autorisées, séparées par des virgules. */
  ALLOWED_ORIGINS: string
}

const MAX_BYTES = 1_000_000

function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(origin ? { 'access-control-allow-origin': origin, vary: 'Origin' } : {}),
      ...(status === 200 ? { 'cache-control': 'public, max-age=86400' } : {}),
    },
  })
}

function isPublicHttpUrl(raw: string | null): URL | null {
  if (!raw) return null
  try {
    const url = new URL(raw)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    const host = url.hostname
    if (host === 'localhost' || host.endsWith('.local') || !host.includes('.')) return null
    if (/^[\d.]+$/.test(host) || host.startsWith('[')) return null // adresses IP
    return url
  } catch {
    return null
  }
}

async function readLimited(response: Response): Promise<string> {
  const reader = response.body?.getReader()
  if (!reader) return ''
  const chunks: Uint8Array[] = []
  let size = 0
  while (size < MAX_BYTES) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    size += value.byteLength
  }
  await reader.cancel().catch(() => undefined)
  const all = new Uint8Array(Math.min(size, MAX_BYTES))
  let offset = 0
  for (const chunk of chunks) {
    const part = chunk.subarray(0, Math.max(0, all.length - offset))
    all.set(part, offset)
    offset += part.length
  }
  return new TextDecoder().decode(all)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('origin')
    const allowed = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    const allowedOrigin = origin && allowed.includes(origin) ? origin : null

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: allowedOrigin ? 204 : 403,
        headers: allowedOrigin
          ? {
              'access-control-allow-origin': allowedOrigin,
              'access-control-allow-methods': 'GET',
              'access-control-max-age': '86400',
            }
          : {},
      })
    }
    if (!allowedOrigin) return json({ error: 'origine refusée' }, 403, null)

    const { pathname, searchParams } = new URL(request.url)
    if (request.method !== 'GET' || pathname !== '/preview') {
      return json({ error: 'introuvable' }, 404, allowedOrigin)
    }
    const target = isPublicHttpUrl(searchParams.get('url'))
    if (!target) return json({ error: 'lien invalide' }, 400, allowedOrigin)

    try {
      const response = await fetch(target.href, {
        redirect: 'follow',
        signal: AbortSignal.timeout(6000),
        headers: {
          'user-agent':
            'Mozilla/5.0 (compatible; DerriereLaListe/1.0; +https://kevin-bal.github.io/BehindWishes/)',
          accept: 'text/html,application/xhtml+xml',
          'accept-language': 'fr-FR,fr;q=0.9',
        },
      })
      const type = response.headers.get('content-type') ?? ''
      if (!response.ok || !type.includes('html')) {
        return json({}, 200, allowedOrigin)
      }
      const html = await readLimited(response)
      return json(parsePreview(html, response.url || target.href), 200, allowedOrigin)
    } catch {
      // Site lent ou inaccessible : on renvoie un aperçu vide, la saisie reste manuelle.
      return json({}, 200, allowedOrigin)
    }
  },
}
