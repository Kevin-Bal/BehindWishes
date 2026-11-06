import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** `tint` est réservé à l'action principale (« + », « Réserver »). */
  variant?: 'default' | 'tint'
  /** `fab` : bouton flottant rond (ex. « + » ajouter un souhait). */
  shape?: 'capsule' | 'fab' | 'icon'
}

export function GlassButton({
  variant = 'default',
  shape = 'capsule',
  className,
  type = 'button',
  ...props
}: GlassButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'glass inline-flex min-h-11 min-w-11 items-center justify-center gap-2 font-semibold',
        'transition-transform duration-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100',
        variant === 'tint' && 'glass--tint',
        shape === 'capsule' && 'rounded-full px-5 text-base',
        shape === 'fab' && 'size-14 rounded-full',
        shape === 'icon' && 'size-11 rounded-full',
        className,
      )}
      {...props}
    />
  )
}
