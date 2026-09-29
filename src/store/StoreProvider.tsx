import { useCallback, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import type { Credentials } from '@/api/types'
import { StoreContext, type StoreValue } from './context'
import { initialState, reducer, type State } from './reducer'
import { loadCredentials, loadHistory, saveCredentials, saveHistory } from './storage'

function init(): State {
  const credentials = loadCredentials()
  if (!credentials) return initialState
  return { ...initialState, credentials, ...loadHistory(credentials.idInstance) }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, init)
  const { credentials, chats, messages } = state

  useEffect(() => {
    if (credentials) saveHistory(credentials.idInstance, { chats, messages })
  }, [credentials, chats, messages])

  const login = useCallback((next: Credentials) => {
    saveCredentials(next)
    dispatch({ type: 'login', credentials: next, history: loadHistory(next.idInstance) })
  }, [])

  const logout = useCallback(() => {
    saveCredentials(null)
    dispatch({ type: 'logout' })
  }, [])

  const value = useMemo<StoreValue>(() => ({ state, dispatch, login, logout }), [state, login, logout])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
