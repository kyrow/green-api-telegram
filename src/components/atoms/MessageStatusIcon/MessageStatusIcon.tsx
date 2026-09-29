import { CheckIcon, CircleAlertIcon, ClockIcon } from 'lucide-react'
import type { MessageStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface MessageStatusIconProps {
  status: MessageStatus
  className?: string
}

export function MessageStatusIcon({ status, className }: MessageStatusIconProps) {
  const Icon = status === 'sending' ? ClockIcon : status === 'failed' ? CircleAlertIcon : CheckIcon
  const label = status === 'sending' ? 'Отправляется' : status === 'failed' ? 'Не отправлено' : 'Отправлено'
  return (
    <Icon
      aria-label={label}
      className={cn('size-3.5 shrink-0', status === 'failed' && 'text-destructive', className)}
      strokeWidth={status === 'sent' ? 2.5 : 2}
    />
  )
}
