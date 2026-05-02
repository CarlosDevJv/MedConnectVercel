/**
 * Format a numeric input string allowing a Brazilian decimal separator (comma).
 * Accepts free-form digits and at most one comma. Returns the masked value.
 *
 * Examples:
 *  - "abc 65,5"     → "65,5"
 *  - "1.68"         → "1,68"
 *  - "65,,5"        → "65,5"
 */
export function formatDecimal(value: string, maxDecimals = 2): string {
  if (!value) return ''
  const cleaned = value
    .replace(/\./g, ',')
    .replace(/[^0-9,]/g, '')

  const firstComma = cleaned.indexOf(',')
  if (firstComma === -1) return cleaned

  const intPart = cleaned.slice(0, firstComma)
  const decPart = cleaned.slice(firstComma + 1).replace(/,/g, '').slice(0, maxDecimals)
  return decPart.length > 0 ? `${intPart},${decPart}` : `${intPart},`
}

/** Convert a Brazilian decimal string (`65,5`) to a JS number (`65.5`). */
export function parseDecimal(value: string | null | undefined): number | null {
  if (value === null || value === undefined) return null
  const trimmed = String(value).trim()
  if (!trimmed) return null
  const normalized = trimmed.replace(/\./g, '').replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

/** Format a JS number as a Brazilian decimal string. */
export function numberToDecimalString(value: number | null | undefined, maxDecimals = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return ''
  return value
    .toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxDecimals,
    })
    .replace(/\u00A0/g, '')
}

/** Calculate Body Mass Index = weight(kg) / height(m)². Returns 2-decimal number or null. */
export function calculateBmi(
  weightKg: number | null | undefined,
  heightM: number | null | undefined
): number | null {
  if (!weightKg || !heightM) return null
  if (weightKg <= 0 || heightM <= 0) return null
  const bmi = weightKg / (heightM * heightM)
  if (!Number.isFinite(bmi)) return null
  return Math.round(bmi * 100) / 100
}
