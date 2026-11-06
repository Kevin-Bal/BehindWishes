import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, Outlet, useLocation, useParams } from 'react-router'
import { StateMessage } from '../../components/ui/StateMessage'
import { useAuth } from '../../lib/auth'
import { formatCode, isValidCode, normalizeCode } from '../../lib/code'
import { GroupContext, type GroupContextValue } from '../../lib/groupContext'
import { useGroupDoc, useMembers } from '../../lib/groups'
import { getIdentity, rememberGroup, setIdentity } from '../../lib/identity'
import { bindDevice } from '../../lib/session'

/**
 * Racine des routes `/g/:code/*` : vérifie le code, écoute le groupe et ses membres
 * en temps réel, et impose le choix d'une identité (A2) avant tout autre écran.
 */
export function GroupLayout() {
  const { code: rawCode = '' } = useParams()
  const location = useLocation()
  const auth = useAuth()
  const code = normalizeCode(rawCode)
  const displayCode = formatCode(code)

  if (!isValidCode(code)) return <UnknownGroup />

  // Lien saisi à la main (minuscules, sans tiret…) : on normalise l'adresse.
  if (rawCode !== displayCode) {
    const rest = location.pathname.slice(`/g/${rawCode}`.length)
    return <Navigate to={`/g/${displayCode}${rest}`} replace />
  }

  if (auth.status === 'loading') return <StateMessage title="Connexion…" busy />
  if (auth.status === 'error') {
    return (
      <StateMessage title="Connexion impossible">
        <p className="text-ink-muted">Vérifie ta connexion internet puis recharge la page.</p>
      </StateMessage>
    )
  }

  return <GroupData key={code} code={code} basePath={`/g/${displayCode}`} />
}

function GroupData({ code, basePath }: { code: string; basePath: string }) {
  const location = useLocation()
  const group = useGroupDoc(code)
  const members = useMembers(code)
  const [identityId, setIdentityId] = useState(() => getIdentity(code))

  const chooseIdentity = useCallback(
    (memberId: string) => {
      setIdentity(code, memberId)
      setIdentityId(memberId)
    },
    [code],
  )

  const value = useMemo<GroupContextValue | null>(() => {
    if (group.status !== 'ready' || !group.data || members.status !== 'ready') return null
    const me = members.data.find((m) => m.id === identityId && !m.archived)
    return { code, group: group.data, members: members.data, me, chooseIdentity, basePath }
  }, [group, members, identityId, code, chooseIdentity, basePath])

  // Niveau 2 : l'appareil est lié au membre choisi avant d'afficher ses écrans.
  const meId = value?.me?.id
  const [boundTo, setBoundTo] = useState<string | null>(null)
  const [bindFailed, setBindFailed] = useState(false)
  useEffect(() => {
    if (!meId) return
    let cancelled = false
    bindDevice(code, meId)
      .then(() => {
        if (!cancelled) setBoundTo(meId)
      })
      .catch(() => {
        if (!cancelled) setBindFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [code, meId])

  // Groupe trouvé : l'accueil proposera d'y revenir directement.
  const found = group.status === 'ready' && group.data !== null
  useEffect(() => {
    if (found) rememberGroup(code)
  }, [found, code])

  if (group.status === 'error' || members.status === 'error') {
    return (
      <StateMessage title="Impossible de charger le groupe">
        <p className="text-ink-muted">Tu es peut-être hors ligne. Réessaie dans un instant.</p>
      </StateMessage>
    )
  }
  if (group.status === 'ready' && group.data === null) return <UnknownGroup />
  if (!value) return <StateMessage title="Chargement du groupe…" busy />

  const onWhoPage = location.pathname === `${basePath}/qui`
  if (!value.me && !onWhoPage) return <Navigate to={`${basePath}/qui`} replace />
  if (value.me && boundTo !== value.me.id && !onWhoPage) {
    if (bindFailed) {
      return (
        <StateMessage title="Impossible d’ouvrir ton profil">
          <p className="text-ink-muted">Vérifie ta connexion internet puis recharge la page.</p>
        </StateMessage>
      )
    }
    return <StateMessage title="Ouverture de ton profil…" busy />
  }

  return (
    <GroupContext value={value}>
      <Outlet />
    </GroupContext>
  )
}

function UnknownGroup() {
  return (
    <StateMessage title="Groupe introuvable">
      <p className="text-ink-muted">
        Aucun groupe ne correspond à ce code. Vérifie-le auprès de la personne qui te l’a envoyé.
      </p>
      <Link to="/" className="font-semibold text-accent underline underline-offset-4">
        Saisir un autre code
      </Link>
    </StateMessage>
  )
}
