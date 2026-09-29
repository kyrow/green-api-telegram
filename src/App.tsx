import { Toaster } from '@/components/ui/sonner'
import { ChatPage, LoginPage } from '@/pages'
import { StoreProvider, useStore } from '@/store'

function Screen() {
  const { state } = useStore()
  return state.credentials ? <ChatPage /> : <LoginPage />
}

export default function App() {
  return (
    <StoreProvider>
      <Screen />
      <Toaster theme="light" position="top-center" richColors />
    </StoreProvider>
  )
}
