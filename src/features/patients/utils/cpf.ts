export function stripNonDigits(value: string): string {
  return value.replace(/\D+/g, '')
}

export function formatCpf(value: string): string {
  const digits = stripNonDigits(value).slice(0, 11)
  const parts: string[] = []
  if (digits.length > 0) parts.push(digits.slice(0, 3))
  if (digits.length > 3) parts.push('.')
  if (digits.length > 3) parts.push(digits.slice(3, 6))
  if (digits.length > 6) parts.push('.')
  if (digits.length > 6) parts.push(digits.slice(6, 9))
  if (digits.length > 9) parts.push('-')
  if (digits.length > 9) parts.push(digits.slice(9, 11))
  return parts.join('')
}

export function isValidCpf(rawValue: string | undefined | null): boolean {
  if (!rawValue) return false
  const cpf = stripNonDigits(rawValue)
  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false

  const calcDigit = (slice: string, factor: number): number => {
    let sum = 0
    for (let i = 0; i < slice.length; i++) {
      sum += parseInt(slice.charAt(i), 10) * (factor - i)
    }
    const mod = (sum * 10) % 11
    return mod === 10 ? 0 : mod
  }

  const d1 = calcDigit(cpf.slice(0, 9), 10)
  if (d1 !== parseInt(cpf.charAt(9), 10)) return false

  const d2 = calcDigit(cpf.slice(0, 10), 11)
  if (d2 !== parseInt(cpf.charAt(10), 10)) return false

  return true
}
