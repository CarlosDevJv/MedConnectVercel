import DOMPurify from 'dompurify'

/** Sanitiza HTML do laudo antes da pré-visualização / impressão (evita XSS). */
export function sanitizeReportHtml(html: string | null | undefined): string {
  if (!html?.trim()) return '<p class="text-[var(--color-muted-foreground)]">Sem conteúdo no corpo do laudo.</p>'
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
  })
}
