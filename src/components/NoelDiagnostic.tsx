import { useEffect, useState } from 'react'

/**
 * Encart de diagnostic de la vitrine (`/#/noel?debug`) : largeurs, zoom et élément le
 * plus large, mis à jour pendant le défilement. Sert à comprendre un bug d'affichage
 * sur un vrai téléphone, à partir d'une simple capture d'écran.
 */

interface Mesure {
  ecran: number
  page: number
  zoom: number
  scrollY: number
  plusLarge: string
  pageMax: number
  zoomMin: number
  zoomMax: number
}

function elementLePlusLarge(): string {
  let pire: Element | null = null
  let droite = 0
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect()
    if (r.right > droite) {
      droite = r.right
      pire = el
    }
  }
  if (!pire) return '—'
  const classe = typeof pire.className === 'string' ? pire.className.split(' ')[0] : ''
  return `${pire.tagName.toLowerCase()}${classe ? '.' + classe : ''} → ${Math.round(droite)} px`
}

function mesurer(avant: Mesure | null): Mesure {
  const page = document.documentElement.scrollWidth
  const zoom = window.visualViewport?.scale ?? 1
  return {
    ecran: window.innerWidth,
    page,
    zoom,
    scrollY: Math.round(window.scrollY),
    plusLarge: elementLePlusLarge(),
    pageMax: Math.max(avant?.pageMax ?? 0, page),
    zoomMin: Math.min(avant?.zoomMin ?? zoom, zoom),
    zoomMax: Math.max(avant?.zoomMax ?? zoom, zoom),
  }
}

export function NoelDiagnostic() {
  const [mesure, setMesure] = useState<Mesure | null>(null)

  useEffect(() => {
    let attente = false
    const planifier = () => {
      if (attente) return
      attente = true
      setTimeout(() => {
        attente = false
        setMesure((avant) => mesurer(avant))
      }, 250)
    }
    planifier()
    window.addEventListener('scroll', planifier, { passive: true })
    window.addEventListener('resize', planifier)
    window.visualViewport?.addEventListener('resize', planifier)
    window.visualViewport?.addEventListener('scroll', planifier)
    const minuterie = setInterval(planifier, 1000)
    return () => {
      window.removeEventListener('scroll', planifier)
      window.removeEventListener('resize', planifier)
      window.visualViewport?.removeEventListener('resize', planifier)
      window.visualViewport?.removeEventListener('scroll', planifier)
      clearInterval(minuterie)
    }
  }, [])

  if (!mesure) return null
  const ios = /OS (\d+[_.]\d+)/.exec(navigator.userAgent)?.[1]?.replace('_', '.')
  return (
    <div className="nb-debug" aria-hidden="true">
      <div>
        version {__BUILD__}
        {ios ? ` · iOS ${ios}` : ''} · dpr {window.devicePixelRatio}
      </div>
      <div>
        écran {mesure.ecran} · page {mesure.page} (max {mesure.pageMax})
      </div>
      <div>
        zoom {mesure.zoom.toFixed(2)} (min {mesure.zoomMin.toFixed(2)}, max{' '}
        {mesure.zoomMax.toFixed(2)}) · y {mesure.scrollY}
      </div>
      <div>plus large : {mesure.plusLarge}</div>
    </div>
  )
}
