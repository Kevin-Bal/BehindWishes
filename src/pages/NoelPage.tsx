import { useEffect, type CSSProperties } from 'react'
import { CadeauImage, Decor, EnvieBadge } from '../components/noel'
import { listeNoel, ORDRE_ENVIES, type Cadeau, type ListeNoel } from '../data/noel'
import { useListeNoel } from '../lib/vitrineNoel'
import '../styles/noel.css'

/**
 * Vitrine de ma liste de Noël (`/#/noel`) : une page autonome, en lecture seule,
 * style néo-brutaliste. Hors groupes, sans réservation, sans Liquid Glass.
 * Tout se modifie sur `/#/noel/edition`.
 */

/** Prix arrondi à l'euro, sauf les petits montants (« 12,99 € »). */
function formatPrix(prix: number, devise: 'EUR' | 'USD' = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: devise,
    maximumFractionDigits: prix < 20 ? 2 : 0,
  }).format(prix)
}

/** Jours restants avant le prochain 25 décembre (0 le jour J). */
function joursAvantNoel(maintenant = new Date()): number {
  const aujourdhui = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate())
  let noel = new Date(aujourdhui.getFullYear(), 11, 25)
  if (aujourdhui > noel) noel = new Date(aujourdhui.getFullYear() + 1, 11, 25)
  return Math.round((noel.getTime() - aujourdhui.getTime()) / 86_400_000)
}

export function NoelPage() {
  const etat = useListeNoel()
  const prenom = etat.statut === 'pret' ? etat.liste.prenom : listeNoel.prenom

  useEffect(() => {
    const avant = document.title
    document.title = `La liste de Noël de ${prenom}`
    return () => {
      document.title = avant
    }
  }, [prenom])

  return (
    <div className="nb-page">
      <div className="nb-stripes" aria-hidden="true" />
      {/* On attend la liste (cache local ou réseau) pour ne rien afficher puis remplacer. */}
      {etat.statut === 'chargement' ? (
        <p className="nb-loading nb-main">Je déballe la liste…</p>
      ) : (
        <Vitrine liste={etat.liste} />
      )}
      <div className="nb-stripes" aria-hidden="true" />
    </div>
  )
}

function Vitrine({ liste }: { liste: ListeNoel }) {
  const { prenom, intro, outro, cadeaux } = liste
  const jours = joursAvantNoel()
  // Tri stable : par envie, puis dans l'ordre de la liste.
  const tries = [...cadeaux].sort(
    (a, b) => ORDRE_ENVIES.indexOf(a.envie) - ORDRE_ENVIES.indexOf(b.envie),
  )

  return (
    <>
      <header className="nb-hero">
        <Decor />
        <p className="nb-countdown">
          {jours === 0 ? (
            <strong>C’est Noël !</strong>
          ) : (
            <>
              <strong>J-{jours}</strong> avant Noël
            </>
          )}
        </p>
        <p className="nb-eyebrow">La liste de Noël de</p>
        <h1 className="nb-title">
          {prenom}
          <span aria-hidden="true">.</span>
        </h1>
        {intro && <p className="nb-intro">{intro}</p>}
      </header>

      <main className="nb-main">
        <section className="nb-legend" aria-label="Niveaux d’envie">
          {ORDRE_ENVIES.map((envie) => (
            <EnvieBadge key={envie} envie={envie} />
          ))}
        </section>

        <p className="nb-count">
          {cadeaux.length} {cadeaux.length > 1 ? 'idées' : 'idée'} sous le sapin
        </p>

        <ul className="nb-grid">
          {tries.map((cadeau, i) => (
            <li key={cadeau.id} className={cadeau.options ? 'nb-grid__wide' : undefined}>
              <CadeauCard cadeau={cadeau} tilt={i % 2 === 0 ? -1 : 1} />
            </li>
          ))}
        </ul>
      </main>

      <footer className="nb-footer">
        {outro && <p className="nb-outro">{outro}</p>}
        <p className="nb-made">Fait avec Derrière la liste</p>
      </footer>
    </>
  )
}

function CadeauCard({ cadeau, tilt }: { cadeau: Cadeau; tilt: number }) {
  const {
    envie,
    nom,
    prix,
    devise,
    prixPar,
    quantite,
    lien,
    boutique,
    image,
    precisions,
    mot,
    options,
  } = cadeau

  return (
    <article
      className={`nb-card${options ? ' nb-card--options' : ''}`}
      style={{ '--tilt': `${tilt * (options ? 0.4 : 1)}deg` } as CSSProperties}
    >
      {options ? (
        <div className="nb-card__ribbon">
          <EnvieBadge envie={envie} />
        </div>
      ) : (
        <div className={`nb-card__media${image ? '' : ' nb-card__media--empty'}`}>
          <CadeauImage src={image} />
          <EnvieBadge envie={envie} />
        </div>
      )}

      <div className="nb-card__body">
        <h2 className="nb-card__title">{nom}</h2>
        {boutique && <p className="nb-card__shop">chez {boutique}</p>}

        {(quantite || (precisions && precisions.length > 0)) && (
          <ul className="nb-card__details">
            {quantite && (
              <li>
                <strong>Combien :</strong> {quantite}
              </li>
            )}
            {precisions?.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        )}

        {options && (
          <>
            <p className="nb-card__choose">Au choix parmi :</p>
            <ul className="nb-options">
              {options.map((option, i) => (
                <li key={i}>
                  <a
                    className="nb-option"
                    href={option.lien}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="nb-option__img">
                      <CadeauImage src={option.image} />
                    </span>
                    <span className="nb-option__name">{option.nom}</span>
                    {option.auteur && <span className="nb-option__author">{option.auteur}</span>}
                    <span className="nb-sr"> (nouvel onglet)</span>
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}

        {mot && <p className="nb-card__note">« {mot} »</p>}

        <div className="nb-card__footer">
          {prix !== undefined && (
            <p className="nb-price">
              <span className="nb-sr">Prix indicatif : </span>
              env. {formatPrix(prix, devise)}
              {prixPar && <span className="nb-price__per"> {prixPar}</span>}
            </p>
          )}
          {lien ? (
            <a className="nb-btn" href={lien} target="_blank" rel="noopener noreferrer">
              Voir le cadeau
              <span aria-hidden="true">↗</span>
              <span className="nb-sr"> (nouvel onglet)</span>
            </a>
          ) : (
            !options && <p className="nb-free">Idée libre : à toi de choisir !</p>
          )}
        </div>
      </div>
    </article>
  )
}
