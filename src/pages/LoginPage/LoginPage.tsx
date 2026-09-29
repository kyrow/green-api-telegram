import { useState } from 'react'
import { createApiClient, DEFAULT_API_URL, isMockMode, type StateInstance } from '@/api'
import { LoginForm, type LoginFormValues } from '@/components/molecules'
import { AuthLayout } from '@/components/templates'
import { useStore } from '@/store'

const CONSOLE_URL = 'https://console.green-api.com'

const STATE_ERRORS: Record<Exclude<StateInstance, 'authorized'>, string> = {
  notAuthorized:
    'Telegram-аккаунт не авторизован в этом инстансе. Откройте личный кабинет GREEN-API и авторизуйте аккаунт: отсканируйте QR-код в Telegram (Настройки → Устройства → Подключить устройство) или войдите по коду.',
  pendingPassword:
    'Авторизация не завершена: в личном кабинете GREEN-API нужно ввести пароль двухфакторной аутентификации Telegram.',
  starting: 'Инстанс запускается, это может занять до 5 минут. Попробуйте войти чуть позже.',
  blocked: 'Инстанс заблокирован. Подробности — в личном кабинете GREEN-API.',
  suspended: 'На аккаунте Telegram временные ограничения. Подробности — в личном кабинете GREEN-API.',
}

const defaultValues: LoginFormValues = isMockMode
  ? { idInstance: '4100000001', apiTokenInstance: 'mock-token', apiUrl: DEFAULT_API_URL }
  : { idInstance: '', apiTokenInstance: '', apiUrl: DEFAULT_API_URL }

export function LoginPage() {
  const { login } = useStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  async function handleSubmit(values: LoginFormValues) {
    const credentials = {
      idInstance: values.idInstance.trim(),
      apiTokenInstance: values.apiTokenInstance.trim(),
      apiUrl: values.apiUrl.trim(),
    }
    setLoading(true)
    setError(undefined)
    try {
      const { stateInstance } = await createApiClient(credentials).getStateInstance()
      if (stateInstance === 'authorized') {
        login(credentials)
        return
      }
      setError(STATE_ERRORS[stateInstance] ?? `Инстанс в состоянии «${stateInstance}», вход невозможен.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось проверить инстанс')
    }
    setLoading(false)
  }

  return (
    <AuthLayout
      title="Telegram через GREEN-API"
      description="Введите данные инстанса из личного кабинета GREEN-API."
      footer={
        isMockMode ? (
          'Мок-режим: запросы к GREEN-API не отправляются.'
        ) : (
          <>
            Нет инстанса?{' '}
            <a href={CONSOLE_URL} target="_blank" rel="noreferrer" className="text-primary hover:underline">
              Создайте его в личном кабинете
            </a>
          </>
        )
      }
    >
      <LoginForm defaultValues={defaultValues} loading={loading} error={error} onSubmit={handleSubmit} />
    </AuthLayout>
  )
}
