import { GreenApiError, type GreenApiClient } from './greenApi'
import type { Credentials, MessageNotificationBody, NotificationBody, ReceiveNotificationResponse } from './types'

/**
 * Эмуляция GREEN-API в памяти для проверки UI без сети (`?mock=1`).
 * - idInstance `0` → инстанс не авторизован;
 * - номер, оканчивающийся на `0000`, → аккаунта Telegram нет;
 * - текст с `!fail` → ошибка отправки;
 * - на каждое отправленное сообщение через 1.5 с приходит ответ;
 * - через 3 с после входа приходит сообщение от нового собеседника.
 */

const MOCK_POLL_TIMEOUT_MS = 20_000
const MOCK_WID = '79990000000@c.us'

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason)
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(signal?.reason)
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

export function createMockGreenApi(credentials: Credentials): GreenApiClient {
  const queue: ReceiveNotificationResponse[] = []
  const waiters = new Set<() => void>()
  let receiptSeq = 1
  let messageSeq = 1_000

  function push(body: NotificationBody) {
    queue.push({ receiptId: receiptSeq++, body })
    waiters.forEach((wake) => wake())
  }

  function messageBody(
    typeWebhook: MessageNotificationBody['typeWebhook'],
    chatId: string,
    text: string | null,
    extra: Partial<MessageNotificationBody['senderData']> = {},
  ): MessageNotificationBody {
    return {
      typeWebhook,
      instanceData: { idInstance: Number(credentials.idInstance), wid: MOCK_WID, typeInstance: 'telegram' },
      timestamp: Math.floor(Date.now() / 1000),
      idMessage: String(messageSeq++),
      senderData: { chatId, chatType: 'user', sender: chatId, ...extra },
      messageData:
        text == null ? {} : { typeMessage: 'textMessage', textMessageData: { textMessage: text } },
    }
  }

  setTimeout(() => {
    push(
      messageBody('incomingMessageReceived', '555000111', 'Привет! Это входящее сообщение из мок-режима 👋', {
        senderName: 'Василиса Премудрая',
        senderPhoneNumber: 79995550111,
      }),
    )
  }, 3_000)

  return {
    async getStateInstance(signal) {
      await delay(400, signal)
      return { stateInstance: credentials.idInstance.trim() === '0' ? 'notAuthorized' : 'authorized' }
    },

    async checkAccount(phoneNumber, signal) {
      await delay(400, signal)
      if (phoneNumber.endsWith('0000')) return { exist: false, chatId: '' }
      return { exist: true, chatId: String(Number(phoneNumber.slice(-9))), phoneNumber: Number(phoneNumber) }
    },

    async sendMessage(chatId, message, signal) {
      await delay(500, signal)
      if (message.includes('!fail')) throw new GreenApiError('Ошибка GREEN-API (HTTP 500)', 500)

      const sent = messageBody('outgoingAPIMessageReceived', chatId, null)
      push(sent)
      // Статус доставки — не текстовое уведомление, его нужно просто удалить из очереди.
      push({ typeWebhook: 'outgoingMessageStatus', chatId, idMessage: sent.idMessage, status: 'sent' })
      setTimeout(() => push(messageBody('incomingMessageReceived', chatId, `Ответ на «${message}»`)), 1_500)
      return { idMessage: sent.idMessage }
    },

    async receiveNotification(signal) {
      if (queue.length === 0) {
        await new Promise<void>((resolve, reject) => {
          const cleanup = () => {
            clearTimeout(timer)
            waiters.delete(done)
            signal?.removeEventListener('abort', onAbort)
          }
          const done = () => {
            cleanup()
            resolve()
          }
          const onAbort = () => {
            cleanup()
            reject(signal?.reason)
          }
          const timer = setTimeout(done, MOCK_POLL_TIMEOUT_MS)
          waiters.add(done)
          signal?.addEventListener('abort', onAbort, { once: true })
        })
      }
      return queue[0] ?? null
    },

    async deleteNotification(receiptId, signal) {
      await delay(50, signal)
      const index = queue.findIndex((item) => item.receiptId === receiptId)
      if (index !== -1) queue.splice(index, 1)
      return { result: index !== -1 }
    },
  }
}
