import { z } from 'zod'

import { REPORT_STATUSES } from '@/features/reports/types'

export const reportStatusSchema = z.enum(REPORT_STATUSES)

export const reportInputSchema = z.object({
  patient_id: z.string().uuid(),
  status: reportStatusSchema.optional().default('draft'),
  exam: z.string().max(2000).nullable().optional(),
  requested_by: z.string().max(500).nullable().optional(),
  cid_code: z.string().max(32).nullable().optional(),
  diagnosis: z.string().max(10000).nullable().optional(),
  conclusion: z.string().max(10000).nullable().optional(),
  content_html: z.string().max(500_000).nullable().optional(),
  content_json: z.record(z.string(), z.unknown()).nullable().optional(),
  hide_date: z.boolean().nullable().optional(),
  hide_signature: z.boolean().nullable().optional(),
  due_at: z.string().max(40).nullable().optional(),
})

export type ReportInputForm = z.infer<typeof reportInputSchema>
