import type { Credentials } from '@/api/types'
import { emptyHistory, type History } from './reducer'

const CREDENTIALS_KEY = 'tg-chat:credentials'
const historyKey = (idInstance: string) => `tg-chat:history:${idInstance}`

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage недоступен (приватный режим) — работаем без сохранения.
  }
}

export function loadCredentials(): Credentials | null {
  const value = read<Credentials>(CREDENTIALS_KEY)
  return value?.idInstance && value.apiTokenInstance && value.apiUrl ? value : null
}

export function saveCredentials(credentials: Credentials | null) {
  write(CREDENTIALS_KEY, credentials)
}

/** История текущей сессии хранится отдельно для каждого инстанса. */
export function loadHistory(idInstance: string): History {
  const history = read<History>(historyKey(idInstance))
  if (!history?.chats || !history.messages) return emptyHistory
  // Отправка, прерванная перезагрузкой страницы, считается неудачной.
  const messages = Object.fromEntries(
    Object.entries(history.messages).map(([chatId, list]) => [
      chatId,
      list.map((m) => (m.status === 'sending' ? { ...m, status: 'failed' as const, error: 'Отправка прервана' } : m)),
    ]),
  )
  return { chats: history.chats, messages }
}

export function saveHistory(idInstance: string, history: History) {
  write(historyKey(idInstance), history)
}
