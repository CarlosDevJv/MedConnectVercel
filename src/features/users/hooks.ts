import { useMutation } from '@tanstack/react-query'

import {
  createUserWithPassword,
  type CreateUserWithPasswordPayload,
} from '@/features/users/api'

export function useCreateUserWithPassword() {
  return useMutation({
    mutationFn: (payload: CreateUserWithPasswordPayload) => createUserWithPassword(payload),
  })
}
