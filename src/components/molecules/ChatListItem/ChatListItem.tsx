import { MessageTime, PeerAvatar } from '@/components/atoms'
import { cn } from '@/lib/utils'

export interface ChatListItemProps {
  chatId: string
  title: string
  preview?: string
  timestamp?: number
  active?: boolean
  onSelect: (chatId: string) => void
}

export function ChatListItem({ chatId, title, preview, timestamp, active = false, onSelect }: ChatListItemProps) {
  return (
    <button
      type="button"
      aria-current={active ? 'true' : undefined}
      onClick={() => onSelect(chatId)}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
      )}
    >
      <PeerAvatar title={title} seed={chatId} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate font-medium">{title}</span>
          {timestamp !== undefined && (
            <MessageTime
              timestamp={timestamp}
              className={active ? 'text-primary-foreground' : 'text-muted-foreground'}
            />
          )}
        </span>
        <span className={cn('truncate text-[15px]', active ? 'text-primary-foreground' : 'text-muted-foreground')}>
          {preview || 'Нет сообщений'}
        </span>
      </span>
    </button>
  )
}
