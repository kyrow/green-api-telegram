import type { Credentials } from '@/api/types'
import type { Chat, Message, ParsedMessage } from '@/lib/types'

export interface History {
  chats: Chat[]
  messages: Record<string, Message[]>
}

export interface State extends History {
  credentials: Credentials | null
  activeChatId: string | null
}

export type Action =
  | { type: 'login'; credentials: Credentials; history: History }
  | { type: 'logout' }
  | { type: 'openChat'; chat: Chat }
  | { type: 'selectChat'; chatId: string | null }
  | { type: 'addMessage'; message: Message }
  | { type: 'updateMessage'; chatId: string; id: string; patch: Partial<Message> }
  | { type: 'receiveMessage'; message: ParsedMessage }

export const emptyHistory: History = { chats: [], messages: {} }

export const initialState: State = { credentials: null, activeChatId: null, ...emptyHistory }

/** Добавляет чат или дополняет известный номером/именем. Новый чат встаёт наверх списка. */
function upsertChat(chats: Chat[], chat: Chat): Chat[] {
  const index = chats.findIndex((item) => item.chatId === chat.chatId)
  if (index === -1) return [chat, ...chats]
  const current = chats[index]
  const merged = { ...current, phone: current.phone ?? chat.phone, name: current.name ?? chat.name }
  if (merged.phone === current.phone && merged.name === current.name) return chats
  return chats.map((item, i) => (i === index ? merged : item))
}

function appendMessage(state: State, message: Message): State {
  const list = state.messages[message.chatId] ?? []
  return { ...state, messages: { ...state.messages, [message.chatId]: [...list, message] } }
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'login':
      return { ...initialState, credentials: action.credentials, ...action.history }

    case 'logout':
      return initialState

    case 'openChat':
      return { ...state, chats: upsertChat(state.chats, action.chat), activeChatId: action.chat.chatId }

    case 'selectChat':
      return { ...state, activeChatId: action.chatId }

    case 'addMessage':
      return appendMessage(
        { ...state, chats: upsertChat(state.chats, { chatId: action.message.chatId }) },
        action.message,
      )

    case 'updateMessage': {
      const list = state.messages[action.chatId]
      if (!list) return state
      const { idMessage } = action.patch
      const updated = list
        // Если уведомление об этом сообщении пришло раньше ответа sendMessage — убираем дубль.
        .filter((m) => !(idMessage && m.id !== action.id && m.idMessage === idMessage))
        .map((m) => (m.id === action.id ? { ...m, ...action.patch } : m))
      return { ...state, messages: { ...state.messages, [action.chatId]: updated } }
    }

    case 'receiveMessage': {
      const { message } = action
      const withChat = {
        ...state,
        chats: upsertChat(state.chats, { chatId: message.chatId, phone: message.phone, name: message.name }),
      }
      const list = state.messages[message.chatId] ?? []
      if (list.some((m) => m.idMessage === message.idMessage)) return withChat
      return appendMessage(withChat, {
        id: `${message.direction}-${message.idMessage}`,
        idMessage: message.idMessage,
        chatId: message.chatId,
        text: message.text,
        timestamp: message.timestamp,
        direction: message.direction,
        status: 'sent',
      })
    }
  }
}
