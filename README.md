# Telegram-чат через GREEN-API

Минимальный веб-клиент для отправки и получения **текстовых** сообщений в Telegram через [GREEN-API](https://green-api.com/telegram/). Внешний вид повторяет светлую тему [Telegram Web K](https://web.telegram.org/k/).

Стек: React 19, TypeScript (strict), Vite, Tailwind CSS 4, shadcn/ui (Radix), lucide-react. Бэкенда нет: браузер обращается к GREEN-API напрямую через `fetch`.

## Запуск

```bash
npm install
npm run dev        # http://localhost:5173
```

| Команда | Что делает |
|---|---|
| `npm run dev` | dev-сервер |
| `npm run build` | проверка типов и production-сборка в `dist/` |
| `npm run lint` | ESLint, включая правило границ уровней Atomic Design |
| `npm test` | юнит-тесты Vitest |

### Мок-режим без сети

Откройте `http://localhost:5173/?mock=1`. Запросы к GREEN-API не отправляются: API эмулируется в памяти (`src/api/mockGreenApi.ts`).

- Поля входа уже заполнены. Если указать `idInstance` = `0`, приложение покажет ошибку «аккаунт не авторизован».
- Через 3 секунды после входа приходит сообщение от нового собеседника, и чат с ним создаётся автоматически.
- Номер, который оканчивается на `0000`, считается номером без аккаунта Telegram.
- На каждое отправленное сообщение через 1,5 секунды приходит ответ.
- Сообщение с текстом `!fail` не отправляется: у пузыря появляется ошибка, и всплывает toast.

## Как подготовить инстанс GREEN-API

1. Зарегистрируйтесь в [личном кабинете](https://console.green-api.com) и создайте инстанс типа **Telegram**.
2. В карточке инстанса есть три параметра, которые нужно ввести на экране входа:
   - `apiUrl` — хост API. Для Telegram по умолчанию `https://4100.api.green-api.com`, это значение уже подставлено в форму;
   - `idInstance` — номер инстанса;
   - `apiTokenInstance` — ключ доступа.
3. **Авторизуйте аккаунт Telegram** в инстансе. Это можно сделать двумя способами:
   - по QR-коду из личного кабинета: в мобильном Telegram откройте *Настройки → Устройства → Подключить устройство* и отсканируйте код;
   - по коду: методы `StartAuthorization` → `SendAuthorizationCode`, а если включена двухфакторная аутентификация — ещё `SendAuthorizationPassword`.

   После авторизации метод `getStateInstance` должен возвращать `authorized`. Приложение проверяет это при входе и в любом другом состоянии показывает подсказку, что делать.
4. **Настройте получение уведомлений через HTTP API.** Поле `webhookUrl` в настройках инстанса должно быть **пустым**: пока задан вебхук, очередь `receiveNotification` не заполняется. Включите:
   - «Получать уведомления о входящих сообщениях» (`incomingWebhook`);
   - по желанию «…об отправленных с телефона» (`outgoingMessageWebhook`): тогда в приложении появятся и сообщения, которые вы отправили из официального клиента Telegram.

## Как проверить сценарий

1. Войдите с данными инстанса.
2. Нажмите круглую кнопку с карандашом («Новый чат») и введите номер собеседника в международном формате, например `+7 (900) 123-45-67`. Нужен другой аккаунт Telegram, не тот, что привязан к инстансу.
3. Отправьте сообщение кнопкой или клавишей Enter. Оно сразу появится справа: сначала с часами, после ответа сервера — с галочкой.
4. Ответьте с другого аккаунта Telegram. Ответ придёт в тот же чат в течение нескольких секунд.
5. Напишите на аккаунт инстанса с третьего аккаунта. Чат с новым собеседником появится в списке автоматически.

## Чем Telegram отличается от WhatsApp в GREEN-API

У Telegram-инстансов своя документация: [green-api.com/telegram/docs](https://green-api.com/telegram/docs/). Раздел `/v3/docs/` описывает мессенджер MAX, поэтому приложение сделано по документации Telegram.

| | WhatsApp | Telegram (реализовано) |
|---|---|---|
| Формат URL | `{apiUrl}/waInstance{id}/{method}/{token}` | тот же, включая префикс `waInstance` |
| `apiUrl` | `https://api.green-api.com` / `https://XXXX.api.greenapi.com` | `https://4100.api.green-api.com` (берётся из личного кабинета) |
| `chatId` личного чата | `79001234567@c.us` (номер телефона) | **числовой ID пользователя** Telegram, например `"10000000"`; у групп ID начинается с `-` |
| Номер → `chatId` | склеить номер и `@c.us` | метод **`CheckAccount`** (`{ phoneNumber }` → `{ exist, chatId }`) |
| Длина `SendMessage.message` | — | до 4096 символов |
| `outgoingAPIMessageReceived` | содержит `messageData` с текстом | в примерах документации `messageData` пустой (`{}`) |
| `senderData` | `chatId`, `sender`, `senderName`… | дополнительно `chatType`, `senderType`, `senderPhoneNumber` |

Главное отличие — формат `chatId`. Формат `79001234567@c.us` Telegram-инстанс принимает только ради обратной совместимости. При этом ответ собеседника придёт с числовым `senderData.chatId`, и одна переписка разделилась бы на два чата. Поэтому новый чат создаётся так:

1. `normalizePhone` убирает из номера пробелы, `+`, скобки и дефисы и проверяет длину (7–15 цифр).
2. `CheckAccount` возвращает числовой `chatId`. Если аккаунта Telegram нет, пользователь видит ошибку прямо в диалоге.
3. Чат сохраняется с этим `chatId` и номером, поэтому входящие сообщения попадают в тот же чат.

## Получение сообщений

`src/hooks/useNotifications.ts` работает по циклу:

```
receiveNotification?receiveTimeout=20  ─┬─ null → сразу новый запрос
                                        └─ { receiptId, body } → parseNotification(body)
                                                               → dispatch в стор (если это текст)
                                                               → deleteNotification(receiptId)
                                                               → новый запрос
```

- Из очереди удаляется **любое** уведомление, включая статусы, медиа и группы. Иначе очередь застрянет на первом необработанном уведомлении.
- Цикл запускается в `useEffect`, который зависит только от клиента API. Колбэки передаются через `useEffectEvent`, поэтому перерендеры не перезапускают цикл. Cleanup вызывает `AbortController.abort()` и прерывает текущий long-poll запрос, так что при StrictMode, выходе или размонтировании одновременно работает только один цикл.
- При сетевой ошибке цикл ждёт 5 секунд и повторяет запрос. О первой ошибке подряд сообщает toast.
- Если уведомление пришло повторно (например, `deleteNotification` не прошёл), дубль отбрасывается по `idMessage`.

`parseNotification` (`src/lib/utils.ts`) принимает `incomingMessageReceived`, `outgoingMessageReceived` и `outgoingAPIMessageReceived` с типами `textMessage` (`textMessageData.textMessage`) и `extendedTextMessage` (`extendedTextMessageData.text`), только для личных чатов. Всё остальное возвращает `null`.

## Архитектура: Atomic Design

```
            ┌───────────────────────────────────────────────┐
  pages     │ LoginPage, ChatPage  — данные, стор, API, хуки │
            └───────────────────────┬───────────────────────┘
                                    ▼
  templates   AuthLayout, MessengerLayout — раскладка и слоты, без данных
                                    ▼
  organisms   ChatList, ChatHeader, MessageList, NewChatDialog
                                    ▼
  molecules   MessageBubble, ChatListItem, MessageInput, LoginForm
                                    ▼
  atoms       PeerAvatar, MessageTime, MessageStatusIcon, SendButton,
              TextField, IconButton, ServiceBadge, Spinner
                                    ▼
  ui          shadcn: button, input, label, card, dialog, scroll-area, avatar, sonner

  общие модули: lib (утилиты, доменные типы) ← api ← store, hooks
```

| Уровень | Что лежит | Может импортировать |
|---|---|---|
| `components/ui` | сгенерированные примитивы shadcn, правка только в крайнем случае (не правились) | — |
| `atoms` | обёртки над shadcn: аватар с инициалами и градиентом Telegram, время, иконка статуса, круглая кнопка отправки, поле с подписью | `ui`, `lib` |
| `molecules` | пузырь сообщения с «хвостиком», строка списка чатов, поле ввода с кнопкой, форма входа | `atoms`, `ui`, `lib` |
| `organisms` | список чатов с кнопками «Новый чат» и «Выйти», шапка чата, лента с автопрокруткой, диалог нового чата | уровни ниже, `lib` |
| `templates` | `AuthLayout` (экран входа) и `MessengerLayout` (две колонки; на узком экране одна) | уровни ниже, `lib` |
| `pages` | связывают шаблон с состоянием: `useStore`, клиент GREEN-API, `useNotifications` | всё перечисленное, `api`, `store`, `hooks` |

Правила:

- Атомы и молекулы «глупые»: получают данные через props и не обращаются к API и контексту. Локальное UI-состояние (значения полей формы) допустимо.
- Каждый компонент лежит в своей папке с `index.ts`, каждый уровень экспортируется через barrel-файл (`components/atoms/index.ts` и т. д.).
- Импортировать можно только уровни ниже. Импорты вверх и **между компонентами одного уровня** запрещены. Это проверяет ESLint-плагин [`eslint-plugin-boundaries`](https://www.jsboundaries.dev/) в `eslint.config.js`: каждый компонент — отдельный элемент, barrel уровня — отдельный тип `<level>:index`, политика по умолчанию `disallow`.

Два осознанных отступления от примеров в задании:

- **Нет организма `ChatWindow`.** Он должен был бы включать организмы `ChatHeader` и `MessageList`, а это импорт между соседями по уровню. Поэтому правую колонку раскладывает шаблон `MessengerLayout` через слоты `chatHeader`, `chatBody`, `chatFooter` и `placeholder`, а `ChatPage` заполняет эти слоты.
- **Не используется shadcn `form`.** Он тянет `react-hook-form` и `zod`, а двум формам из одного-трёх полей хватает `label` и `input`.

### Остальные модули

```
src/
  api/greenApi.ts        клиент: getStateInstance, checkAccount, sendMessage, receiveNotification, deleteNotification
  api/mockGreenApi.ts    эмуляция для ?mock=1
  api/types.ts           типы ответов и уведомлений
  hooks/useNotifications.ts
  store/                 useReducer + context: учётные данные, чаты, сообщения; сохранение в localStorage
  lib/utils.ts           cn(), normalizePhone, parseNotification, getInitials, formatTime
  lib/types.ts           доменные типы Chat, Message
```

### Тема

Цвета, скругления и шрифты Telegram Web K заданы токенами в `src/index.css`. В Tailwind 4 отдельного `tailwind.config` нет, токены объявлены через `@theme inline`:

- переменные `--tg-*` в `:root`: фон исходящих `#eeffde`, акцентный `#3390ec`, вторичный текст `#707579`, тень пузыря, радиусы 15/6 px, 16px/1.3125 для текста сообщений, градиенты обоев и аватаров;
- утилиты Tailwind: `bg-message-out`, `text-message-out-meta`, `rounded-bubble`, `shadow-bubble`, `text-message`, `bg-service`, `bg-chat-wallpaper`.

Стандартные токены shadcn (`--primary`, `--muted-foreground`, `--border`…) переопределены значениями Telegram. Тёмная тема не делалась.

## Ограничения

- Только текстовые сообщения в личных чатах. Медиа, группы, каналы, статусы прочтения, реакции и редактирование не поддерживаются.
- История с сервера не загружается. Сообщения текущей сессии хранятся в `localStorage` отдельно для каждого инстанса.
- `apiTokenInstance` хранится в `localStorage` открытым текстом. Для тестового клиента это допустимо, для продакшена — нет.
- Частые запросы `CheckAccount` для несуществующих номеров Telegram может временно ограничить. Если чат с таким номером уже есть, приложение открывает его без повторной проверки.
- Галочка у сообщения означает, что GREEN-API принял его (`sendMessage` вернул `idMessage`), а не что его доставили или прочитали.
- Приложение ходит в GREEN-API прямо из браузера и рассчитывает на то, что API отвечает с CORS-заголовками.
