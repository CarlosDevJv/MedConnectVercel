import * as React from 'react'

export interface InAppNotificationItem {
  id: string
  title: string
  body?: string
  createdAt: number
}

type Ctx = {
  items: InAppNotificationItem[]
  push: (n: Omit<InAppNotificationItem, 'id' | 'createdAt'>) => void
  dismiss: (id: string) => void
  clear: () => void
}

const InAppNotificationsContext = React.createContext<Ctx | null>(null)

export function InAppNotificationsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<InAppNotificationItem[]>([])

  const push = React.useCallback((n: Omit<InAppNotificationItem, 'id' | 'createdAt'>) => {
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : String(Date.now())
    setItems((prev) => [{ ...n, id, createdAt: Date.now() }, ...prev].slice(0, 20))
  }, [])

  const dismiss = React.useCallback((id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const clear = React.useCallback(() => setItems([]), [])

  const value = React.useMemo(
    () => ({ items, push, dismiss, clear }),
    [items, push, dismiss, clear]
  )

  return <InAppNotificationsContext.Provider value={value}>{children}</InAppNotificationsContext.Provider>
}

export function useOptionalInAppNotifications() {
  return React.useContext(InAppNotificationsContext)
}
