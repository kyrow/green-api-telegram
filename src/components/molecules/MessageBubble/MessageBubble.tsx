import { MessageStatusIcon, MessageTime } from '@/components/atoms'
import type { MessageDirection, MessageStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface MessageBubbleProps {
  text: string
  timestamp: number
  direction: MessageDirection
  status: MessageStatus
  error?: string
  /** Сообщение того же направления стоит выше — скругление угла у «хвоста» уменьшается. */
  groupedAbove?: boolean
  /** Последнее сообщение в группе — рисуем «хвостик». */
  tail?: boolean
}

/** Форма «хвостика» из Telegram Web K (для исходящих, входящие отражаются). */
function BubbleTail({ outgoing }: { outgoing: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 11 17"
      width="11"
      height="17"
      className={cn(
        'absolute bottom-0',
        outgoing ? '-right-[11px] text-message-out' : '-left-[11px] -scale-x-100 text-message-in',
      )}
    >
      <path
        fill="currentColor"
        d="M6 17H0V0c.193 2.84.876 5.767 2.05 8.782.904 2.325 2.446 4.485 4.625 6.48A1 1 0 016 17z"
      />
    </svg>
  )
}

export function MessageBubble({
  text,
  timestamp,
  direction,
  status,
  error,
  groupedAbove = false,
  tail = true,
}: MessageBubbleProps) {
  const outgoing = direction === 'outgoing'
  const failed = status === 'failed'

  return (
    <div className={cn('flex flex-col', outgoing ? 'items-end' : 'items-start', tail ? 'mb-2' : 'mb-1')}>
      <div
        className={cn(
          'relative max-w-[min(480px,85%)] rounded-bubble px-2 pt-1.5 pb-1.5 text-message shadow-bubble',
          outgoing ? 'bg-message-out' : 'bg-message-in',
          outgoing
            ? [groupedAbove && 'rounded-tr-bubble-tail', tail ? 'rounded-br-none' : 'rounded-br-bubble-tail']
            : [groupedAbove && 'rounded-tl-bubble-tail', tail ? 'rounded-bl-none' : 'rounded-bl-bubble-tail'],
        )}
      >
        <span className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{text}</span>
        <span
          className={cn(
            'relative top-[5px] float-right ml-2 flex h-5 items-center gap-0.5 select-none',
            outgoing ? 'text-message-out-meta' : 'text-message-in-meta',
          )}
        >
          <MessageTime timestamp={timestamp} />
          {outgoing && <MessageStatusIcon status={status} />}
        </span>
        {tail && <BubbleTail outgoing={outgoing} />}
      </div>
      {failed && (
        <p role="alert" className="mt-1 max-w-[85%] rounded-full bg-background/90 px-2 py-0.5 text-meta text-destructive">
          Не отправлено{error ? `: ${error}` : ''}
        </p>
      )}
    </div>
  )
}
