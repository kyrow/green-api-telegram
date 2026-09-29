import { LogOutIcon, PencilIcon } from 'lucide-react'
import { IconButton } from '@/components/atoms'
import { ChatListItem } from '@/components/molecules'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface ChatListEntry {
  chatId: string
  title: string
  preview?: string
  timestamp?: number
}

export interface ChatListProps {
  chats: ChatListEntry[]
  activeChatId: string | null
  /** Подпись под заголовком, например номер инстанса. */
  caption?: string
  onSelect: (chatId: string) => void
  onNewChat: () => void
  onLogout: () => void
}

export function ChatList({ chats, activeChatId, caption, onSelect, onNewChat, onLogout }: ChatListProps) {
  return (
    <div className="relative flex h-full min-h-0 flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-2 px-4">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-medium">Чаты</h1>
          {caption && <p className="truncate text-xs text-muted-foreground">{caption}</p>}
        </div>
        <IconButton label="Выйти" icon={<LogOutIcon />} onClick={onLogout} />
      </header>

      <ScrollArea className="min-h-0 flex-1">
        {chats.length === 0 ? (
          <p className="px-6 py-10 text-center text-[15px] text-muted-foreground">
            Чатов пока нет. Нажмите «Новый чат», чтобы написать по номеру телефона.
          </p>
        ) : (
          <nav aria-label="Список чатов" className="flex flex-col gap-0.5 px-2 pb-24">
            {chats.map((chat) => (
              <ChatListItem key={chat.chatId} {...chat} active={chat.chatId === activeChatId} onSelect={onSelect} />
            ))}
          </nav>
        )}
      </ScrollArea>

      <IconButton
        label="Новый чат"
        icon={<PencilIcon />}
        variant="primary"
        onClick={onNewChat}
        className="absolute right-5 bottom-5"
      />
    </div>
  )
}
