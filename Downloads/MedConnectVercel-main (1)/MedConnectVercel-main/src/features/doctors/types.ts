export interface Doctor {
  id: string
  user_id: string | null
  full_name: string
  email: string | null
  cpf: string | null
  crm: string
  crm_uf: string
  phone_mobile: string | null
  specialty: string | null
  birth_date: string | null
  active: boolean | null
  created_at: string
  updated_at: string | null
}

export interface DoctorList {
  items: Doctor[]
  total: number
}

export interface ListDoctorsParams {
  search?: string
  specialty?: string
  active?: boolean
  page?: number
  pageSize?: number
  order?: string
}
