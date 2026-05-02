import { z } from 'zod'

/** Alinhado a ClinicalConsultationInput; patient_id obrigatório em todo PATCH como em reports. */
export const clinicalConsultationInputSchema = z.object({
  patient_id: z.string().uuid(),
  doctor_id: z.string().uuid().nullable().optional(),
  consultation_at: z.string().max(40).optional(),
  anamnesis: z.string().max(50_000).nullable().optional(),
  physical_exam: z.string().max(50_000).nullable().optional(),
  diagnostic_hypotheses: z.string().max(50_000).nullable().optional(),
  medical_conduct: z.string().max(50_000).nullable().optional(),
  prescriptions: z.string().max(50_000).nullable().optional(),
  requested_exams: z.string().max(50_000).nullable().optional(),
  follow_up_at: z.string().max(40).nullable().optional(),
  cid10: z.string().max(32).nullable().optional(),
  diagnoses: z.string().max(50_000).nullable().optional(),
  evolution: z.string().max(50_000).nullable().optional(),
  attachments_note: z.string().max(20_000).nullable().optional(),
})

export type ClinicalConsultationForm = z.infer<typeof clinicalConsultationInputSchema>
