import { useEffect, useId, useRef, type ReactNode } from 'react'
import { CloseIcon } from '../icons'

interface GlassSheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

/**
 * Feuille modale (bottom sheet) en verre épais. S'appuie sur <dialog> natif :
 * piège du focus, touche Échap et couche supérieure gérés par le navigateur.
 */
export function GlassSheet({ open, onClose, title, children }: GlassSheetProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        // Un tap sur le voile (hors de la feuille) ferme.
        if (event.target === ref.current) onClose()
      }}
      className="sheet glass glass--thick mx-auto mt-auto mb-0 max-h-[90dvh] w-full max-w-xl rounded-t-[28px] rounded-b-none p-0 text-ink"
    >
      <div className="flex flex-col gap-4 px-5 pt-3 pb-[max(env(safe-area-inset-bottom),1.25rem)]">
        <div aria-hidden="true" className="mx-auto h-1.5 w-10 rounded-full bg-ink-muted/40" />
        <div className="flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-xl font-semibold">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            className="flex size-11 items-center justify-center rounded-full bg-surface-muted"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}
