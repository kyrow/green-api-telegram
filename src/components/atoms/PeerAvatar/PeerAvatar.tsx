import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn, getInitials } from '@/lib/utils'

const COLORS = ['red', 'orange', 'violet', 'green', 'cyan', 'blue', 'pink'] as const

function colorFor(seed: string): (typeof COLORS)[number] {
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return COLORS[Math.abs(hash) % COLORS.length]
}

export interface PeerAvatarProps {
  title: string
  /** Определяет цвет аватара, обычно chatId. */
  seed: string
  size?: 'md' | 'lg'
  className?: string
}

export function PeerAvatar({ title, seed, size = 'lg', className }: PeerAvatarProps) {
  return (
    <Avatar className={cn('after:hidden', size === 'lg' ? 'size-[54px]' : 'size-10', className)}>
      <AvatarFallback
        className={cn('font-medium text-white', size === 'lg' ? 'text-xl' : 'text-base')}
        style={{ backgroundImage: `linear-gradient(var(--tg-avatar-${colorFor(seed)}))` }}
      >
        {getInitials(title)}
      </AvatarFallback>
    </Avatar>
  )
}
