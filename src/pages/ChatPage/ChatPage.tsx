import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { createApiClient, type NotificationBody } from '@/api'
import { ServiceBadge } from '@/components/atoms'
import { MessageInput } from '@/components/molecules'
import { ChatHeader, ChatList, MessageList, NewChatDialog, type ChatListEntry } from '@/components/organisms'
import { MessengerLayout } from '@/components/templates'
import { useNotifications } from '@/hooks/useNotifications'
import type { Chat, Message } from '@/lib/types'
import { formatPhone, normalizePhone, parseNotification } from '@/lib/utils'
import { useStore } from '@/store'

/** Лимит длины текста в SendMessage для Telegram. */
const MAX_MESSAGE_LENGTH = 4096
const NO_MESSAGES: Message[] = []

function chatTitle(chat: Chat): string {
  if (chat.phone) return formatPhone(chat.phone)
  return chat.name ?? `ID ${chat.chatId}`
}

function chatSubtitle(chat: Chat): string {
  if (chat.phone && chat.name) return chat.name
  return `chatId ${chat.chatId}`
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Неизвестная ошибка'
}

export function ChatPage() {
  const { state, dispatch, logout } = useStore()
  const { credentials, chats, messages, activeChatId } = state
  const [newChatOpen, setNewChatOpen] = useState(false)
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  const api = useMemo(() => (credentials ? createApiClient(credentials) : null), [credentials])

  useNotifications(api, {
    onNotification: (body: NotificationBody) => {
      const message = parseNotification(body)
      if (message) dispatch({ type: 'receiveMessage', message })
    },
    onError: (error, attempt) => {
      if (attempt === 1) toast.error('Нет связи с GREEN-API', { description: `${errorMessage(error)}. Повторяем…` })
    },
  })

  const chatEntries = useMemo<ChatListEntry[]>(() => {
    const entries = chats.map((chat) => {
      const last = messages[chat.chatId]?.at(-1)
      return { chatId: chat.chatId, title: chatTitle(chat), preview: last?.text, timestamp: last?.timestamp }
    })
    // Свежие переписки сверху; чаты без сообщений (только что созданные) — выше всех.
    return entries.sort((a, b) => (b.timestamp ?? Infinity) - (a.timestamp ?? Infinity))
  }, [chats, messages])

  const activeChat = chats.find((chat) => chat.chatId === activeChatId) ?? null

  const selectChat = useCallback((chatId: string | null) => dispatch({ type: 'selectChat', chatId }), [dispatch])

  async function createChat(rawPhone: string) {
    if (!api) return
    const phone = normalizePhone(rawPhone)
    if (!phone) throw new Error('Введите номер в международном формате, например +7 900 123-45-67')

    const known = chats.find((chat) => chat.phone === phone)
    if (known) {
      selectChat(known.chatId)
      setNewChatOpen(false)
      return
    }

    // В Telegram chatId — числовой ID пользователя, а не номер: узнаём его через checkAccount.
    const account = await api.checkAccount(phone)
    if (!account.exist || !account.chatId) throw new Error('У этого номера нет аккаунта Telegram')

    dispatch({ type: 'openChat', chat: { chatId: account.chatId, phone } })
    setNewChatOpen(false)
  }

  async function sendMessage(chatId: string, text: string) {
    if (!api) return
    const id = crypto.randomUUID()
    dispatch({
      type: 'addMessage',
      message: { id, chatId, text, timestamp: Date.now(), direction: 'outgoing', status: 'sending' },
    })
    try {
      const { idMessage } = await api.sendMessage(chatId, text)
      dispatch({ type: 'updateMessage', chatId, id, patch: { status: 'sent', idMessage } })
    } catch (error) {
      const reason = errorMessage(error)
      dispatch({ type: 'updateMessage', chatId, id, patch: { status: 'failed', error: reason } })
      toast.error('Сообщение не отправлено', { description: reason })
    }
  }

  const draft = activeChat ? (drafts[activeChat.chatId] ?? '') : ''

  return (
    <>
      <MessengerLayout
        chatOpen={activeChat !== null}
        sidebar={
          <ChatList
            chats={chatEntries}
            activeChatId={activeChatId}
            caption={credentials ? `Инстанс ${credentials.idInstance}` : undefined}
            onSelect={selectChat}
            onNewChat={() => setNewChatOpen(true)}
            onLogout={logout}
          />
        }
        placeholder={<ServiceBadge>Выберите чат, чтобы начать общение</ServiceBadge>}
        chatHeader={
          activeChat && (
            <ChatHeader
              chatId={activeChat.chatId}
              title={chatTitle(activeChat)}
              subtitle={chatSubtitle(activeChat)}
              onBack={() => selectChat(null)}
            />
          )
        }
        chatBody={activeChat && <MessageList messages={messages[activeChat.chatId] ?? NO_MESSAGES} />}
        chatFooter={
          activeChat && (
            <MessageInput
              value={draft}
              maxLength={MAX_MESSAGE_LENGTH}
              onChange={(value) => setDrafts((prev) => ({ ...prev, [activeChat.chatId]: value }))}
              onSend={() => {
                void sendMessage(activeChat.chatId, draft.trim())
                setDrafts((prev) => ({ ...prev, [activeChat.chatId]: '' }))
              }}
            />
          )
        }
      />
      <NewChatDialog open={newChatOpen} onOpenChange={setNewChatOpen} onSubmit={createChat} />
    </>
  )
}
