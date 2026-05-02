/**
 * Prontuário / consultas clínicas — REST PostgREST.
 *
 * Auditoria (Apidog): a spec pública exportada não lista o OpenAPI completo de tabelas.
 * Recurso assumido: GET/POST/PATCH em `/rest/v1/clinical_consultations` (ajustar nome da
 * tabela em `api.ts` se o backend usar outro identificador).
 *
 * Mapeamento produto → colunas:
 * - Data da consulta → consultation_at
 * - Anamnese → anamnesis
 * - Exame físico → physical_exam
 * - Hipóteses diagnósticas → diagnostic_hypotheses
 * - Conduta médica → medical_conduct
 * - Prescrições → prescriptions
 * - Exames solicitados → requested_exams
 * - Retorno agendado → follow_up_at
 * - CID-10 → cid10
 * - Diagnósticos → diagnoses
 * - Evolução → evolution
 * - Anexos (arquivStorage) → fora do escopo até bucket/campo documentado; attachments_note como texto livre
 */

export interface ClinicalConsultation {
  id: string
  patient_id: string
  doctor_id: string | null
  consultation_at: string
  anamnesis: string | null
  physical_exam: string | null
  diagnostic_hypotheses: string | null
  medical_conduct: string | null
  prescriptions: string | null
  requested_exams: string | null
  follow_up_at: string | null
  cid10: string | null
  diagnoses: string | null
  evolution: string | null
  attachments_note: string | null
  created_at: string | null
  updated_at: string | null
  created_by: string | null
  updated_by: string | null
}

export interface ClinicalConsultationInput {
  patient_id: string
  doctor_id?: string | null
  consultation_at?: string
  anamnesis?: string | null
  physical_exam?: string | null
  diagnostic_hypotheses?: string | null
  medical_conduct?: string | null
  prescriptions?: string | null
  requested_exams?: string | null
  follow_up_at?: string | null
  cid10?: string | null
  diagnoses?: string | null
  evolution?: string | null
  attachments_note?: string | null
}

export interface ListClinicalConsultationsParams {
  patient_id: string
  page?: number
  pageSize?: number
  order?: string
}

export interface ClinicalConsultationList {
  items: ClinicalConsultation[]
  total: number
}

export interface EnrichedClinicalConsultation extends ClinicalConsultation {
  doctor_name?: string
}
