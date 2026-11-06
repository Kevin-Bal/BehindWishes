import { describe, expect, it } from 'vitest'
import {
  compareWishes,
  formatPrice,
  normalizeUrl,
  parsePrice,
  urlDomain,
  type Priority,
} from './wishFormat'

describe('liens de souhait (D2)', () => {
  it('accepte http et https, ajoute https si absent', () => {
    expect(normalizeUrl('https://www.amazon.fr/dp/123')).toBe('https://www.amazon.fr/dp/123')
    expect(normalizeUrl('http://fnac.com')).toBe('http://fnac.com/')
    expect(normalizeUrl('  amazon.fr/dp/123 ')).toBe('https://amazon.fr/dp/123')
  })

  it('refuse les autres protocoles et les adresses invalides', () => {
    expect(normalizeUrl('javascript:alert(1)')).toBeNull()
    expect(normalizeUrl('ftp://exemple.fr')).toBeNull()
    expect(normalizeUrl('mailto:a@b.fr')).toBeNull()
    expect(normalizeUrl('pas un lien')).toBeNull()
    expect(normalizeUrl('localhost')).toBeNull()
    expect(normalizeUrl('')).toBeNull()
    expect(normalizeUrl(`https://a.fr/${'x'.repeat(500)}`)).toBeNull()
  })

  it('affiche le domaine sans www', () => {
    expect(urlDomain('https://www.amazon.fr/dp/123')).toBe('amazon.fr')
    expect(urlDomain('https://boutique.lego.com/fr')).toBe('boutique.lego.com')
  })
})

describe('prix indicatif', () => {
  it('lit les formats français', () => {
    expect(parsePrice('12,50')).toBe(12.5)
    expect(parsePrice('30 €')).toBe(30)
    expect(parsePrice('7.9')).toBe(7.9)
    expect(parsePrice('')).toBeNull()
  })

  it('affiche les centimes seulement quand il y en a', () => {
    expect(formatPrice(24.9)).toMatch(/^24,90\s€$/)
    expect(formatPrice(30)).toMatch(/^30\s€$/)
  })

  it('refuse les valeurs invalides', () => {
    expect(parsePrice('douze')).toBeNaN()
    expect(parsePrice('-5')).toBeNaN()
    expect(parsePrice('1,999')).toBeNaN()
    expect(parsePrice('200000')).toBeNaN()
  })
})

describe('tri des souhaits (D4)', () => {
  it('priorité décroissante puis date d’ajout', () => {
    const w = (title: string, priority: Priority | undefined, day: number) => ({
      title,
      priority,
      createdAt: new Date(2026, 10, day),
    })
    const sorted = [
      w('sans priorité', undefined, 1),
      w('une étoile', 1, 2),
      w('trois étoiles récent', 3, 5),
      w('trois étoiles ancien', 3, 3),
    ].sort(compareWishes)
    expect(sorted.map((x) => x.title)).toEqual([
      'trois étoiles ancien',
      'trois étoiles récent',
      'une étoile',
      'sans priorité',
    ])
  })
})
