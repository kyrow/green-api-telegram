import { useEffect, useRef } from 'react'
import { ServiceBadge } from '@/components/atoms'
import { MessageBubble } from '@/components/molecules'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Message } from '@/lib/types'

export interface MessageListProps {
  messages: Message[]
}

export function MessageList({ messages }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null)
  const last = messages.at(-1)

  // Прокручиваем к последнему сообщению при появлении нового или смене его статуса.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, last?.id, last?.status])

  if (messages.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-4">
        <ServiceBadge>Нет сообщений</ServiceBadge>
      </div>
    )
  }

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div role="log" aria-live="polite" className="mx-auto flex w-full max-w-[728px] flex-col px-3 pt-3 md:px-4">
        {messages.map((message, index) => {
          const prev = messages[index - 1]
          const next = messages[index + 1]
          return (
            <MessageBubble
              key={message.id}
              text={message.text}
              timestamp={message.timestamp}
              direction={message.direction}
              status={message.status}
              error={message.error}
              groupedAbove={prev?.direction === message.direction}
              tail={next?.direction !== message.direction}
            />
          )
        })}
        <div ref={endRef} />
      </div>
    </ScrollArea>
  )
}
