import * as React from 'react'

import { useAuth } from '@/features/auth/useAuth'
import { useListDoctors } from '@/features/doctors/hooks'
import { canUseMultiDoctorAgenda } from '@/lib/roleGroups'

/**
 * Resolve o `doctor.id` da sessão atual (JWT/user-info ou correspondência por `user_id`).
 * Mesma regra usada na agenda para perfil médico sem multi-agenda.
 */
export function useResolvedDoctorId() {
  const { userInfo } = useAuth()
  const userId = userInfo?.user.id ?? ''
  const roles = userInfo?.roles ?? []
  const multiDoctorAgenda = canUseMultiDoctorAgenda(roles)
  const linkedDoctor = userInfo?.doctor as { id?: string } | null
  const linkedDoctorId = typeof linkedDoctor?.id === 'string' ? linkedDoctor.id : undefined

  const doctorsQuery = useListDoctors({ active: true, pageSize: 200, order: 'full_name.asc' })
  const doctorsList = React.useMemo(() => doctorsQuery.data?.items ?? [], [doctorsQuery.data?.items])

  const resolvedDoctorId = React.useMemo(() => {
    if (linkedDoctorId) return linkedDoctorId
    const byAuthUser = doctorsList.find((d) => d.user_id && d.user_id === userId)?.id
    if (byAuthUser) return byAuthUser
    const medicoSomenteListaUnica =
      roles.includes('medico') &&
      !multiDoctorAgenda &&
      doctorsQuery.isSuccess &&
      doctorsList.length === 1
    return medicoSomenteListaUnica ? doctorsList[0]?.id : undefined
  }, [linkedDoctorId, doctorsList, userId, roles, multiDoctorAgenda, doctorsQuery.isSuccess])

  const medicoSemVinculo =
    roles.includes('medico') && !multiDoctorAgenda && !resolvedDoctorId

  return { resolvedDoctorId, medicoSemVinculo, doctorsList }
}
