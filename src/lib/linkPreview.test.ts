import { describe, expect, it } from 'vitest'
import { sanitizePreview } from './linkPreview'

describe('aperçu de lien reçu du proxy', () => {
  it('garde titre, image https et prix valides', () => {
    expect(
      sanitizePreview({ title: '  Un livre ', image: 'https://cdn.fr/a.jpg', price: 12.905 }),
    ).toEqual({ title: 'Un livre', image: 'https://cdn.fr/a.jpg', price: 12.91 })
  })

  it('écarte les valeurs suspectes', () => {
    expect(
      sanitizePreview({ title: 42, image: 'http://cdn.fr/a.jpg', price: -3, extra: 'x' }),
    ).toEqual({})
    expect(sanitizePreview(null)).toEqual({})
    expect(sanitizePreview({ title: 'x'.repeat(200) }).title).toHaveLength(120)
  })
})
