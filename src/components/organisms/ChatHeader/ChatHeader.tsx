import { ArrowLeftIcon } from 'lucide-react'
import { IconButton, PeerAvatar } from '@/components/atoms'

export interface ChatHeaderProps {
  chatId: string
  title: string
  subtitle?: string
  /** Кнопка «назад» к списку чатов (только на узких экранах). */
  onBack?: () => void
}

export function ChatHeader({ chatId, title, subtitle, onBack }: ChatHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-2 md:px-4">
      {onBack && (
        <IconButton label="Назад к чатам" icon={<ArrowLeftIcon />} onClick={onBack} className="md:hidden" />
      )}
      <PeerAvatar title={title} seed={chatId} size="md" />
      <div className="min-w-0">
        <h2 className="truncate leading-tight font-medium">{title}</h2>
        {subtitle && <p className="truncate text-sm leading-tight text-muted-foreground">{subtitle}</p>}
      </div>
    </header>
  )
}
