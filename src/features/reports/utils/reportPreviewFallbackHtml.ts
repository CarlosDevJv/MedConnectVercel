import type { EnrichedReport } from '@/features/reports/types'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function block(label: string, text: string | null | undefined): string {
  const t = text?.trim()
  if (!t) return ''
  return `<section style="margin-bottom:1.25rem"><h3 style="font-size:0.95rem;font-weight:600;margin:0 0 0.35rem">${escapeHtml(label)}</h3><div style="white-space:pre-wrap;font-size:0.925rem;line-height:1.5">${escapeHtml(t)}</div></section>`
}

/** Quando `content_html` está vazio, monta HTML seguro a partir dos campos estruturados do laudo. */
export function buildReportFallbackHtml(r: EnrichedReport): string {
  const parts = [
    block('Paciente', r.patient_name),
    block('Exame', r.exam),
    block('Solicitante', r.requested_by),
    block('CID-10', r.cid_code),
    block('Diagnóstico', r.diagnosis),
    block('Conclusão', r.conclusion),
  ].filter(Boolean)

  if (!parts.length) {
    return `<p style="opacity:0.82;font-size:0.925rem;margin:0">Não há conteúdo de laudo preenchido (corpo HTML vazio e campos em branco).</p>`
  }

  return `<article style="max-width:100%">${parts.join('')}</article>`
}
