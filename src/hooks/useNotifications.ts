import { useEffect, useEffectEvent } from 'react'
import type { GreenApiClient, NotificationBody } from '@/api'

const RETRY_DELAY_MS = 5_000

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(done, ms)
    function done() {
      clearTimeout(timer)
      signal.removeEventListener('abort', done)
      resolve()
    }
    signal.addEventListener('abort', done, { once: true })
  })
}

interface Options {
  /** Вызывается для каждого уведомления, включая нетекстовые. */
  onNotification: (body: NotificationBody) => void
  /** attempt — номер неудачной попытки подряд (1 — первая ошибка после успешного запроса). */
  onError?: (error: unknown, attempt: number) => void
}

/**
 * Цикл получения уведомлений по HTTP API:
 * receiveNotification (long polling) → обработать → deleteNotification → повторить.
 *
 * Цикл один на клиента API: при смене клиента, выходе или размонтировании
 * AbortController прерывает текущий запрос и цикл. В StrictMode первый запуск
 * эффекта сразу отменяется, поэтому параллельных циклов не бывает.
 */
export function useNotifications(api: GreenApiClient | null, { onNotification, onError }: Options) {
  const handleNotification = useEffectEvent(onNotification)
  const handleError = useEffectEvent((error: unknown, attempt: number) => onError?.(error, attempt))

  useEffect(() => {
    if (!api) return
    const client = api
    const controller = new AbortController()
    const { signal } = controller

    async function loop() {
      let failures = 0
      while (!signal.aborted) {
        try {
          const notification = await client.receiveNotification(signal)
          failures = 0
          if (!notification) continue // за receiveTimeout ничего не пришло

          try {
            handleNotification(notification.body)
          } catch (error) {
            console.error('Не удалось обработать уведомление', error)
          }
          // Удаляем любое уведомление, даже нетекстовое, иначе очередь застрянет на нём.
          await client.deleteNotification(notification.receiptId, signal)
        } catch (error) {
          if (signal.aborted) break
          failures += 1
          handleError(error, failures)
          await sleep(RETRY_DELAY_MS, signal)
        }
      }
    }

    void loop()
    return () => controller.abort()
  }, [api])
}
