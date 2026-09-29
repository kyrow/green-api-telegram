import type { FormEvent } from 'react'
import { SendButton } from '@/components/atoms'
import { Input } from '@/components/ui/input'

export interface MessageInputProps {
  value: string
  onChange: (value: string) => void
  /** Вызывается по кнопке или Enter, только если текст не пустой. */
  onSend: () => void
  disabled?: boolean
  maxLength?: number
}

export function MessageInput({ value, onChange, onSend, disabled = false, maxLength }: MessageInputProps) {
  const canSend = value.trim().length > 0 && !disabled

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (canSend) onSend()
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Сообщение"
        aria-label="Текст сообщения"
        autoComplete="off"
        maxLength={maxLength}
        disabled={disabled}
        className="h-[54px] flex-1 rounded-2xl border-0 bg-background px-4 text-base shadow-bubble focus-visible:ring-0 md:text-base"
      />
      <SendButton disabled={!canSend} />
    </form>
  )
}
