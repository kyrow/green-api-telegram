import { useState, type FormEvent } from 'react'
import { Spinner, TextField } from '@/components/atoms'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export interface NewChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Создаёт чат по номеру. Ошибка (throw) показывается под полем ввода. */
  onSubmit: (phone: string) => Promise<void>
}

export function NewChatDialog({ open, onOpenChange, onSubmit }: NewChatDialogProps) {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState(false)

  function handleOpenChange(next: boolean) {
    if (pending) return
    if (!next) {
      setPhone('')
      setError(undefined)
    }
    onOpenChange(next)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!phone.trim() || pending) return
    setPending(true)
    setError(undefined)
    try {
      await onSubmit(phone)
      setPhone('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать чат')
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-sm">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium">Новый чат</DialogTitle>
            <DialogDescription>Номер телефона собеседника в международном формате.</DialogDescription>
          </DialogHeader>
          <TextField
            label="Номер телефона"
            type="tel"
            inputMode="tel"
            placeholder="+7 900 123-45-67"
            autoFocus
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            disabled={pending}
            error={error}
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={pending}>
              Отмена
            </Button>
            <Button type="submit" disabled={!phone.trim() || pending}>
              {pending && <Spinner />}
              Создать
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
