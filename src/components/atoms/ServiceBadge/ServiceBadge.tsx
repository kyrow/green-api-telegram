import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Полупрозрачная плашка поверх обоев чата, как у сервисных сообщений Telegram. */
export function ServiceBadge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-block rounded-full bg-service px-3 py-1 text-center text-[15px] font-medium text-service-foreground',
        className,
      )}
    >
      {children}
    </span>
  )
}
