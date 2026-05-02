import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Paperclip, SendHorizontal, Smile, X } from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner'

import { cn } from '@/lib/cn'

interface SupportChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SupportChatDialog({ open, onOpenChange }: SupportChatDialogProps) {
  const [draft, setDraft] = React.useState('')

  React.useEffect(() => {
    if (!open) setDraft('')
  }, [open])

  function handleSend() {
    const t = draft.trim()
    if (!t) return
    toast.message('MediConnect', { description: 'Integração do chat em breve. Sua mensagem foi anotada localmente.' })
    setDraft('')
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          className={cn(
            'fixed z-[101] flex max-h-[min(580px,90dvh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl outline-none animate-fade-in-up',
            'bottom-4 right-4 sm:bottom-6 sm:right-6',
            'max-sm:left-1/2 max-sm:right-auto max-sm:max-h-[85dvh] max-sm:w-[calc(100%-2rem)] max-sm:-translate-x-1/2'
          )}
          aria-describedby={undefined}
        >
          <div className="relative shrink-0 bg-[var(--color-accent)] px-4 pb-5 pt-4 text-white">
            <DialogPrimitive.Title className="pr-12 text-xl font-semibold tracking-tight">
              MediConnect
            </DialogPrimitive.Title>
            <p className="mt-2 text-sm font-medium text-white/95">Iniciar um novo atendimento</p>
            <p className="mt-1 text-xs text-white/80">Atualmente respondendo em menos de 2 minutos</p>
            <DialogPrimitive.Close
              type="button"
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/20 text-white outline-none transition-colors hover:bg-white/30 focus-visible:ring-2 focus-visible:ring-white/50"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </DialogPrimitive.Close>
          </div>

          <div
            className="dot-pattern flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4"
            style={{ backgroundColor: 'var(--color-muted)' }}
          >
            <div className="flex gap-3">
              <div
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-accent)] text-sm font-semibold text-white"
                aria-hidden
              >
                M
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-[11px] font-medium text-[var(--color-muted-foreground)]">MediConnect</p>
                <div className="inline-block max-w-[95%] rounded-2xl rounded-tl-md bg-[var(--color-surface)] px-3.5 py-2.5 text-sm leading-relaxed text-[var(--color-foreground)] shadow-sm">
                  Olá, como podemos te ajudar?
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <div className="flex items-end gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-2 focus-within:ring-2 focus-within:ring-[var(--color-ring)]/25">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Responda aqui…"
                rows={1}
                className="max-h-28 min-h-[44px] w-full flex-1 resize-none bg-transparent px-2 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] outline-none"
                aria-label="Mensagem para o suporte"
              />
              <div className="flex shrink-0 items-center gap-0.5 self-end pb-1">
                <button
                  type="button"
                  className="grid h-9 w-9 place-items-center rounded-lg text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                  aria-label="Anexar arquivo"
                  onClick={() => toast.info('Anexos disponíveis em breve.')}
                >
                  <Paperclip className="h-[18px] w-[18px]" />
                </button>
                <button
                  type="button"
                  className="grid h-9 w-9 place-items-center rounded-lg text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                  aria-label="Emoji"
                  onClick={() => toast.info('Reações em breve.')}
                >
                  <Smile className="h-[18px] w-[18px]" />
                </button>
                <button
                  type="button"
                  onClick={() => handleSend()}
                  className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)] hover:text-white"
                  aria-label="Enviar mensagem"
                >
                  <SendHorizontal className="h-[18px] w-[18px]" />
                </button>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
