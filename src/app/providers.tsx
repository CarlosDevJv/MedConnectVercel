import { QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'
import { Toaster } from 'sonner'

import { TooltipProvider } from '@/components/ui/tooltip'
import { InAppNotificationsProvider } from '@/app/notifications/InAppNotificationsContext'
import { AuthProvider } from '@/features/auth/store'
import { queryClient } from '@/lib/queryClient'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={150}>
        <AuthProvider>
          <InAppNotificationsProvider>
            {children}
            <Toaster
              position="top-right"
              closeButton
              theme="light"
              toastOptions={{
                classNames: {
                  toast:
                    'rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-md',
                  title: 'font-medium',
                  description: 'text-[var(--color-muted-foreground)]',
                },
              }}
            />
          </InAppNotificationsProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  )
}
