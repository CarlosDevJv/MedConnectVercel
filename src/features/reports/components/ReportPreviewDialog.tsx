import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Printer, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { sanitizeReportHtml } from '@/features/reports/utils/sanitizeHtml'
import {
  buildLaudoPreviewPrintBody,
  printHtmlInNewWindow,
} from '@/lib/printHtmlInNewWindow'
import { cn } from '@/lib/cn'
import { triggerBrowserPrint } from '@/lib/triggerBrowserPrint'

export interface ReportPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  subtitle?: string
  html: string | null | undefined
}

export function ReportPreviewDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  html,
}: ReportPreviewDialogProps) {
  const safe = sanitizeReportHtml(html)

  function handlePrint() {
    const bodyInnerHtml = buildLaudoPreviewPrintBody({
      title,
      subtitle,
      fragmentHtml: safe,
    })
    if (printHtmlInNewWindow({ title, bodyInnerHtml })) {
      return
    }
    toast.warning('A impressão em janela separada falhou.', {
      description:
        'Abrimos o diálogo desta aba como alternativa. Se nada aparecer, use Ctrl+P (Cmd+P no Mac) com o pré-visualizador aberto.',
    })
    triggerBrowserPrint()
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[3px] print:hidden" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2',
            'flex flex-col rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl',
            'animate-fade-in-up print:static print:left-auto print:top-auto print:max-h-none print:w-full print:max-w-none print:translate-none print:border-0 print:shadow-none'
          )}
        >
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--color-border)] px-6 py-4 print:hidden">
            <div className="min-w-0">
              <DialogPrimitive.Title className="font-display text-lg font-medium text-[var(--color-foreground)]">
                {title}
              </DialogPrimitive.Title>
              {subtitle ? (
                <DialogPrimitive.Description className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                  {subtitle}
                </DialogPrimitive.Description>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
              <DialogPrimitive.Close
                className="grid h-9 w-9 place-items-center rounded-md text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 print:overflow-visible print:p-0">
            <div
              id="report-print-root"
              className="report-preview-body text-sm text-[var(--color-foreground)] [&_a]:text-[var(--color-accent)]"
              dangerouslySetInnerHTML={{ __html: safe }}
            />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
