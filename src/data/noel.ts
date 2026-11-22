/**
 * Contenu de la page vitrine `/#/noel` : ma liste de Noël, en lecture seule.
 * Liste de départ : dès le premier enregistrement depuis `/#/noel/edition`, c'est la
 * version en ligne (document Firestore `vitrines/noel`) qui fait foi.
 */

/** Niveau d'envie : affiché avec des étoiles et un libellé, jamais par la couleur seule. */
export type Envie = 'reve' | 'plaisir' | 'idee'

export const ENVIES: Record<Envie, { etoiles: string; libelle: string }> = {
  reve: { etoiles: '★★★', libelle: 'J’en rêve' },
  plaisir: { etoiles: '★★', libelle: 'Ça me ferait plaisir' },
  idee: { etoiles: '★', libelle: 'Si t’as une idée' },
}
/** Ordre d'affichage, de la plus forte envie à la plus faible. */
export const ORDRE_ENVIES: Envie[] = ['reve', 'plaisir', 'idee']

export function estEnvie(valeur: unknown): valeur is Envie {
  return typeof valeur === 'string' && (ORDRE_ENVIES as string[]).includes(valeur)
}

/** Une variante au choix (ex. une affiche parmi plusieurs). */
export interface Option {
  nom: string
  auteur?: string
  lien: string
  image?: string
}

export interface Cadeau {
  /** Identifiant stable : clé React et clé des envies dans Firestore. Ne pas le changer. */
  id: string
  nom: string
  /** Prix indicatif. */
  prix?: number
  /** Devise du prix (euros par défaut). */
  devise?: 'EUR' | 'USD'
  /** Précision affichée après le prix (« pièce », « l’affiche »). */
  prixPar?: string
  /** Quantité souhaitée, en clair (« 3 ou 4 »). */
  quantite?: string
  lien?: string
  /** Nom de la boutique affiché sous le titre (« chez … »). */
  boutique?: string
  image?: string
  /** Envie par défaut, tant qu'aucune n'a été choisie en ligne. */
  envie: Envie
  /** Taille, couleur, modèle, « pas celui-ci mais… ». */
  precisions?: string[]
  /** Petit mot perso. */
  mot?: string
  /** Plusieurs modèles au choix (affiché en galerie). */
  options?: Option[]
}

export interface ListeNoel {
  prenom: string
  intro: string
  outro?: string
  cadeaux: Cadeau[]
}

