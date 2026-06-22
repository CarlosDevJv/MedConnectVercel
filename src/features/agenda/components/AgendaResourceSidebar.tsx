import { Stethoscope } from 'lucide-react'

import { Checkbox } from '@/components/ui/checkbox'
import type { Doctor } from '@/features/doctors/types'
import { cn } from '@/lib/cn'

export interface AgendaResourceSidebarProps {
  doctors: Doctor[]
  selectedIds: Set<string>
  onToggle: (doctorId: string, checked: boolean) => void
  onSelectAll: () => void
  onClearAll: () => void
  lockedDoctorId?: string
}

export function AgendaResourceSidebar({
  doctors,
  selectedIds,
  onToggle,
  onSelectAll,
  onClearAll,
  lockedDoctorId,
}: AgendaResourceSidebarProps) {
  const activeDoctors = doctors.filter((d) => d.active !== false)

  return (
    <aside className="w-full shrink-0 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 lg:w-[240px]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-display text-sm font-semibold text-[var(--color-foreground)]">
          Agendas
        </h2>
        {!lockedDoctorId && (
          <div className="flex gap-2 text-[10px]">
            <button
              type="button"
              className="font-medium text-[var(--color-accent)] hover:underline"
              onClick={onSelectAll}
            >
              Todas
            </button>
            <span className="text-[var(--color-border)]">|</span>
            <button
              type="button"
              className="font-medium text-[var(--color-muted-foreground)] hover:underline"
              onClick={onClearAll}
            >
              Nenhuma
            </button>
          </div>
        )}
      </div>
      <ul className="flex max-h-[360px] flex-col gap-2 overflow-y-auto lg:max-h-[calc(100vh-280px)]">
        {activeDoctors.map((d) => {
          const checked = selectedIds.has(d.id)
          return (
            <li key={d.id}>
              <label
                className={cn(
                  'flex cursor-pointer items-start gap-2 rounded-lg border border-transparent p-2 transition-colors hover:bg-[var(--color-muted)]/50',
                  checked && 'border-[var(--color-accent-soft)] bg-[var(--color-accent-soft)]/30',
                  lockedDoctorId && 'cursor-default opacity-90'
                )}
              >
                <Checkbox
                  checked={checked}
                  disabled={!!lockedDoctorId}
                  onCheckedChange={(v) => onToggle(d.id, v === true)}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Stethoscope className="h-3.5 w-3.5 shrink-0 text-[var(--color-accent)]" />
                    <span className="truncate text-[13px] font-medium text-[var(--color-foreground)]">
                      {d.full_name}
                    </span>
                  </div>
                  {d.specialty ? (
                    <span className="mt-0.5 block truncate text-[11px] text-[var(--color-muted-foreground)]">
                      {d.specialty}
                    </span>
                  ) : (
                    <span className="mt-0.5 block text-[11px] text-[var(--color-muted-foreground)]">
                      Clínica geral
                    </span>
                  )}
                </div>
              </label>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
