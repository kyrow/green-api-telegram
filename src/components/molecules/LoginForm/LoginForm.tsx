import { useState, type FormEvent } from 'react'
import { Spinner, TextField } from '@/components/atoms'
import { Button } from '@/components/ui/button'

export interface LoginFormValues {
  idInstance: string
  apiTokenInstance: string
  apiUrl: string
}

export interface LoginFormProps {
  defaultValues: LoginFormValues
  loading?: boolean
  error?: string
  onSubmit: (values: LoginFormValues) => void
}

export function LoginForm({ defaultValues, loading = false, error, onSubmit }: LoginFormProps) {
  const [values, setValues] = useState(defaultValues)
  const filled = values.idInstance.trim() && values.apiTokenInstance.trim() && values.apiUrl.trim()

  const field = (name: keyof LoginFormValues) => ({
    name,
    value: values[name],
    onChange: (event: { target: { value: string } }) => setValues((prev) => ({ ...prev, [name]: event.target.value })),
    disabled: loading,
    required: true,
    autoComplete: 'off',
    spellCheck: false,
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (filled && !loading) onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
      <TextField label="idInstance" inputMode="numeric" placeholder="4100000000" {...field('idInstance')} />
      <TextField label="apiTokenInstance" type="password" placeholder="Токен инстанса" {...field('apiTokenInstance')} />
      <TextField
        label="apiUrl"
        type="url"
        hint="Хост API из личного кабинета GREEN-API"
        {...field('apiUrl')}
      />
      {error && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={!filled || loading} className="h-12 rounded-xl text-base font-medium uppercase">
        {loading ? <Spinner className="size-5" /> : 'Войти'}
      </Button>
    </form>
  )
}