export const listeNoel: ListeNoel = {
  prenom: 'Kevin',
  intro:
    'Quelques idées si tu sèches. Rien d’obligatoire : ta présence au réveillon compte bien plus.',
  outro: 'Merci d’avance, et joyeux Noël !',
  cadeaux: [
    {
      id: 'pompe-cycplus-as2-pro',
      nom: 'Mini pompe vélo électrique Cycplus AS2 PRO',
      prix: 94.59,
      lien: 'https://www.alltricks.fr/F-11929-outillage/P-3205145-mini_pompe_velo_electrique_cycplus_as2_pro_compresseur_compacte',
      boutique: 'Alltricks',
      image: 'https://product-cdn.alltricks.com/medium/703/17703/3017703/6620494.jpg',
      envie: 'plaisir',
    },
    {
      id: 'casquette-remember-why',
      nom: 'Casquette de running « Remember why you started »',
      prix: 44,
      lien: 'https://www.bestrunningcap.com/products/remember-why-you-started-best-running-cap',
      boutique: 'Best Running Cap',
      image: 'https://www.bestrunningcap.com/cdn/shop/files/Light_green_cap_2.png?v=1792487893',
      envie: 'plaisir',
    },
    {
      id: 'ampoules-kajplats',
      nom: 'Ampoules connectées IKEA KAJPLATS',
      prix: 12.99,
      prixPar: 'pièce',
      quantite: '3 ou 4',
      lien: 'https://www.ikea.com/fr/fr/p/kajplats-ampoule-led-e27-1055-lumen-connecte-spectre-couleur-et-blanc-globe-opalin-70608575/',
      boutique: 'IKEA',
      image:
        'https://www.ikea.com/fr/fr/images/products/kajplats-ampoule-led-e27-1055-lumen-connecte-spectre-couleur-et-blanc-globe-opalin__1566511_pe1027733_s5.jpg',
      envie: 'plaisir',
      precisions: ['E27, 1055 lumen, couleur et blanc, globe opalin'],
    },
    {
      id: 'affiches-entree',
      nom: 'Des affiches encadrées pour mon entrée',
      prix: 71.14,
      prixPar: 'l’affiche',
      quantite: '2, ça suffit',
      boutique: 'DROOL',
      envie: 'plaisir',
      precisions: ['Format A3, avec un cadre stylé (noir, blanc ou bois)'],
      options: [
        {
          nom: 'Parallel Universe',
          auteur: 'Henry M.',
          lien: 'https://drool-art.com/products/parallel-universe-by-henry-m',
          image:
            'https://drool-art.com/cdn/shop/files/req-2d14af06-a001-40ce-9149-d20cd6835e40.jpg?v=1770766028',
        },
        {
          nom: 'Duck',
          auteur: 'wxvegraphica',
          lien: 'https://drool-art.com/products/duck-by-wxvegraphica',
          image:
            'https://drool-art.com/cdn/shop/files/req-76008425-7b1a-495a-935c-a8f4758be97e.jpg?v=1792771508',
        },
        {
          nom: 'Astral Projection',
          auteur: 'George Kempster',
          lien: 'https://drool-art.com/products/astral-projection-by-george-kempster',
          image:
            'https://drool-art.com/cdn/shop/files/Qne-WkhKVVamAIS2dCIekDcjqvllc8jrvnmll-VnG7U.jpg?v=1770160234',
        },
        {
          nom: 'Nine Lives',
          auteur: 'Alexander Khabbazi',
          lien: 'https://drool-art.com/products/nine-lives-by-alexander-khabbazi',
          image:
            'https://drool-art.com/cdn/shop/files/oywFKKKNu9IRJSo8n9IY9ct2-HVnYmBjX3Kg03hmY8g.jpg?v=1770161015',
        },
        {
          nom: 'Severance',
          auteur: 'Justyna Frąckiewicz',
          lien: 'https://drool-art.com/products/severance-by-justyna-frackiewicz',
          image:
            'https://drool-art.com/cdn/shop/files/req-e44c4fde-189f-447c-aec1-e1704a40f8a5.jpg?v=1770759785',
        },
      ],
    },
    {
      id: 'draps-bonsoirs',
      nom: 'De beaux et bons draps',
      prix: 149,
      prixPar: 'la parure',
      boutique: 'Bonsoirs',
      envie: 'plaisir',
      precisions: [
        'Parure en percale de coton 120 fils',
        'Drap housse 140 × 190, housse de couette 200 × 200, 2 taies 65 × 65',
        'L’une ou l’autre, pas les deux',
      ],
      options: [
        {
          nom: 'Mini Vichy Vert',
          lien: 'https://www.bonsoirs.com/fr-fr/products/parure-percale-de-coton-120-fils-mini-vichy-vert?options=140x190,200x200,65x65',
          image:
            'https://cdn.shopify.com/s/files/1/2171/4151/files/bonsoirs-lingedelit-percaledecoton-minivichyvert-pp-1.jpg?width=640',
        },
        {
          nom: 'Trio Caramel',
          lien: 'https://www.bonsoirs.com/fr-fr/products/parure-percale-de-coton-120-fils-trio-caramel?options=140x190,200x200,65x65',
          image:
            'https://cdn.shopify.com/s/files/1/2171/4151/files/boinsoirs-lingedelit-percaledecoton-triocaramel-pp-1.jpg?width=640',
        },
      ],
    },
    {
      id: 'tapis-blueprint',
      nom: 'Tapis de bureau The Blueprint',
      prix: 65,
      devise: 'USD',
      lien: 'https://slam.co/products/the-blueprint?variant=Batch+2',
      boutique: 'SLAM&CO',
      image:
        'https://cdn.shopify.com/s/files/1/0657/6301/6874/files/blueprint-deskmat-shopify-sep22.png?v=1790117877',
      envie: 'plaisir',
      precisions: ['Version « Batch 2 »'],
    },
    {
      id: 'lego-projet-derniere-chance',
      nom: 'LEGO Icons Projet Dernière Chance (11389)',
      prix: 109.99,
      lien: 'https://www.lego.com/fr-fr/product/project-hail-mary-11389',
      boutique: 'LEGO',
      image:
        'https://www.lego.com/cdn/cs/set/assets/blteb6b17f3f4ae151d/bltfe9034ee5bed08f3-11389_Prod.png?fit=bounds&format=jpg&quality=80&width=800&height=800&dpr=1',
      envie: 'plaisir',
    },
    {
      id: 'coup-de-main-appart',
      nom: 'Un coup de main pour mon appart',
      envie: 'plaisir',
      precisions: ['M’aider à faire les travaux', 'Des petits objets de déco'],
    },
    {
      id: 'meuble-rangement',
      nom: 'Un meuble de rangement',
      envie: 'plaisir',
      precisions: ['Qui pourrait plus tard aller derrière mon canapé'],
    },
    {
      id: 'vide-poche',
      nom: 'Un vide-poche stylé',
      envie: 'plaisir',
    },
  ],
}
