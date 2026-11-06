import type { ReactNode } from 'react'
import { Card } from './Card'

/** Écran plein de chargement, d'erreur ou d'information (hors gabarit `Screen`). */
export function StateMessage({
  title,
  children,
  busy = false,
}: {
  title: string
  children?: ReactNode
  busy?: boolean
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
      <Card className="flex flex-col items-center gap-3 p-6 text-center" aria-busy={busy}>
        {busy && (
          <span
            aria-hidden="true"
            className="size-8 animate-spin rounded-full border-4 border-line border-t-accent"
          />
        )}
        <h1 className="text-xl font-semibold" role={busy ? 'status' : undefined}>
          {title}
        </h1>
        {children}
      </Card>
    </main>
  )
}
