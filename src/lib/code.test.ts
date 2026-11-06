import { describe, expect, it } from 'vitest'
import {
  CODE_ALPHABET,
  formatCode,
  formatCodeInput,
  generateCode,
  isValidCode,
  normalizeCode,
} from './code'

describe('codes de groupe', () => {
  it('ignore la casse, les espaces et les tirets (A1)', () => {
    expect(normalizeCode(' k7m2-qx4p ')).toBe('K7M2QX4P')
    expect(normalizeCode('k7 m2 qx 4p')).toBe('K7M2QX4P')
  })

  it('refuse les caractères ambigus et les mauvaises longueurs', () => {
    expect(isValidCode('K7M2QX4P')).toBe(true)
    expect(isValidCode('K7M2QX4O')).toBe(false)
    expect(isValidCode('K7M2QX41')).toBe(false)
    expect(isValidCode('K7M2QX4')).toBe(false)
  })

  it("formate pour l'affichage et pendant la frappe", () => {
    expect(formatCode('K7M2QX4P')).toBe('K7M2-QX4P')
    expect(formatCodeInput('k7m')).toBe('K7M')
    expect(formatCodeInput('k7m2q')).toBe('K7M2-Q')
    expect(formatCodeInput('k7m2-qx4p-zz')).toBe('K7M2-QX4P')
  })

  it("génère des codes valides n'utilisant que l'alphabet sans ambiguïté", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateCode()
      expect(isValidCode(code)).toBe(true)
      for (const char of code) expect(CODE_ALPHABET).toContain(char)
    }
  })
})
