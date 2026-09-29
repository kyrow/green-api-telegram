import type { ReactNode } from 'react'
import { SendIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export interface AuthLayoutProps {
  title: string
  description: ReactNode
  children: ReactNode
  /** Строка под карточкой: подсказки, ссылки. */
  footer?: ReactNode
}

export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <main className="flex min-h-full items-start justify-center overflow-y-auto bg-background px-4 py-10 sm:items-center">
      <div className="flex w-full max-w-[360px] flex-col items-center gap-6">
        <div className="flex size-[120px] items-center justify-center rounded-full bg-primary text-primary-foreground sm:size-[160px]">
          <SendIcon className="size-14 -translate-x-1 sm:size-20" strokeWidth={1.75} />
        </div>
        <Card className="w-full gap-5 border-0 py-0 shadow-none ring-0">
          <CardHeader className="gap-2 px-0 text-center">
            <CardTitle className="text-2xl font-medium">{title}</CardTitle>
            <CardDescription className="text-[15px]">{description}</CardDescription>
          </CardHeader>
          <CardContent className="px-0">{children}</CardContent>
        </Card>
        {footer && <div className="text-center text-sm text-muted-foreground">{footer}</div>}
      </div>
    </main>
  )
}
