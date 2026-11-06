import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'md' | 'lg'
}

/** Bouton opaque de la couche contenu (formulaires, cartes). Le verre est réservé à la navigation. */
export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full px-5 font-semibold',
        'transition-transform duration-200 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100',
        size === 'md' && 'min-h-11 text-base',
        size === 'lg' && 'min-h-14 text-lg',
        variant === 'primary' && 'bg-accent text-on-accent',
        variant === 'secondary' && 'bg-surface-muted text-ink',
        variant === 'danger' && 'bg-danger/10 text-danger',
        variant === 'ghost' && 'text-accent underline-offset-4 hover:underline',
        className,
      )}
      {...props}
    />
  )
}
