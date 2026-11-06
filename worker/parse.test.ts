import { describe, expect, it } from 'vitest'
import { decodeEntities, parsePreview, stripSiteSuffix } from './parse'

const page = (head: string) => `<!doctype html><html><head>${head}</head><body></body></html>`

describe('lecture Open Graph (saisie intelligente)', () => {
  it('lit titre, image et prix en euros', () => {
    const html = page(`
      <meta property="og:title" content="Le Petit Prince &amp; autres contes">
      <meta property="og:image" content="//cdn.exemple.fr/img/prince.jpg">
      <meta property="product:price:amount" content="12,90">
      <meta property="product:price:currency" content="EUR">
      <meta property="og:site_name" content="Librairie">`)
    expect(parsePreview(html, 'https://www.exemple.fr/livre')).toEqual({
      title: 'Le Petit Prince & autres contes',
      image: 'https://cdn.exemple.fr/img/prince.jpg',
      price: 12.9,
      siteName: 'Librairie',
    })
  })

  it('se rabat sur <title> et twitter:image', () => {
    const html = page(`<title> Pull en laine
      bleu </title><meta name="twitter:image" content="/p.png">`)
    expect(parsePreview(html, 'https://boutique.fr/pull')).toEqual({
      title: 'Pull en laine bleu',
      image: 'https://boutique.fr/p.png',
    })
  })

  it('lit le prix dans les données structurées JSON-LD', () => {
    const html = page(`<script type="application/ld+json">
      {"@type":"Product","name":"Lego","offers":{"@type":"Offer","price":"1 299,99","priceCurrency":"EUR"}}
      </script>`)
    expect(parsePreview(html, 'https://lego.fr').price).toBe(1299.99)
  })

  it('ignore les prix dans une autre devise et les images non https', () => {
    const html = page(`
      <meta property="og:price:amount" content="30">
      <meta property="og:price:currency" content="USD">
      <meta property="og:image" content="javascript:alert(1)">`)
    expect(parsePreview(html, 'https://shop.com')).toEqual({})
  })

  it('retire le nom de la boutique en fin de titre', () => {
    expect(
      stripSiteSuffix(
        'Le Petit Prince. Edition spéciale - Antoine de Saint-Exupéry | Decitre',
        'https://www.decitre.fr/livres/x.html',
      ),
    ).toBe('Le Petit Prince. Edition spéciale - Antoine de Saint-Exupéry')
    expect(
      stripSiteSuffix(
        'LE PETIT PRINCE : Saint-Exupery, Antoine de: Amazon.fr: Livres',
        'https://www.amazon.fr/dp/2070612759',
      ),
    ).toBe('LE PETIT PRINCE : Saint-Exupery, Antoine de')
    // La marque en début de titre est conservée.
    expect(stripSiteSuffix('GitHub - workers-sdk', 'https://github.com/x')).toBe(
      'GitHub - workers-sdk',
    )
  })

  it('décode les entités HTML', () => {
    expect(decodeEntities('Caf&eacute; &#233;t&#xE9; &rsquo;')).toBe('Café été ’')
  })
})
