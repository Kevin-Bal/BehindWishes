/**
 * Codes d'accès des groupes (story A1/A3) : 8 caractères sans ambiguïté
 * (ni 0/O, ni 1/I), affichés en deux blocs « K7M2-QX4P ».
 * L'identifiant Firestore du groupe est le code sans tiret.
 */

export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const CODE_LENGTH = 8
export const CODE_PATTERN = /^[A-HJ-NP-Z2-9]{8}$/

/** Ignore la casse, les espaces et les tirets. */
export function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/[\s-]/g, '')
}

export function isValidCode(code: string): boolean {
  return CODE_PATTERN.test(code)
}

/** « K7M2QX4P » → « K7M2-QX4P » (accepte aussi une saisie partielle). */
export function formatCode(code: string): string {
  const clean = normalizeCode(code)
  return clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean
}

/** Mise en forme pendant la frappe : lettres/chiffres seulement, 8 au plus, tiret auto. */
export function formatCodeInput(input: string): string {
  const clean = input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, CODE_LENGTH)
  return formatCode(clean)
}

export function generateCode(random: (n: number) => Uint32Array = randomValues): string {
  const values = random(CODE_LENGTH)
  let code = ''
  for (const value of values) code += CODE_ALPHABET[value % CODE_ALPHABET.length]
  return code
}

function randomValues(n: number): Uint32Array {
  return crypto.getRandomValues(new Uint32Array(n))
}

/** Lien partageable qui saute la saisie du code. */
export function groupLink(code: string): string {
  return `${location.origin}${import.meta.env.BASE_URL}#/g/${formatCode(code)}`
}
