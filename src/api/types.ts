// Типы ответов GREEN-API для Telegram-инстансов.
// Документация: https://green-api.com/telegram/docs/api/

export interface Credentials {
  idInstance: string
  apiTokenInstance: string
  apiUrl: string
}

export type StateInstance =
  | 'notAuthorized'
  | 'authorized'
  | 'blocked'
  | 'suspended'
  | 'starting'
  | 'pendingPassword'

export interface GetStateInstanceResponse {
  stateInstance: StateInstance
}

/** POST checkAccount — ищет аккаунт Telegram по номеру телефона. */
export interface CheckAccountResponse {
  exist: boolean
  /** Числовой идентификатор личного чата, например "10000000". Пустая строка, если аккаунта нет. */
  chatId: string
  username?: string
  phoneNumber?: number
  fromCache?: boolean
}

export interface SendMessageResponse {
  idMessage: string
}

export interface DeleteNotificationResponse {
  result: boolean
  reason?: string
}

export interface SenderData {
  /** Для личного чата — положительное число ("10000000"), для группы — начинается с минуса. */
  chatId: string
  chatType?: 'user' | 'group' | 'supergroup' | 'channel' | string
  sender: string
  chatName?: string
  senderName?: string
  senderType?: string
  senderContactName?: string
  senderPhoneNumber?: number
}

export interface TextMessageData {
  typeMessage: 'textMessage'
  textMessageData: { textMessage: string }
}

export interface ExtendedTextMessageData {
  typeMessage: 'extendedTextMessage'
  extendedTextMessageData: {
    text: string
    description?: string
    title?: string
    jpegThumbnail?: string
  }
}

/** Любые другие типы сообщений (медиа, стикеры и т. п.) — приложение их пропускает. */
export interface OtherMessageData {
  typeMessage?: string
  [key: string]: unknown
}

export type MessageData = TextMessageData | ExtendedTextMessageData | OtherMessageData

export type MessageWebhookType =
  | 'incomingMessageReceived'
  | 'outgoingMessageReceived'
  | 'outgoingAPIMessageReceived'

export interface MessageNotificationBody {
  typeWebhook: MessageWebhookType
  instanceData?: {
    idInstance: number
    wid: string
    typeInstance?: string
  }
  timestamp: number
  idMessage: string
  senderData: SenderData
  /** У outgoingAPIMessageReceived в Telegram может прийти пустым объектом. */
  messageData: MessageData
}

/** Все остальные уведомления: статусы сообщений, состояние инстанса и т. д. */
export interface OtherNotificationBody {
  typeWebhook: string
  [key: string]: unknown
}

export type NotificationBody = MessageNotificationBody | OtherNotificationBody

export interface ReceiveNotificationResponse {
  receiptId: number
  body: NotificationBody
}
