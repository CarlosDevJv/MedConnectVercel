import { stripNonDigits } from '@/features/patients/utils/cpf'

/**
 * Format an RG. RG format varies by state, but the most common visual format is
 * `99.999.999-9`. We accept up to 10 alphanumerics (some states use a letter at the end),
 * but the mask only applies to digits — letters are kept untouched at the end.
 */
export function formatRg(value: string): string {
  if (!value) return ''
  const upper = value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 10)
  const digits = upper.replace(/[^0-9]/g, '').slice(0, 9)
  const tail = upper.slice(digits.length, digits.length + 1).replace(/[^A-Z]/g, '')

  let masked = ''
  if (digits.length > 0) masked += digits.slice(0, 2)
  if (digits.length > 2) masked += '.' + digits.slice(2, 5)
  if (digits.length > 5) masked += '.' + digits.slice(5, 8)
  if (digits.length > 8) masked += '-' + digits.slice(8, 9)

  if (tail && digits.length === 9) masked += tail
  return masked
}

export function rawRg(value: string | null | undefined): string {
  if (!value) return ''
  return value.toUpperCase().replace(/[^0-9A-Z]/g, '')
}

export function rgDigitsOnly(value: string | null | undefined): string {
  return stripNonDigits(value ?? '')
}
