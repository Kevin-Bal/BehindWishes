/**
 * Identité choisie sur l'appareil (story A2), mémorisée par groupe.
 * Aucune donnée sensible : seulement des identifiants aléatoires de membres.
 */

const MAX_RECENT = 3
const identityKey = (code: string) => `dll:identity:${code}`
const recentKey = (code: string) => `dll:recent:${code}`
const LAST_GROUP_KEY = 'dll:lastGroup'

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Stockage indisponible (navigation privée stricte) : on continue sans mémoriser.
  }
}

export function getIdentity(code: string): string | null {
  return read(identityKey(code))
}

/** Mémorise l'identité et la place en tête des trois dernières utilisées. */
export function setIdentity(code: string, memberId: string): void {
  write(identityKey(code), memberId)
  const recent = [memberId, ...getRecentIdentities(code).filter((id) => id !== memberId)]
  write(recentKey(code), JSON.stringify(recent.slice(0, MAX_RECENT)))
  write(LAST_GROUP_KEY, code)
}

export function getRecentIdentities(code: string): string[] {
  try {
    const parsed: unknown = JSON.parse(read(recentKey(code)) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

/** Dernier groupe ouvert sur l'appareil, pour y revenir depuis l'accueil. */
export function getLastGroup(): string | null {
  return read(LAST_GROUP_KEY)
}

export function rememberGroup(code: string): void {
  write(LAST_GROUP_KEY, code)
}
