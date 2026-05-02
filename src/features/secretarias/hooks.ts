import { useMutation } from '@tanstack/react-query'

import { inviteSecretaria, type InviteSecretariaPayload } from '@/features/secretarias/api'

export function useInviteSecretaria() {
  return useMutation({
    mutationFn: (payload: InviteSecretariaPayload) => inviteSecretaria(payload),
  })
}
