import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { Link, useBlocker } from 'react-router'
import { Champ, ChampTexte, NoelCadeauEditeur } from '../components/NoelCadeauEditeur'
import { Decor } from '../components/noel'
import type { Cadeau, ListeNoel } from '../data/noel'
import { useAuth } from '../lib/auth'
import { missingFirebaseEnv } from '../lib/firebase'
import { enregistrerListe, LIMITES, urlSure, useListeNoel } from '../lib/vitrineNoel'
import '../styles/noel.css'

/**
 * Coulisses de la vitrine (`/#/noel/edition`) : je modifie tout (textes, cadeaux, prix,
 * envies, modèles au choix) dans un brouillon, puis j'enregistre d'un coup dans
 * `vitrines/noel`. Seuls les appareils autorisés dans firestore.rules peuvent écrire ;
 * les autres voient leur identifiant à faire ajouter.
 */

type Sauvegarde = 'repos' | 'encours' | 'ok' | 'invalide' | 'refus' | 'erreur'

const MESSAGES: Record<Sauvegarde, string> = {
  repos: '',
  encours: 'Enregistrement…',
  ok: 'Enregistré ✓ C’est déjà visible sur ta page.',
  invalide: 'Il reste des choses à corriger (en rouge).',
  refus: 'Cet appareil n’a pas le droit de modifier la liste.',
  erreur: 'Oups, l’enregistrement a échoué. Réessaie dans un instant.',
}

function lienInvalide(valeur: string | undefined): boolean {
  return !!valeur?.trim() && !urlSure(valeur)
}

/** Problèmes bloquants, par cadeau (clé = id). */
function valider(liste: ListeNoel): Record<string, string> {
  const erreurs: Record<string, string> = {}
  for (const c of liste.cadeaux) {
    const problemes: string[] = []
    if (!c.nom.trim()) problemes.push('il manque le nom')
    if (lienInvalide(c.lien)) problemes.push('le lien doit commencer par https://')
    if (lienInvalide(c.image)) problemes.push('le lien de l’image doit commencer par https://')
    c.options?.forEach((o, i) => {
      if (!o.nom.trim() || !urlSure(o.lien)) {
        problemes.push(`le modèle ${i + 1} a besoin d’un nom et d’un lien https://`)
      }
    })
    if (problemes.length > 0) {
      const texte = problemes.join(', ')
      erreurs[c.id] = texte.charAt(0).toUpperCase() + texte.slice(1) + '.'
    }
  }
  return erreurs
}

