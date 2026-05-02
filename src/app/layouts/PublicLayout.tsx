import { Outlet } from 'react-router-dom'

import { DotPattern } from '@/features/auth/components/DotPattern'

export function PublicLayout() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-[var(--color-background)]">
      <DotPattern />
      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 py-12">
        <Outlet />
      </div>
    </div>
  )
}
