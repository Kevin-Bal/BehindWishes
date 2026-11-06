/** Dates d'évènements : jour civil local, affichage fr-FR, compte à rebours « J-49 ». */

const DAY_MS = 24 * 60 * 60 * 1000

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/** Nombre de jours entre aujourd'hui et la date (négatif si passée). */
export function daysUntil(date: Date, now: Date = new Date()): number {
  return Math.round((startOfDay(date) - startOfDay(now)) / DAY_MS)
}

/** « J-49 », « Demain », « Aujourd'hui », « Passé ». */
export function countdownLabel(date: Date, now: Date = new Date()): string {
  const days = daysUntil(date, now)
  if (days > 1) return `J-${days}`
  if (days === 1) return 'Demain'
  if (days === 0) return 'Aujourd’hui'
  return 'Passé'
}

const longFormat = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/** « mercredi 25 décembre 2026 » */
export function formatLongDate(date: Date): string {
  return longFormat.format(date)
}

/** Date → valeur d'un <input type="date"> (AAAA-MM-JJ, jour local). */
export function toDateInputValue(date: Date | null): string {
  if (!date) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * Valeur d'un <input type="date"> → Date à midi local : le jour reste le même
 * pour les proches qui vivent dans un autre fuseau horaire.
 */
export function fromDateInputValue(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12)
}

/** Tri : évènements datés du plus proche au plus lointain, puis ceux sans date. */
export function compareEventDates(a: Date | null, b: Date | null): number {
  if (a && b) return a.getTime() - b.getTime()
  if (a) return -1
  if (b) return 1
  return 0
}
