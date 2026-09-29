import { describe, expect, it } from 'vitest'
import type { ParsedMessage } from '@/lib/types'
import { initialState, reducer, type State } from './reducer'

const credentials = { idInstance: '4100000001', apiTokenInstance: 't', apiUrl: 'https://4100.api.green-api.com' }
const loggedIn: State = { ...initialState, credentials }

const incoming: ParsedMessage = {
  chatId: '10000000',
  idMessage: 'm1',
  text: 'Привет',
  timestamp: 1_000,
  direction: 'incoming',
  phone: '79998887766',
  name: 'Василиса',
}

describe('reducer: receiveMessage', () => {
  it('создаёт чат автоматически и добавляет сообщение', () => {
    const state = reducer(loggedIn, { type: 'receiveMessage', message: incoming })
    expect(state.chats).toEqual([{ chatId: '10000000', phone: '79998887766', name: 'Василиса' }])
    expect(state.messages['10000000']).toHaveLength(1)
    expect(state.messages['10000000'][0]).toMatchObject({ text: 'Привет', direction: 'incoming', status: 'sent' })
  })

  it('не дублирует повторно полученное уведомление', () => {
    let state = reducer(loggedIn, { type: 'receiveMessage', message: incoming })
    state = reducer(state, { type: 'receiveMessage', message: incoming })
    expect(state.messages['10000000']).toHaveLength(1)
  })

  it('попадает в чат, созданный через checkAccount', () => {
    let state = reducer(loggedIn, { type: 'openChat', chat: { chatId: '10000000', phone: '79998887766' } })
    state = reducer(state, { type: 'receiveMessage', message: incoming })
    expect(state.chats).toHaveLength(1)
    expect(state.chats[0]).toEqual({ chatId: '10000000', phone: '79998887766', name: 'Василиса' })
  })
})

describe('reducer: отправка', () => {
  it('обновляет статус и убирает дубль, пришедший уведомлением раньше ответа sendMessage', () => {
    let state = reducer(loggedIn, {
      type: 'addMessage',
      message: { id: 'local', chatId: '1', text: 'Hi', timestamp: 1, direction: 'outgoing', status: 'sending' },
    })
    state = reducer(state, {
      type: 'receiveMessage',
      message: { chatId: '1', idMessage: 'srv', text: 'Hi', timestamp: 1, direction: 'outgoing' },
    })
    expect(state.messages['1']).toHaveLength(2)
    state = reducer(state, { type: 'updateMessage', chatId: '1', id: 'local', patch: { status: 'sent', idMessage: 'srv' } })
    expect(state.messages['1']).toEqual([expect.objectContaining({ id: 'local', status: 'sent', idMessage: 'srv' })])
  })

  it('logout очищает состояние', () => {
    expect(reducer(loggedIn, { type: 'logout' })).toEqual(initialState)
  })
})
