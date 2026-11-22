import { describe, expect, it } from 'vitest'
import { imageLegere } from './images'

describe('imageLegere', () => {
  it('demande la bonne largeur aux CDN Shopify', () => {
    expect(imageLegere('https://drool-art.com/cdn/shop/files/duck.jpg?v=123', 600)).toBe(
      'https://drool-art.com/cdn/shop/files/duck.jpg?v=123&width=600',
    )
    expect(imageLegere('https://cdn.shopify.com/s/files/1/a.png?width=1940', 500)).toBe(
      'https://cdn.shopify.com/s/files/1/a.png?width=500',
    )
  })

  it('remplace la taille des images LEGO', () => {
    expect(
      imageLegere('https://www.lego.com/cdn/cs/set/a.png?fit=bounds&width=800&height=800', 600),
    ).toBe('https://www.lego.com/cdn/cs/set/a.png?fit=bounds&width=600')
  })

  it('laisse les autres adresses intactes', () => {
    const ikea = 'https://www.ikea.com/fr/fr/images/products/a.jpg'
    expect(imageLegere(ikea, 600)).toBe(ikea)
    expect(imageLegere('pas une url', 600)).toBe('pas une url')
  })
})
