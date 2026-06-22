import { stripNonDigits } from '@/features/patients/utils/cpf'

/**
 * Format a CEP as `00000-000`. Strips non-digits.
 */
export function formatCep(value: string): string {
  const digits = stripNonDigits(value).slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export function isValidCep(value: string | null | undefined): boolean {
  if (!value) return false
  return /^\d{8}$/.test(stripNonDigits(value))
}
