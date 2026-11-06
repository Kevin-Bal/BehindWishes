import { useId, type InputHTMLAttributes, type Ref } from 'react'
import { cn } from '../../lib/cn'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
  ref?: Ref<HTMLInputElement>
}

export function TextField({ label, hint, error, className, id, ref, ...props }: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="font-semibold">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'min-h-12 rounded-2xl border bg-surface px-4 text-base text-ink placeholder:text-ink-muted/60',
          error ? 'border-danger' : 'border-line',
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-sm font-semibold text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${inputId}-hint`} className="text-sm text-ink-muted">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
