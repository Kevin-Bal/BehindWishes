import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

/** Surface de contenu opaque (souhait, évènement, formulaire). Jamais de verre. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[20px] border border-line bg-surface p-4 text-ink shadow-[0_1px_3px_rgba(0,0,0,0.06)]',
        className,
      )}
      {...props}
    />
  )
}
