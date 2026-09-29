import type { ComponentProps } from 'react'
import { SendHorizontalIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type SendButtonProps = Omit<ComponentProps<typeof Button>, 'children'>

export function SendButton({ className, ...props }: SendButtonProps) {
  return (
    <Button
      type="submit"
      aria-label="Отправить"
      className={cn(
        'size-[54px] shrink-0 rounded-full bg-primary shadow-bubble hover:bg-primary/90 [&_svg:not([class*=size-])]:size-6',
        className,
      )}
      {...props}
    >
      <SendHorizontalIcon />
    </Button>
  )
}
