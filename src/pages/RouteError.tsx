import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { Button } from '../components/ui/Button'
import { StateMessage } from '../components/ui/StateMessage'

/** Filet de sécurité : une erreur imprévue affiche un message clair plutôt qu'un écran blanc. */
export function RouteError() {
  const error = useRouteError()
  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <StateMessage title="Page introuvable">
        <Link to="/" className="font-semibold text-accent underline underline-offset-4">
          Revenir à l’accueil
        </Link>
      </StateMessage>
    )
  }
  console.error(error)
  return (
    <StateMessage title="Oups, quelque chose s’est mal passé">
      <p className="text-ink-muted">Recharge la page ; si ça recommence, réessaie plus tard.</p>
      <Button variant="primary" onClick={() => window.location.reload()}>
        Recharger
      </Button>
    </StateMessage>
  )
}
