/** Préférences locales à l'appareil (aucune donnée sensible). */

export type Transparency = 'standard' | 'reduced'

const TRANSPARENCY_KEY = 'dll:transparency'

export function getTransparency(): Transparency {
  try {
    return localStorage.getItem(TRANSPARENCY_KEY) === 'reduced' ? 'reduced' : 'standard'
  } catch {
    return 'standard'
  }
}

export function setTransparency(value: Transparency): void {
  try {
    localStorage.setItem(TRANSPARENCY_KEY, value)
  } catch {
    // stockage indisponible (navigation privée) : le réglage vaut pour la session
  }
  applyTransparency(value)
}

export function applyTransparency(value: Transparency = getTransparency()): void {
  if (value === 'reduced') {
    document.documentElement.dataset.transparency = 'reduced'
  } else {
    delete document.documentElement.dataset.transparency
  }
}

export type EventTheme = 'neutral' | 'noel'

/** Ambiance visuelle (palette rouge/vert/crème pour Noël, neutre sinon). */
export function applyEventTheme(theme: EventTheme): void {
  if (theme === 'noel') {
    document.documentElement.dataset.eventTheme = 'noel'
  } else {
    delete document.documentElement.dataset.eventTheme
  }
}
