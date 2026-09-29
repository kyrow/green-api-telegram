import { cn, formatTime } from '@/lib/utils'

export interface MessageTimeProps {
  timestamp: number
  className?: string
}

export function MessageTime({ timestamp, className }: MessageTimeProps) {
  return (
    <time dateTime={new Date(timestamp).toISOString()} className={cn('text-meta whitespace-nowrap', className)}>
      {formatTime(timestamp)}
    </time>
  )
}
