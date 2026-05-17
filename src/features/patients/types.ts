export const DOCUMENT_TYPES = ['CNH', 'Passaporte', 'RNE', 'CTPS', 'Outro'] as const
export type DocumentType = (typeof DOCUMENT_TYPES)[number]

export const SEX_OPTIONS = ['Masculino', 'Feminino', 'Outro', 'Não informar'] as const
export type Sex = (typeof SEX_OPTIONS)[number]

export const RACE_OPTIONS = [
  'Branca',
  'Preta',
  'Parda',
  'Amarela',
  'Indígena',
  'Não declarada',
] as const
export type Race = (typeof RACE_OPTIONS)[number]

export const MARITAL_STATUS_OPTIONS = [
  'Solteiro(a)',
  'Casado(a)',
  'Divorciado(a)',
  'Viúvo(a)',
  'União Estável',
  'Outro',
] as const
export type MaritalStatus = (typeof MARITAL_STATUS_OPTIONS)[number]

export const BLOOD_TYPE_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const
export type BloodType = (typeof BLOOD_TYPE_OPTIONS)[number]

export const PREFERRED_CONTACT_OPTIONS = ['phone', 'sms', 'email', 'whatsapp'] as const
export type PreferredContact = (typeof PREFERRED_CONTACT_OPTIONS)[number]

export const PREFERRED_CONTACT_LABELS: Record<PreferredContact, string> = {
  phone: 'Ligação',
  sms: 'SMS',
  email: 'E-mail',
  whatsapp: 'WhatsApp',
}

export interface Patient {
  id: string
  /** FK opcional para `auth.users` — populado por trigger/backfill no Supabase (portal paciente / RLS). */
  user_id?: string | null
  full_name: string
  social_name: string | null
  email: string
  cpf: string
  rg: string | null
  document_type: DocumentType | null
  document_number: string | null
  birth_date: string | null

  phone_mobile: string
  phone1: string | null
  phone2: string | null

  /** Requer coluna `preferred_contact` no Supabase */
  preferred_contact?: PreferredContact | null

  sex: Sex | null
  race: Race | null
  ethnicity: string | null
  nationality: string | null
  naturality: string | null
  profession: string | null
  marital_status: MaritalStatus | null

  mother_name: string | null
  mother_profession: string | null
  father_name: string | null
  father_profession: string | null
  guardian_name: string | null
  guardian_cpf: string | null
  spouse_name: string | null

  cep: string | null
  street: string | null
  number: string | null
  complement: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  reference: string | null

  blood_type: BloodType | null
  weight_kg: number | null
  height_m: number | null
  bmi: number | null
  notes: string | null

  legacy_code: string | null
  rn_in_insurance: boolean | null
  vip: boolean | null

  /** Opcionais até existirem colunas no Supabase em todos os ambientes. */
  insurance_company?: string | null
  insurance_plan?: string | null
  insurance_member_number?: string | null
  insurance_card_valid_until?: string | null

  allergies?: string | null
  medications_in_use?: string | null
  chronic_conditions?: string | null

  created_at: string
  updated_at: string | null
  created_by: string | null
}

export interface PatientList {
  items: Patient[]
  total: number
}

export interface ListPatientsParams {
  search?: string
  page?: number
  pageSize?: number
  order?: string
}
