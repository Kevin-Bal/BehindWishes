import { useRef, useState, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { ENVIES, ORDRE_ENVIES, type Cadeau, type Option } from '../data/noel'
import { fetchLinkPreview, linkPreviewEnabled } from '../lib/linkPreview'
import { CadeauImage } from './noel'

/**
 * Formulaire d'un cadeau sur `/#/noel/edition` : envie toujours visible, le reste
 * (infos, prix, modèles au choix, ordre, suppression) dans « Modifier les infos ».
 */

interface Props {
  cadeau: Cadeau
  index: number
  total: number
  /** Ouvert d'emblée (cadeau tout juste ajouté). */
  ouvertAuDepart: boolean
  erreur?: string
  onChange: (patch: Partial<Cadeau>) => void
  onSupprimer: () => void
  onDeplacer: (sens: -1 | 1) => void
}

/** « 12,99 », « 12.99 € » → 12.99 ; vide → undefined ; invalide → null. */
function lirePrix(texte: string): number | undefined | null {
  const propre = texte.replace(/[\s€$]/g, '').replace(',', '.')
  if (!propre) return undefined
  const n = Number(propre)
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null
}

function prixEnTexte(prix: number | undefined): string {
  return prix === undefined ? '' : String(prix).replace('.', ',')
}

export function NoelCadeauEditeur({
  cadeau,
  index,
  total,
  ouvertAuDepart,
  erreur,
  onChange,
  onSupprimer,
  onDeplacer,
}: Props) {
  const [ouvert, setOuvert] = useState(ouvertAuDepart)
  const [prixTexte, setPrixTexte] = useState(() => prixEnTexte(cadeau.prix))
  const [confirmer, setConfirmer] = useState(false)
  const [remplissage, setRemplissage] = useState<string | null>(null)
  const requete = useRef<AbortController | null>(null)
  const id = `cadeau-${cadeau.id}`
  const options = cadeau.options ?? []
  const prixInvalide = lirePrix(prixTexte) === null

  function changerPrix(texte: string) {
    setPrixTexte(texte)
    const prix = lirePrix(texte)
    onChange({ prix: prix === null ? undefined : prix })
  }

  function changerOption(i: number, patch: Partial<Option>) {
    onChange({ options: options.map((o, j) => (j === i ? { ...o, ...patch } : o)) })
  }

  function retirerOption(i: number) {
    const reste = options.filter((_, j) => j !== i)
    onChange({ options: reste.length > 0 ? reste : undefined })
  }

  async function remplirDepuisLien() {
    if (!cadeau.lien) return
    requete.current?.abort()
    const controleur = new AbortController()
    requete.current = controleur
    setRemplissage('Je lis la page…')
    try {
      const apercu = await fetchLinkPreview(cadeau.lien, controleur.signal)
      const patch: Partial<Cadeau> = {}
      const remplis: string[] = []
      if (apercu.title && !cadeau.nom.trim()) {
        patch.nom = apercu.title
        remplis.push('nom')
      }
      if (apercu.image && !cadeau.image) {
        patch.image = apercu.image
        remplis.push('image')
      }
      if (apercu.price !== undefined && cadeau.prix === undefined) {
        patch.prix = apercu.price
        setPrixTexte(prixEnTexte(apercu.price))
        remplis.push('prix')
      }
      onChange(patch)
      setRemplissage(
        remplis.length > 0
          ? `Rempli : ${remplis.join(', ')}.`
          : 'Rien de nouveau (champs déjà remplis, ou le site bloque la lecture).',
      )
    } catch (error) {
      if ((error as { name?: string }).name !== 'AbortError') {
        setRemplissage('Impossible de lire ce lien.')
      }
    }
  }

  return (
    <article className="nb-edit" id={id} aria-invalid={erreur ? true : undefined}>
      <div className="nb-edit__head">
        <span className="nb-edit__thumb">
          <CadeauImage src={cadeau.image ?? options[0]?.image} />
        </span>
        <h3 className="nb-edit__name">{cadeau.nom.trim() || 'Nouveau cadeau'}</h3>
      </div>

      {erreur && <p className="nb-edit__error">{erreur}</p>}

      <fieldset className="nb-choices">
        <legend className="nb-sr">Envie pour {cadeau.nom || 'ce cadeau'}</legend>
        {ORDRE_ENVIES.map((envie) => (
          <label key={envie} className={`nb-choice nb-choice--${envie}`}>
            <input
              type="radio"
              name={`envie-${cadeau.id}`}
              value={envie}
              checked={cadeau.envie === envie}
              onChange={() => onChange({ envie })}
            />
            <span aria-hidden="true" className="nb-choice__stars">
              {ENVIES[envie].etoiles}
            </span>
            <span>{ENVIES[envie].libelle}</span>
          </label>
        ))}
      </fieldset>

      <details
        className="nb-edit__more"
        open={ouvert || !!erreur}
        onToggle={(e) => setOuvert(e.currentTarget.open)}
      >
        <summary>Modifier les infos</summary>

        <div className="nb-form">
          <Champ
            label="Nom"
            required
            value={cadeau.nom}
            maxLength={200}
            data-champ="nom"
            onChange={(e) => onChange({ nom: e.target.value })}
          />
          <Champ
            label="Lien"
            type="url"
            inputMode="url"
            placeholder="https://…"
            value={cadeau.lien ?? ''}
            onChange={(e) => onChange({ lien: e.target.value || undefined })}
          />
          {linkPreviewEnabled && cadeau.lien && (
            <div className="nb-form__inline">
              <button
                type="button"
                className="nb-btn nb-btn--light nb-btn--small"
                onClick={() => void remplirDepuisLien()}
              >
                Remplir depuis le lien
              </button>
              {remplissage && (
                <span className="nb-field__help" role="status">
                  {remplissage}
                </span>
              )}
            </div>
          )}
          <Champ
            label="Boutique"
            placeholder="IKEA, LEGO…"
            value={cadeau.boutique ?? ''}
            maxLength={60}
            onChange={(e) => onChange({ boutique: e.target.value || undefined })}
          />
          <Champ
            label="Image (lien)"
            type="url"
            inputMode="url"
            placeholder="https://…/photo.jpg"
            value={cadeau.image ?? ''}
            onChange={(e) => onChange({ image: e.target.value || undefined })}
          />

          <div className="nb-form__row">
            <Champ
              label="Prix"
              inputMode="decimal"
              placeholder="49,90"
              value={prixTexte}
              aide={prixInvalide ? 'Un nombre, par exemple 49,90' : undefined}
              aria-invalid={prixInvalide || undefined}
              onChange={(e) => changerPrix(e.target.value)}
            />
            <label className="nb-field nb-field--narrow">
              <span className="nb-field__label">Devise</span>
              <select
                className="nb-input"
                value={cadeau.devise ?? 'EUR'}
                onChange={(e) => onChange({ devise: e.target.value === 'USD' ? 'USD' : 'EUR' })}
              >
                <option value="EUR">€</option>
                <option value="USD">$</option>
              </select>
            </label>
            <Champ
              label="Par"
              placeholder="pièce"
              value={cadeau.prixPar ?? ''}
              maxLength={40}
              onChange={(e) => onChange({ prixPar: e.target.value || undefined })}
            />
          </div>

          <Champ
            label="Combien"
            placeholder="3 ou 4"
            value={cadeau.quantite ?? ''}
            maxLength={60}
            onChange={(e) => onChange({ quantite: e.target.value || undefined })}
          />
          <ChampTexte
            label="Précisions"
            aide="Une par ligne : taille, couleur, modèle…"
            rows={3}
            value={(cadeau.precisions ?? []).join('\n')}
            onChange={(e) =>
              onChange({ precisions: e.target.value ? e.target.value.split('\n') : undefined })
            }
          />
          <ChampTexte
            label="Petit mot"
            rows={2}
            maxLength={600}
            value={cadeau.mot ?? ''}
            onChange={(e) => onChange({ mot: e.target.value || undefined })}
          />

          <fieldset className="nb-subform">
            <legend className="nb-field__label">Modèles au choix</legend>
            {options.length === 0 && (
              <p className="nb-field__help">
                Pour proposer plusieurs modèles (affiches, couleurs…), ajoute-les ici.
              </p>
            )}
            {options.map((option, i) => (
              <div key={i} className="nb-option-edit">
                <p className="nb-option-edit__title">Modèle {i + 1}</p>
                <Champ
                  label="Nom"
                  value={option.nom}
                  maxLength={200}
                  onChange={(e) => changerOption(i, { nom: e.target.value })}
                />
                <Champ
                  label="Auteur ou détail"
                  value={option.auteur ?? ''}
                  maxLength={200}
                  onChange={(e) => changerOption(i, { auteur: e.target.value || undefined })}
                />
                <Champ
                  label="Lien"
                  type="url"
                  inputMode="url"
                  placeholder="https://…"
                  value={option.lien}
                  onChange={(e) => changerOption(i, { lien: e.target.value })}
                />
                <Champ
                  label="Image (lien)"
                  type="url"
                  inputMode="url"
                  placeholder="https://…/photo.jpg"
                  value={option.image ?? ''}
                  onChange={(e) => changerOption(i, { image: e.target.value || undefined })}
                />
                <button
                  type="button"
                  className="nb-btn nb-btn--light nb-btn--small"
                  onClick={() => retirerOption(i)}
                >
                  Retirer ce modèle
                </button>
              </div>
            ))}
            <button
              type="button"
              className="nb-btn nb-btn--light nb-btn--small"
              onClick={() => onChange({ options: [...options, { nom: '', lien: '' }] })}
            >
              + Ajouter un modèle au choix
            </button>
          </fieldset>

          <div className="nb-form__actions">
            <button
              type="button"
              className="nb-btn nb-btn--light nb-btn--small"
              disabled={index === 0}
              onClick={() => onDeplacer(-1)}
            >
              <span aria-hidden="true">↑</span> Monter
            </button>
            <button
              type="button"
              className="nb-btn nb-btn--light nb-btn--small"
              disabled={index === total - 1}
              onClick={() => onDeplacer(1)}
            >
              <span aria-hidden="true">↓</span> Descendre
            </button>
            {confirmer ? (
              <>
                <button
                  type="button"
                  className="nb-btn nb-btn--danger nb-btn--small"
                  onClick={onSupprimer}
                >
                  Oui, supprimer
                </button>
                <button
                  type="button"
                  className="nb-btn nb-btn--light nb-btn--small"
                  onClick={() => setConfirmer(false)}
                >
                  Garder
                </button>
              </>
            ) : (
              <button
                type="button"
                className="nb-btn nb-btn--light nb-btn--small"
                onClick={() => setConfirmer(true)}
              >
                Supprimer ce cadeau
              </button>
            )}
          </div>
        </div>
      </details>
    </article>
  )
}

type ChampProps = InputHTMLAttributes<HTMLInputElement> & { label: string; aide?: string }

export function Champ({ label, aide, className, ...props }: ChampProps) {
  return (
    <label className={`nb-field${className ? ` ${className}` : ''}`}>
      <span className="nb-field__label">{label}</span>
      <input className="nb-input" {...props} />
      {aide && <span className="nb-field__help">{aide}</span>}
    </label>
  )
}

type ChampTexteProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  aide?: string
}

export function ChampTexte({ label, aide, ...props }: ChampTexteProps) {
  return (
    <label className="nb-field">
      <span className="nb-field__label">{label}</span>
      <textarea className="nb-input" {...props} />
      {aide && <span className="nb-field__help">{aide}</span>}
    </label>
  )
}
