import { describe, expect, it } from 'vitest'
import type { MessageNotificationBody, NotificationBody } from '@/api/types'
import { getInitials, normalizePhone, parseNotification } from './utils'

describe('normalizePhone', () => {
  it.each([
    ['+7 (900) 123-45-67', '79001234567'],
    ['79001234567', '79001234567'],
    [' +44 20 7946 0958 ', '442079460958'],
    ['+1-202-555-0143', '12025550143'],
  ])('%s → %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected)
  })

  it.each(['', '   ', '+7 900 abc', '12345', '1234567890123456', '79001234567@c.us'])(
    'отклоняет «%s»',
    (input) => {
      expect(normalizePhone(input)).toBeNull()
    },
  )
})

describe('getInitials', () => {
  it('берёт первые буквы двух слов имени', () => {
    expect(getInitials('Василиса Премудрая')).toBe('ВП')
    expect(getInitials('john')).toBe('J')
  })

  it('для номера берёт две последние цифры', () => {
    expect(getInitials('+79001234567')).toBe('67')
  })
})

/** Пример из документации GREEN-API для Telegram (incomingMessageReceived / textMessage). */
function incomingText(overrides: Partial<MessageNotificationBody> = {}): MessageNotificationBody {
  return {
    typeWebhook: 'incomingMessageReceived',
    instanceData: { idInstance: 4100000000, wid: '79876543210@c.us', typeInstance: 'telegram' },
    timestamp: 1763115112,
    idMessage: '126543123451133331119',
    senderData: {
      chatId: '10000000',
      chatType: 'user',
      sender: '10000000',
      chatName: 'Василиса',
      senderName: 'Василиса Премудрая',
      senderContactName: '',
      senderPhoneNumber: 79998887766,
    },
    messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'Привет от Green-API!' } },
    ...overrides,
  }
}

describe('parseNotification', () => {
  it('разбирает входящее текстовое сообщение', () => {
    expect(parseNotification(incomingText())).toEqual({
      chatId: '10000000',
      idMessage: '126543123451133331119',
      text: 'Привет от Green-API!',
      timestamp: 1763115112000,
      direction: 'incoming',
      phone: '79998887766',
      name: 'Василиса Премудрая',
    })
  })

  it('разбирает extendedTextMessage', () => {
    const parsed = parseNotification(
      incomingText({
        messageData: {
          typeMessage: 'extendedTextMessage',
          extendedTextMessageData: { text: 'Ссылка https://green-api.com/', title: 'GREEN-API' },
        },
      }),
    )
    expect(parsed?.text).toBe('Ссылка https://green-api.com/')
  })

  it('исходящее с телефона — outgoing, номер отправителя (наш) не берётся', () => {
    const parsed = parseNotification(incomingText({ typeWebhook: 'outgoingMessageReceived' }))
    expect(parsed).toMatchObject({ direction: 'outgoing', chatId: '10000000', name: 'Василиса' })
    expect(parsed?.phone).toBeUndefined()
  })

  it('outgoingAPIMessageReceived с текстом разбирается как исходящее', () => {
    expect(parseNotification(incomingText({ typeWebhook: 'outgoingAPIMessageReceived' }))?.direction).toBe(
      'outgoing',
    )
  })

  it('outgoingAPIMessageReceived с пустым messageData (формат Telegram) пропускается', () => {
    expect(parseNotification(incomingText({ typeWebhook: 'outgoingAPIMessageReceived', messageData: {} }))).toBeNull()
  })

  it('пропускает нетекстовые сообщения', () => {
    const image = incomingText({ messageData: { typeMessage: 'imageMessage', fileMessageData: {} } })
    expect(parseNotification(image)).toBeNull()
  })

  it('пропускает групповые чаты', () => {
    const group = incomingText({
      senderData: { chatId: '-10000000000000', chatType: 'supergroup', sender: '10000000' },
    })
    expect(parseNotification(group)).toBeNull()
    const legacyGroup = incomingText({ senderData: { chatId: '-100123', sender: '1' } })
    expect(parseNotification(legacyGroup)).toBeNull()
  })

  it('пропускает уведомления других типов и пустой ответ', () => {
    const status: NotificationBody = { typeWebhook: 'outgoingMessageStatus', status: 'delivered', idMessage: '1' }
    const state: NotificationBody = { typeWebhook: 'stateInstanceChanged', stateInstance: 'authorized' }
    expect(parseNotification(status)).toBeNull()
    expect(parseNotification(state)).toBeNull()
    expect(parseNotification(null)).toBeNull()
  })

  it('пропускает сообщение без текста или idMessage', () => {
    expect(parseNotification(incomingText({ messageData: { typeMessage: 'textMessage' } }))).toBeNull()
    expect(parseNotification(incomingText({ idMessage: '' }))).toBeNull()
  })
})
