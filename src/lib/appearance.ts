/**
 * Couleurs et emojis des membres (story B2). Couleurs assez foncées pour
 * qu'une initiale blanche reste lisible (contraste AA).
 */

export const MEMBER_COLORS = [
  '#b8322a',
  '#c2410c',
  '#a16207',
  '#2f6b4f',
  '#0f766e',
  '#1d4ed8',
  '#4338ca',
  '#7e22ce',
  '#be185d',
  '#475569',
] as const

export const MEMBER_EMOJIS = [
  '🦊',
  '🐻',
  '🐼',
  '🐨',
  '🐯',
  '🦁',
  '🐸',
  '🐵',
  '🐧',
  '🦉',
  '🐙',
  '🦄',
  '🐝',
  '🐞',
  '🌻',
  '🌷',
  '🍀',
  '⭐',
  '🎄',
  '🎁',
  '⛄',
  '🎈',
  '🚀',
  '⚽',
] as const

/** Apparence par défaut du n-ième membre : couleurs et emojis variés. */
export function defaultAppearance(index: number): { color: string; emoji: string } {
  return {
    color: MEMBER_COLORS[index % MEMBER_COLORS.length] ?? MEMBER_COLORS[0],
    emoji: MEMBER_EMOJIS[(index * 7) % MEMBER_EMOJIS.length] ?? MEMBER_EMOJIS[0],
  }
}
