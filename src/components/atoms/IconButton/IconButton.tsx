import type { ComponentProps, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface IconButtonProps extends Omit<ComponentProps<typeof Button>, 'variant' | 'size' | 'children'> {
  /** Текст для скринридеров и подсказки. */
  label: string
  icon: ReactNode
  variant?: 'ghost' | 'primary'
}

export function IconButton({ label, icon, variant = 'ghost', className, ...props }: IconButtonProps) {
  return (
    <Button
      type="button"
      aria-label={label}
      title={label}
      variant={variant === 'primary' ? 'default' : 'ghost'}
      className={cn(
        'shrink-0 rounded-full',
        variant === 'ghost'
          ? 'size-10 text-muted-foreground hover:bg-accent [&_svg:not([class*=size-])]:size-6'
          : 'size-14 shadow-md hover:bg-primary/90 [&_svg:not([class*=size-])]:size-6',
        className,
      )}
      {...props}
    >
      {icon}
    </Button>
  )
}
