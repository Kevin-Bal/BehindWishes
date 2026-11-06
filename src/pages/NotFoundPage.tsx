import { Link } from 'react-router'
import { Card } from '../components/ui/Card'

export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
      <Card className="flex flex-col items-center gap-3 p-6 text-center">
        <h1 className="text-xl font-semibold">Page introuvable</h1>
        <p className="text-ink-muted">Ce lien ne mène nulle part.</p>
        <Link to="/" className="font-semibold text-accent underline underline-offset-4">
          Revenir à l'accueil
        </Link>
      </Card>
    </main>
  )
}
