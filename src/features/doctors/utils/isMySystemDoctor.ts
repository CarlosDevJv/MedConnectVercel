import type { Doctor } from '@/features/doctors/types'

/**
 * Determina se um médico pertence ao nosso sistema (nosso projeto/consultório).
 * Como a base Supabase é compartilhada, filtramos usando:
 * 1. O caractere invisível Zero-Width Space (\u200B) gravado no full_name do médico.
 * 2. IDs gravados localmente no localStorage ('medconect_my_doctors').
 * 3. Domínios de e-mail do nosso sistema (@medconect.com, @medconect.com.br, @clinica.com, @carlosdevjv.com).
 * 4. Se o ID do médico coincidir com o ID logado na sessão.
 */
export function isMySystemDoctor(doctor: Doctor, loggedDoctorId?: string | null): boolean {
  if (!doctor) return false

  // 1. Caractere invisível no nome (\u200B) persistido no banco
  if (doctor.full_name && doctor.full_name.includes('\u200B')) {
    return true
  }

  // 2. ID logado
  if (loggedDoctorId && doctor.id === loggedDoctorId) return true

  // 3. Domínios de email do nosso sistema ou emails de teste do vercel
  if (doctor.email) {
    const emailLower = doctor.email.toLowerCase()
    if (
      emailLower.endsWith('@medconect.com') ||
      emailLower.endsWith('@medconect.com.br') ||
      emailLower.endsWith('@clinica.com') ||
      emailLower.endsWith('@carlosdevjv.com') ||
      emailLower.includes('vercel') ||
      emailLower.includes('antigravity')
    ) {
      return true
    }
  }

  // 4. IDs salvos no localStorage do navegador local
  try {
    const stored = localStorage.getItem('medconect_my_doctors')
    if (stored) {
      const ids = JSON.parse(stored)
      if (Array.isArray(ids) && ids.includes(doctor.id)) {
        return true
      }
    }
  } catch {
    // ignore
  }

  return false
}

/**
 * Limpa o caractere invisível \u200B do nome completo para exibição na tela.
 */
export function cleanDoctorName(name: string): string {
  if (!name) return ''
  return name.replace(/\u200B/g, '')
}
