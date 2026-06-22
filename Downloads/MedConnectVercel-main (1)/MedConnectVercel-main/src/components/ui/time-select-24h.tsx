import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/cn'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = Array.from({ length: 60 }, (_, i) => i)

function parseHHMM(v: string): { h: number; m: number } {
  const m = v?.match(/^(\d{1,2}):(\d{2})/)
  if (!m) return { h: 8, m: 0 }
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10) || 0))
  const min = Math.min(59, Math.max(0, parseInt(m[2], 10) || 0))
  return { h, m: min }
}

export interface TimeSelect24hProps {
  id?: string
  value: string
  onChange: (hhMm: string) => void
  disabled?: boolean
  className?: string
}

/**
 * Horário **sempre em 24 h** (dois selects). Evita o relógio AM/PM do `<input type="time">` no Windows/Chrome em locale US.
 */
export function TimeSelect24h({ id, value, onChange, disabled, className }: TimeSelect24hProps) {
  const { h, m } = parseHHMM(value)
  const hourCtlId = id ? `${id}-hour` : undefined
  const minuteCtlId = id ? `${id}-minute` : undefined

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      <Select
        disabled={disabled}
        value={String(h)}
        onValueChange={(vh) =>
          onChange(`${String(Number(vh)).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
        }
      >
        <SelectTrigger id={hourCtlId} className="w-[4.85rem]" aria-label="Hora de 0 a 23">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-48">
          {HOURS.map((hour) => (
            <SelectItem key={hour} value={String(hour)}>
              {String(hour).padStart(2, '0')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-sm text-[var(--color-muted-foreground)]" aria-hidden>
        :
      </span>
      <Select
        disabled={disabled}
        value={String(m)}
        onValueChange={(vm) =>
          onChange(`${String(h).padStart(2, '0')}:${String(Number(vm)).padStart(2, '0')}`)
        }
      >
        <SelectTrigger id={minuteCtlId} className="w-[4.85rem]" aria-label="Minuto de 0 a 59">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-48">
          {MINUTES.map((minute) => (
            <SelectItem key={minute} value={String(minute)}>
              {String(minute).padStart(2, '0')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
