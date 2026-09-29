import type {
  CheckAccountResponse,
  Credentials,
  DeleteNotificationResponse,
  GetStateInstanceResponse,
  ReceiveNotificationResponse,
  SendMessageResponse,
} from './types'

/** Хост API по умолчанию для Telegram-инстансов (idInstance начинается с 4100). */
export const DEFAULT_API_URL = 'https://4100.api.green-api.com'

/** Сколько секунд сервер держит запрос receiveNotification (допустимо 5–60). */
export const RECEIVE_TIMEOUT_SEC = 20

export class GreenApiError extends Error {
  readonly status: number | null

  constructor(message: string, status: number | null = null) {
    super(message)
    this.name = 'GreenApiError'
    this.status = status
  }
}

export interface GreenApiClient {
  getStateInstance(signal?: AbortSignal): Promise<GetStateInstanceResponse>
  checkAccount(phoneNumber: string, signal?: AbortSignal): Promise<CheckAccountResponse>
  sendMessage(chatId: string, message: string, signal?: AbortSignal): Promise<SendMessageResponse>
  /** null — уведомлений за время receiveTimeout не пришло. */
  receiveNotification(signal?: AbortSignal): Promise<ReceiveNotificationResponse | null>
  deleteNotification(receiptId: number, signal?: AbortSignal): Promise<DeleteNotificationResponse>
}

interface RequestOptions {
  httpMethod?: 'GET' | 'POST' | 'DELETE'
  body?: unknown
  pathSuffix?: string
  query?: Record<string, string | number>
  signal?: AbortSignal
}

function describeStatus(status: number): string {
  if (status === 401 || status === 403) return 'Неверный idInstance или apiTokenInstance'
  if (status === 429) return 'Слишком много запросов, попробуйте позже'
  if (status === 466) return 'Исчерпан лимит запросов тарифа'
  if (status >= 500) return 'Сервер GREEN-API временно недоступен'
  return `Ошибка GREEN-API (HTTP ${status})`
}

export function createGreenApi(credentials: Credentials): GreenApiClient {
  const base = credentials.apiUrl.trim().replace(/\/+$/, '')
  const id = encodeURIComponent(credentials.idInstance.trim())
  const token = encodeURIComponent(credentials.apiTokenInstance.trim())

  async function request<T>(method: string, options: RequestOptions = {}): Promise<T> {
    const { httpMethod = 'GET', body, pathSuffix = '', query, signal } = options
    let url = `${base}/waInstance${id}/${method}/${token}${pathSuffix}`
    if (query) {
      url += `?${new URLSearchParams(Object.entries(query).map(([k, v]) => [k, String(v)]))}`
    }

    let response: Response
    try {
      response = await fetch(url, {
        method: httpMethod,
        headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
      })
    } catch (error) {
      if (signal?.aborted) throw error
      throw new GreenApiError('Нет соединения с GREEN-API. Проверьте apiUrl и сеть')
    }

    if (!response.ok) {
      throw new GreenApiError(describeStatus(response.status), response.status)
    }

    const text = await response.text()
    return (text ? JSON.parse(text) : null) as T
  }

  return {
    getStateInstance: (signal) => request('getStateInstance', { signal }),

    checkAccount: (phoneNumber, signal) =>
      request('checkAccount', {
        httpMethod: 'POST',
        body: { phoneNumber: Number(phoneNumber) },
        signal,
      }),

    sendMessage: (chatId, message, signal) =>
      request('sendMessage', { httpMethod: 'POST', body: { chatId, message }, signal }),

    receiveNotification: (signal) =>
      request('receiveNotification', { query: { receiveTimeout: RECEIVE_TIMEOUT_SEC }, signal }),

    deleteNotification: (receiptId, signal) =>
      request('deleteNotification', { httpMethod: 'DELETE', pathSuffix: `/${receiptId}`, signal }),
  }
}
