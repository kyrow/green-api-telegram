export type MessageDirection = 'incoming' | 'outgoing'

export type MessageStatus = 'sending' | 'sent' | 'failed'

export interface Message {
  /** Локальный идентификатор, стабилен до и после отправки. */
  id: string
  /** Идентификатор сообщения в Telegram (появляется после отправки / из уведомления). */
  idMessage?: string
  chatId: string
  text: string
  /** Время в миллисекундах. */
  timestamp: number
  direction: MessageDirection
  status: MessageStatus
  error?: string
}

export interface Chat {
  chatId: string
  /** Номер телефона только из цифр, если известен. */
  phone?: string
  name?: string
}

/** Сообщение, извлечённое из уведомления GREEN-API. */
export interface ParsedMessage {
  chatId: string
  idMessage: string
  text: string
  timestamp: number
  direction: MessageDirection
  phone?: string
  name?: string
}
