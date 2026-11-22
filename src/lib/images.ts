/**
 * Demande aux CDN des boutiques une image à la taille affichée plutôt que l'original
 * (souvent 1 000 à 2 000 px) : moins de mémoire pour décoder, surtout sur iPhone.
 * Adresse inconnue ou invalide : renvoyée telle quelle.
 */
export function imageLegere(src: string, largeur: number): string {
  let url: URL
  try {
    url = new URL(src)
  } catch {
    return src
  }
  const shopify = url.hostname === 'cdn.shopify.com' || url.pathname.includes('/cdn/shop/')
  const lego = url.hostname.endsWith('lego.com') && url.pathname.includes('/cdn/')
  if (shopify || lego) {
    url.searchParams.set('width', String(largeur))
    if (lego) url.searchParams.delete('height')
    return url.toString()
  }
  return src
}
