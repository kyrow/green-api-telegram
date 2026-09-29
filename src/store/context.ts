import { createContext, useContext, type Dispatch } from 'react'
import type { Credentials } from '@/api/types'
import type { Action, State } from './reducer'

export interface StoreValue {
  state: State
  dispatch: Dispatch<Action>
  login: (credentials: Credentials) => void
  logout: () => void
}

export const StoreContext = createContext<StoreValue | null>(null)

export function useStore(): StoreValue {
  const value = useContext(StoreContext)
  if (!value) throw new Error('useStore должен вызываться внутри <StoreProvider>')
  return value
}
