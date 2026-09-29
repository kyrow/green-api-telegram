import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface MessengerLayoutProps {
  sidebar: ReactNode
  /** Шапка открытого чата. Если её нет, вместо чата показывается `placeholder`. */
  chatHeader?: ReactNode
  chatBody?: ReactNode
  chatFooter?: ReactNode
  placeholder?: ReactNode
  /** На узком экране видна одна колонка: список или открытый чат. */
  chatOpen: boolean
}

/** Две колонки как в Telegram Web K: список чатов слева, чат на фоне обоев справа. */
export function MessengerLayout({ sidebar, chatHeader, chatBody, chatFooter, placeholder, chatOpen }: MessengerLayoutProps) {
  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <aside
        className={cn(
          'h-full w-full shrink-0 border-r md:flex md:w-[360px] lg:w-[420px]',
          chatOpen ? 'hidden' : 'flex',
        )}
      >
        <div className="h-full w-full">{sidebar}</div>
      </aside>
      <main className={cn('h-full min-w-0 flex-1 flex-col bg-chat-wallpaper md:flex', chatOpen ? 'flex' : 'hidden')}>
        {chatHeader ? (
          <>
            {chatHeader}
            {chatBody}
            {chatFooter && (
              <div className="mx-auto w-full max-w-[728px] shrink-0 px-3 pt-1 pb-3 md:px-4 md:pb-5">{chatFooter}</div>
            )}
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-4">{placeholder}</div>
        )}
      </main>
    </div>
  )
}
