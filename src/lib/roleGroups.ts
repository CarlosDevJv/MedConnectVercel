import type { UserRole } from '@/types/user'

/** Cadastro / edição de pacientes — sem médico. */
export const PATIENT_FORM_ROLES: UserRole[] = ['admin', 'gestor', 'secretaria']

/** Leitura de cadastro e prontuário (inclui médico). */
export const PATIENT_READ_ROLES: UserRole[] = [...PATIENT_FORM_ROLES, 'medico']

export const AGENDA_ROLES: UserRole[] = ['admin', 'gestor', 'medico', 'secretaria']

export const DOCTOR_MANAGEMENT_ROLES: UserRole[] = ['admin', 'gestor']

export const SECRETARIA_MANAGEMENT_ROLES: UserRole[] = ['admin', 'gestor']

export const REPORT_ROLES: UserRole[] = ['admin', 'gestor', 'medico']

export const ANALYTICS_ROLES: UserRole[] = ['admin', 'gestor']

export const COMMUNICATIONS_ROLES: UserRole[] = ['admin', 'gestor', 'medico', 'secretaria']

/** Itens de navegação visíveis a qualquer sessão autenticada até roles carregarem. */
export const SIDEBAR_DASHBOARD_FALLBACK_ROLES: UserRole[] = [
  'admin',
  'gestor',
  'medico',
  'secretaria',
  'paciente',
  'user',
]
