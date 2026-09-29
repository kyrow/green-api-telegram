import type {
  ExtendedTextMessageData,
  MessageNotificationBody,
  NotificationBody,
  TextMessageData,
} from '@/api/types'
import type { ParsedMessage } from '@/lib/types'

export { cn } from 'cn'

/**
 * Приводит введённый номер к виду «только цифры» (международный формат без +).
 * Убирает пробелы, `+`, скобки и дефисы. Возвращает null, если остались посторонние
 * символы или длина не похожа на телефонный номер (E.164: до 15 цифр).
 */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[\s+()-]/g, '')
  if (!/^\d{7,15}$/.test(digits)) return null
  return digits
}

/** «79001234567» → «+79001234567» для отображения. */
export function formatPhone(digits: string): string {
  return `+${digits}`
}

/** Инициалы из имени («Василиса Премудрая» → «ВП») или последние две цифры номера. */
export function getInitials(title: string): string {
  const words = title.match(/\p{L}+/gu)
  if (words?.length) return words.slice(0, 2).map((w) => w[0].toUpperCase()).join('')
  return title.replace(/\D/g, '').slice(-2)
}

const timeFormatter = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })

/** Время сообщения в формате ЧЧ:ММ. */
export function formatTime(timestamp: number): string {
  return timeFormatter.format(timestamp)
}

const MESSAGE_WEBHOOKS = new Set<string>([
  'incomingMessageReceived',
  'outgoingMessageReceived',
  'outgoingAPIMessageReceived',
])

function isMessageNotification(body: NotificationBody): body is MessageNotificationBody {
  return MESSAGE_WEBHOOKS.has(body.typeWebhook) && 'senderData' in body && body.senderData != null
}

function isPrivateChat(body: MessageNotificationBody): boolean {
  const { chatId, chatType } = body.senderData
  if (chatType) return chatType === 'user'
  return !chatId.startsWith('-') && !chatId.endsWith('@g.us')
}

function extractText(body: MessageNotificationBody): string | null {
  const data = body.messageData
  if (!data) return null
  let text: unknown = null
  if (data.typeMessage === 'textMessage') {
    text = (data as TextMessageData).textMessageData?.textMessage
  } else if (data.typeMessage === 'extendedTextMessage') {
    text = (data as ExtendedTextMessageData).extendedTextMessageData?.text
  }
  return typeof text === 'string' ? text : null
}

/**
 * Достаёт текстовое сообщение личного чата из уведомления GREEN-API.
 * Для всего остального (статусы, медиа, группы, пустой messageData) возвращает null.
 */
export function parseNotification(body: NotificationBody | null | undefined): ParsedMessage | null {
  if (!body || !isMessageNotification(body) || !isPrivateChat(body)) return null

  const text = extractText(body)
  if (text == null || !body.idMessage) return null

  const { senderData } = body
  const incoming = body.typeWebhook === 'incomingMessageReceived'
  // В исходящих senderData.senderPhoneNumber — номер нашего аккаунта, а не собеседника.
  const phone = incoming && senderData.senderPhoneNumber ? String(senderData.senderPhoneNumber) : undefined
  const name = incoming
    ? senderData.senderContactName || senderData.senderName || senderData.chatName
    : senderData.chatName

  return {
    chatId: senderData.chatId,
    idMessage: body.idMessage,
    text,
    timestamp: body.timestamp * 1000,
    direction: incoming ? 'incoming' : 'outgoing',
    phone,
    name: name || undefined,
  }
}