function nouvelId(): string {
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export function NoelEditionPage() {
  const auth = useAuth()
  const etat = useListeNoel()
  const [brouillon, setBrouillon] = useState<ListeNoel | null>(null)
  // Incrémenté à l'annulation : remet à zéro les champs qui ont un état local (prix).
  const [generation, setGeneration] = useState(0)
  const [nouveau, setNouveau] = useState<string | null>(null)
  const [sauvegarde, setSauvegarde] = useState<Sauvegarde>('repos')
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [confirmerAnnulation, setConfirmerAnnulation] = useState(false)

  const enLigne = etat.statut === 'pret' ? etat.liste : null
  const liste = brouillon ?? enLigne
  const modifie = brouillon !== null
  const uid = auth.status === 'ready' ? auth.user.uid : null
  const indisponible = missingFirebaseEnv.length > 0 || auth.status === 'error'
  const blocage = useBlocker(modifie)

  useEffect(() => {
    const avant = document.title
    document.title = 'Ma liste de Noël · édition'
    return () => {
      document.title = avant
    }
  }, [])

  // Fermeture de l'onglet avec des modifications non enregistrées.
  useEffect(() => {
    if (!modifie) return
    const retenir = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', retenir)
    return () => window.removeEventListener('beforeunload', retenir)
  }, [modifie])

  function modifier(transformer: (l: ListeNoel) => ListeNoel) {
    setBrouillon((actuel) => {
      const base = actuel ?? enLigne
      return base ? transformer(base) : actuel
    })
    setSauvegarde((s) => (s === 'refus' ? s : 'repos'))
    setConfirmerAnnulation(false)
  }

  function modifierCadeau(id: string, patch: Partial<Cadeau>) {
    modifier((l) => ({
      ...l,
      cadeaux: l.cadeaux.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }))
    if (erreurs[id]) {
      setErreurs((actuelles) => {
        const reste = { ...actuelles }
        delete reste[id]
        return reste
      })
    }
  }

  function deplacer(id: string, sens: -1 | 1) {
    modifier((l) => {
      const i = l.cadeaux.findIndex((c) => c.id === id)
      const j = i + sens
      if (i < 0 || j < 0 || j >= l.cadeaux.length) return l
      const cadeaux = [...l.cadeaux]
      ;[cadeaux[i], cadeaux[j]] = [cadeaux[j]!, cadeaux[i]!]
      return { ...l, cadeaux }
    })
  }

  function ajouter() {
    const id = nouvelId()
    flushSync(() => {
      modifier((l) => ({ ...l, cadeaux: [...l.cadeaux, { id, nom: '', envie: 'plaisir' }] }))
      setNouveau(id)
    })
    const carte = document.getElementById(`cadeau-${id}`)
    carte?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    carte?.querySelector<HTMLInputElement>('[data-champ="nom"]')?.focus({ preventScroll: true })
  }

  function annuler() {
    setBrouillon(null)
    setErreurs({})
    setGeneration((g) => g + 1)
    setSauvegarde('repos')
    setConfirmerAnnulation(false)
  }

  async function enregistrer() {
    if (!brouillon) return
    const trouvees = valider(brouillon)
    const prenomManquant = !brouillon.prenom.trim()
    setErreurs(trouvees)
    if (prenomManquant || Object.keys(trouvees).length > 0) {
      setSauvegarde('invalide')
      const premier = Object.keys(trouvees)[0]
      document
        .getElementById(premier ? `cadeau-${premier}` : 'nb-page-prenom')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setSauvegarde('encours')
    try {
      await enregistrerListe(brouillon)
      setBrouillon(null)
      setSauvegarde('ok')
    } catch (error) {
      // Le brouillon est gardé : rien n'est perdu.
      console.error('Liste non enregistrée', error)
      const code = (error as { code?: string }).code
      setSauvegarde(code === 'permission-denied' ? 'refus' : 'erreur')
    }
  }

  const message = indisponible
    ? 'Connexion à la base impossible : rien ne pourra être enregistré.'
    : MESSAGES[sauvegarde]

  return (
    <div className="nb-page">
      <div className="nb-stripes" aria-hidden="true" />

      <header className="nb-hero nb-hero--compact">
        <Decor />
        <p className="nb-eyebrow">Les coulisses</p>
        <h1 className="nb-title nb-title--small">Ma liste</h1>
        <p className="nb-intro">
          Modifie ce que tu veux, puis enregistre : ta page se met à jour et se trie toute seule par
          envie.
        </p>
        <Link className="nb-btn nb-btn--light nb-hero__back" to="/noel">
          Voir ma page
        </Link>
      </header>

      <main className={`nb-main${modifie ? ' nb-main--savebar' : ''}`}>
        {blocage.state === 'blocked' && (
          <section className="nb-alert" role="alertdialog" aria-labelledby="nb-quitter">
            <h2 id="nb-quitter" className="nb-alert__title">
              Quitter sans enregistrer ?
            </h2>
            <p>Tes modifications seront perdues.</p>
            <div className="nb-form__actions">
              <button type="button" className="nb-btn nb-btn--light" onClick={blocage.reset}>
                Rester
              </button>
              <button type="button" className="nb-btn nb-btn--danger" onClick={blocage.proceed}>
                Quitter
              </button>
            </div>
          </section>
        )}

        {sauvegarde === 'refus' && uid && <Autorisation uid={uid} />}

        {!liste ? (
          <p className="nb-loading">Je déballe la liste…</p>
        ) : (
          <fieldset className="nb-editor" disabled={indisponible}>
            <legend className="nb-sr">Modifier ma liste</legend>
            {etat.statut === 'pret' && !etat.enLigne && (
              <p className="nb-note">
                Ta liste n’est pas encore en ligne : le premier enregistrement la publiera.
              </p>
            )}

            <section className="nb-edit nb-edit--page" aria-labelledby="nb-page-titre">
              <h2 id="nb-page-titre" className="nb-edit__name">
                Ta page
              </h2>
              <div className="nb-form">
                <Champ
                  id="nb-page-prenom"
                  label="Prénom"
                  required
                  maxLength={LIMITES.prenom}
                  value={liste.prenom}
                  aide={!liste.prenom.trim() ? 'Il faut un prénom.' : undefined}
                  onChange={(e) => modifier((l) => ({ ...l, prenom: e.target.value }))}
                />
                <ChampTexte
                  label="Message d’intro"
                  rows={3}
                  maxLength={LIMITES.texte}
                  value={liste.intro}
                  onChange={(e) => modifier((l) => ({ ...l, intro: e.target.value }))}
                />
                <ChampTexte
                  label="Message de fin"
                  rows={2}
                  maxLength={LIMITES.texte}
                  value={liste.outro ?? ''}
                  onChange={(e) => modifier((l) => ({ ...l, outro: e.target.value || undefined }))}
                />
              </div>
            </section>

            <h2 className="nb-count">
              {liste.cadeaux.length} {liste.cadeaux.length > 1 ? 'cadeaux' : 'cadeau'}
            </h2>
            <p className="nb-field__help nb-edit-help">
              Sur ta page, les cadeaux sont triés par envie, puis dans l’ordre ci-dessous.
            </p>

            <ul className="nb-edit-list">
              {liste.cadeaux.map((cadeau, i) => (
                <li key={`${cadeau.id}-${generation}`}>
                  <NoelCadeauEditeur
                    cadeau={cadeau}
                    index={i}
                    total={liste.cadeaux.length}
                    ouvertAuDepart={cadeau.id === nouveau}
                    erreur={erreurs[cadeau.id]}
                    onChange={(patch) => modifierCadeau(cadeau.id, patch)}
                    onSupprimer={() =>
                      modifier((l) => ({
                        ...l,
                        cadeaux: l.cadeaux.filter((c) => c.id !== cadeau.id),
                      }))
                    }
                    onDeplacer={(sens) => deplacer(cadeau.id, sens)}
                  />
                </li>
              ))}
            </ul>

            <button
              type="button"
              className="nb-btn nb-add"
              disabled={liste.cadeaux.length >= LIMITES.cadeaux}
              onClick={ajouter}
            >
              + Ajouter un cadeau
            </button>
          </fieldset>
        )}

        {uid && sauvegarde !== 'refus' && (
          <details className="nb-device">
            <summary>Identifiant de cet appareil</summary>
            <Identifiant uid={uid} />
          </details>
        )}
      </main>

      {(modifie || sauvegarde !== 'repos' || indisponible) && (
        <div className="nb-savebar">
          <p className="nb-savebar__status" role="status">
            {message || (modifie ? 'Modifications pas encore enregistrées.' : '')}
          </p>
          {modifie && (
            <div className="nb-savebar__actions">
              {confirmerAnnulation ? (
                <>
                  <button type="button" className="nb-btn nb-btn--danger" onClick={annuler}>
                    Oui, tout annuler
                  </button>
                  <button
                    type="button"
                    className="nb-btn nb-btn--light"
                    onClick={() => setConfirmerAnnulation(false)}
                  >
                    Garder
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="nb-btn nb-btn--light"
                    onClick={() => setConfirmerAnnulation(true)}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="nb-btn"
                    disabled={indisponible || sauvegarde === 'encours'}
                    onClick={() => void enregistrer()}
                  >
                    Enregistrer
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      <div className="nb-stripes" aria-hidden="true" />
    </div>
  )
}

function Autorisation({ uid }: { uid: string }) {
  return (
    <section className="nb-alert" aria-labelledby="nb-alert-title">
      <h2 id="nb-alert-title" className="nb-alert__title">
        Appareil pas encore autorisé
      </h2>
      <p>
        Tes modifications sont gardées sur cette page. Pour pouvoir enregistrer depuis cet appareil,
        ajoute son identifiant dans <code>firestore.rules</code> (fonction{' '}
        <code>proprietairesVitrine</code>), puis publie les règles avec{' '}
        <code>npm run deploy:rules</code>.
      </p>
      <Identifiant uid={uid} />
    </section>
  )
}

function Identifiant({ uid }: { uid: string }) {
  const [copie, setCopie] = useState(false)

  async function copier() {
    try {
      await navigator.clipboard.writeText(uid)
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
    } catch {
      setCopie(false)
    }
  }

  return (
    <div className="nb-uid">
      <code className="nb-uid__value">{uid}</code>
      <button type="button" className="nb-btn nb-btn--light" onClick={() => void copier()}>
        {copie ? 'Copié !' : 'Copier'}
      </button>
    </div>
  )
}
