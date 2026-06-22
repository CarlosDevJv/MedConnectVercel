/** Converte telefone BR comum para E.164 (+55...) quando possível. */
export function toE164Preferred(raw: string): string {
  const s = raw.trim()
  if (s.startsWith('+')) return s.replace(/\s/g, '')
  const d = s.replace(/\D/g, '')
  if (!d) return s
  if (d.startsWith('55') && d.length >= 12) return `+${d}`
  if (d.length >= 10 && d.length <= 11) return `+55${d}`
  return s
}
