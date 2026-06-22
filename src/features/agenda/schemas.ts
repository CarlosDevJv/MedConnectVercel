import { z } from 'zod'

import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPES,
  DOCTOR_EXCEPTION_KINDS,
} from '@/features/agenda/types'

export const appointmentStatusSchema = z.enum(APPOINTMENT_STATUSES)
export const appointmentTypeSchema = z.enum(APPOINTMENT_TYPES)

export const createAppointmentFormSchema = z.object({
  doctor_id: z.string().uuid('Selecione o profissional'),
  patient_id: z.string().uuid('Selecione o paciente'),
  scheduled_at: z.string().min(1, 'Data e horário obrigatórios'),
  status: appointmentStatusSchema.optional().default('requested'),
})

export type CreateAppointmentFormValues = z.infer<typeof createAppointmentFormSchema>

export const createBlockExceptionSchema = z.object({
  doctor_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  kind: z.enum(DOCTOR_EXCEPTION_KINDS).default('bloqueio'),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  reason: z.string().max(500).optional(),
  created_by: z.string().uuid(),
})

export type CreateBlockExceptionValues = z.infer<typeof createBlockExceptionSchema>
