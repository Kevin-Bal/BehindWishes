import { describe, expect, it } from 'vitest'
import { lireListe, nettoyerListe, urlSure } from './vitrineNoel'

describe('vitrine de Noël', () => {
  it('ignore un document sans liste de cadeaux', () => {
    expect(lireListe(undefined)).toBeNull()
    expect(lireListe({ envies: {} })).toBeNull()
  })

  it('ne garde que des liens web', () => {
    expect(urlSure('https://lego.com')).toBe('https://lego.com')
    expect(urlSure('javascript:alert(1)')).toBeUndefined()
    expect(urlSure('  ')).toBeUndefined()
  })

  it('nettoie un brouillon avant enregistrement', () => {
    const liste = nettoyerListe({
      prenom: ' Kevin ',
      intro: 'Coucou',
      cadeaux: [
        {
          id: 'a',
          nom: ' Draps ',
          envie: 'reve',
          lien: 'javascript:alert(1)',
          precisions: ['140 × 190', '', '  '],
          options: [
            { nom: 'Vert', lien: 'https://bonsoirs.com/vert' },
            { nom: 'Sans lien', lien: '' },
          ],
        },
        { id: 'b', nom: '   ', envie: 'idee' },
      ],
    })
    expect(liste.prenom).toBe('Kevin')
    expect(liste.cadeaux).toHaveLength(1)
    const [draps] = liste.cadeaux
    expect(draps?.nom).toBe('Draps')
    expect(draps?.lien).toBeUndefined()
    expect(draps?.precisions).toEqual(['140 × 190'])
    expect(draps?.options).toEqual([
      { nom: 'Vert', lien: 'https://bonsoirs.com/vert', auteur: undefined, image: undefined },
    ])
  })

  it('remet une envie inconnue à « Ça me ferait plaisir »', () => {
    const liste = lireListe({
      prenom: 'K',
      intro: '',
      cadeaux: [{ id: 'a', nom: 'X', envie: '?' }],
    })
    expect(liste?.cadeaux[0]?.envie).toBe('plaisir')
  })
})
