import { useOnline } from '../lib/useOnline'

/** Bandeau opaque « Tu es hors ligne », sous la barre du haut (F). */
export function OfflineBanner() {
  const online = useOnline()
  if (online) return null
  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 top-[calc(max(env(safe-area-inset-top),0.75rem)+4rem)] z-40 flex justify-center px-4"
    >
      <p className="rounded-full bg-ink px-4 py-2 text-center text-sm font-semibold text-bg shadow-lg">
        Tu es hors ligne. Tes changements partiront au retour du réseau.
      </p>
    </div>
  )
}
