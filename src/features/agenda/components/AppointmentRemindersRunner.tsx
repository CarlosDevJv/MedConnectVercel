import * as React from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { useOptionalInAppNotifications } from '@/app/notifications/InAppNotificationsContext'
import { isSmsServiceDisabled, sendSms } from '@/features/communications/api'
import { toE164Preferred } from '@/features/communications/utils/phone'
import { updateAppointment } from '@/features/agenda/api'
import { useAppointmentsQuery } from '@/features/agenda/hooks'
import type { EnrichedAppointment } from '@/features/agenda/types'
import { useListDoctors } from '@/features/doctors/hooks'
import { batchPatientContact } from '@/features/patients/api'
import { stripNonDigits } from '@/features/patients/utils/cpf'

const WINDOW_MIN_MS = 22 * 60 * 60 * 1000
const WINDOW_MAX_MS = 26 * 60 * 60 * 1000

function shouldSendSmsPreferred(pref: string | null | undefined): boolean {
  if (!pref) return true
  return pref === 'sms' || pref === 'phone' || pref === 'whatsapp'
}

/**
 * Enquanto o app estiver aberto, verifica agendamentos e dispara SMS ~24h antes (uma vez),
 * respeitando `reminder_enabled` e colunas da migração.
 */
export function AppointmentRemindersRunner() {
  const qc = useQueryClient()
  const notifications = useOptionalInAppNotifications()
  const doctorsQuery = useListDoctors({ active: true, pageSize: 300 })
  const doctorIds = React.useMemo(
    () => doctorsQuery.data?.items.map((d) => d.id) ?? [],
    [doctorsQuery.data?.items]
  )

  const from = React.useMemo(() => new Date().toISOString(), [])
  const to = React.useMemo(() => new Date(Date.now() + 52 * 60 * 60 * 1000).toISOString(), [])

  const apptsQuery = useAppointmentsQuery(
    { doctorIds, scheduledFrom: from, scheduledTo: to },
    doctorIds.length > 0
  )

  const listRef = React.useRef<EnrichedAppointment[] | undefined>(undefined)
  React.useEffect(() => {
    listRef.current = apptsQuery.data
  }, [apptsQuery.data])

  const sentRef = React.useRef<Set<string>>(new Set())
  const inFlightRef = React.useRef<Set<string>>(new Set())

  React.useEffect(() => {
    if (!notifications) return
    const { push } = notifications

    async function sweep() {
      const list = listRef.current ?? []
      await runSweep({
        appointments: list,
        push,
        sent: sentRef.current,
        inFlight: inFlightRef.current,
        onPersist: () => {
          void qc.invalidateQueries({ queryKey: ['agenda', 'appointments'] })
        },
      })
    }

    void sweep()
    const timer = window.setInterval(() => void sweep(), 120_000)
    return () => window.clearInterval(timer)
  }, [notifications, qc, apptsQuery.dataUpdatedAt])

  return null
}

async function runSweep(opts: {
  appointments: EnrichedAppointment[]
  push: (n: { title: string; body?: string }) => void
  sent: Set<string>
  inFlight: Set<string>
  onPersist: () => void
}) {
  const now = Date.now()
  const candidates = opts.appointments.filter((a) => {
    if (opts.sent.has(a.id) || opts.inFlight.has(a.id)) return false
    if (a.status === 'cancelled' || a.status === 'completed' || a.status === 'no_show') return false
    if (a.reminder_enabled === false) return false
    if (a.last_reminder_sent_at) return false
    const t = new Date(a.scheduled_at).getTime()
    const delta = t - now
    return delta > WINDOW_MIN_MS && delta < WINDOW_MAX_MS
  })

  if (!candidates.length) return

  let contacts: Record<string, { phone_mobile: string; preferred_contact: string | null }> = {}
  try {
    contacts = await batchPatientContact(candidates.map((c) => c.patient_id))
  } catch {
    return
  }

  for (const a of candidates) {
    const c = contacts[a.patient_id]
    if (!c || !shouldSendSmsPreferred(c.preferred_contact)) continue
    const digits = stripNonDigits(c.phone_mobile)
    if (digits.length < 10) continue

    opts.inFlight.add(a.id)
    const who = a.patient_name ?? 'Paciente'
    const when = new Date(a.scheduled_at).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
    const body = `Olá ${who}, lembrete automático: consulta amanhã (${when}). MediConnect.`

    try {
      await sendSms({
        phone_number: toE164Preferred(c.phone_mobile),
        patient_id: a.patient_id,
        message: body.slice(0, 1000),
      })
      await updateAppointment(a.id, { last_reminder_sent_at: new Date().toISOString() })
      opts.sent.add(a.id)
      opts.push({
        title: 'Lembrete SMS enviado',
        body: `${who} — ${when}`,
      })
      opts.onPersist()
    } catch (err) {
      if (!isSmsServiceDisabled(err)) {
        console.error(err)
      }
    } finally {
      opts.inFlight.delete(a.id)
    }
  }
}
