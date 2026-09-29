import { useId, type ComponentProps } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export interface TextFieldProps extends ComponentProps<typeof Input> {
  label: string
  hint?: string
  error?: string
}

export function TextField({ label, hint, error, id, className, ...props }: TextFieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const describedBy = error || hint ? `${inputId}-note` : undefined
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={inputId} className="text-muted-foreground">
        {label}
      </Label>
      <Input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn('h-12 rounded-xl px-4 text-base md:text-base', className)}
        {...props}
      />
      {(error || hint) && (
        <p id={describedBy} className={cn('text-sm', error ? 'text-destructive' : 'text-muted-foreground')}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}
