/**
 * Folha de estilo mínima para o documento temporário — não usa Tailwind (contexto novo).
 */
const PRINT_SHELL_CSS = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, Segoe UI, sans-serif;
    font-size: 14px; line-height: 1.45; color: #111; background: #fff; }
  @media print {
    html, body { padding: 10mm; }
  }
  .wrap { max-width: 210mm; margin: 0 auto; }
  h1, h2, h3 { margin: 0 0 8px; font-weight: 600; }
  h1.print-title { font-size: 1.25rem; }
  .print-subtitle { margin: 0 0 12px; color: #444; font-size: 0.875rem; }
  hr.sep { border: none; border-top: 1px solid #ddd; margin: 0 0 12px; }
  .report-preview-body ul { list-style: disc; padding-left: 1.25rem; }
  .report-preview-body ol { list-style: decimal; padding-left: 1.25rem; }
`

/** Texto estrutural (título/subtítulo) — nunca passe HTML não confiável em `fragmentHtml`. */
export function buildLaudoPreviewPrintBody(opts: {
  title: string
  subtitle?: string
  /** HTML já higienizado do corpo do laudo */
  fragmentHtml: string
}): string {
  const h1 = `<h1 class="print-title">${escapeHtml(opts.title.trim() || 'Laudo')}</h1>`
  const sub = opts.subtitle?.trim()
    ? `<p class="print-subtitle">${escapeHtml(opts.subtitle)}</p>`
    : ''
  return `${h1}${sub}<hr class="sep"/><div class="report-preview-body">${opts.fragmentHtml}</div>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildFullPrintHtml(documentTitle: string, bodyInnerHtml: string): string {
  const docTitle = documentTitle.trim() || 'Imprimir'
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"/><title>${escapeHtml(docTitle)}</title><style>${PRINT_SHELL_CSS}</style></head><body><div class="wrap">${bodyInnerHtml}</div></body></html>`
}

/**
 * Impressão sem `window.open` — contorna bloqueadores de pop-up (ex.: Browser do Cursor).
 * Injeta HTML num iframe oculto no próprio documento e chama `print()` na janela do iframe.
 */
function tryPrintInHiddenIframe(args: { title: string; bodyInnerHtml: string }): boolean {
  try {
    const iframe = document.createElement('iframe')
    iframe.setAttribute('aria-hidden', 'true')
    iframe.setAttribute(
      'style',
      'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;margin:0;opacity:0;pointer-events:none',
    )
    document.body.appendChild(iframe)

    const win = iframe.contentWindow
    const doc = iframe.contentDocument
    if (!win || !doc) {
      iframe.remove()
      return false
    }

    const html = buildFullPrintHtml(args.title, args.bodyInnerHtml)
    doc.open()
    doc.write(html)
    doc.close()

    const cleanup = () => {
      try {
        iframe.remove()
      } catch {
        /* ignore */
      }
    }

    win.addEventListener('afterprint', cleanup, { once: true })
    window.setTimeout(cleanup, 120_000)

    win.focus()
    win.print()
    return true
  } catch {
    return false
  }
}

/** Fallback: nova janela (pode ser bloqueada). */
function tryPrintInPopupWindow(args: { title: string; bodyInnerHtml: string }): boolean {
  const w = typeof window.open === 'function' ? window.open('', '_blank', 'noopener,noreferrer') : null
  if (!w) return false

  try {
    const html = buildFullPrintHtml(args.title, args.bodyInnerHtml)
    w.document.open()
    w.document.write(html)
    w.document.close()

    try {
      w.focus()
      w.print()
      return true
    } catch {
      return false
    }
  } catch {
    try {
      w.close()
    } catch {
      /* ignore */
    }
    return false
  }
}

/**
 * Abre o diálogo de impressão do sistema para o HTML fornecido.
 * Ordem: iframe oculto (sem pop-up) → nova aba → caller pode usar {@link triggerBrowserPrint} em seguida.
 */
export function printHtmlInNewWindow(args: { title: string; bodyInnerHtml: string }): boolean {
  if (tryPrintInHiddenIframe(args)) return true
  if (tryPrintInPopupWindow(args)) return true
  return false
}
