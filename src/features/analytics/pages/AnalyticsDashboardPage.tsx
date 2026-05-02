import {
  Calendar,
  ChartBar,
  Coins,
  Percent,
  Smile,
  Stethoscope,
  UserRound,
} from 'lucide-react'
import * as React from 'react'

import { StatCard } from '@/app/components/StatCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useExecutiveMetrics } from '@/features/analytics/hooks'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function startOfDayYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function ymdToIsoEnd(ymd: string): string {
  const d = new Date(`${ymd}T23:59:59.999`)
  return d.toISOString()
}

function ymdToIsoStart(ymd: string): string {
  const d = new Date(`${ymd}T00:00:00`)
  return d.toISOString()
}

export function AnalyticsDashboardPage() {
  const today = new Date()
  const defFrom = new Date(today)
  defFrom.setDate(defFrom.getDate() - 29)

  const [draftFrom, setDraftFrom] = React.useState(startOfDayYmd(defFrom))
  const [draftTo, setDraftTo] = React.useState(startOfDayYmd(today))
  const [applied, setApplied] = React.useState({
    from: ymdToIsoStart(startOfDayYmd(defFrom)),
    to: ymdToIsoEnd(startOfDayYmd(today)),
  })

  const query = useExecutiveMetrics(applied)

  function applyPeriod() {
    setApplied({
      from: ymdToIsoStart(draftFrom),
      to: ymdToIsoEnd(draftTo),
    })
  }

  const m = query.data
  const maxBar = Math.max(1, ...(m?.consultationsByDay.map((x) => x.value) ?? [1]))

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-8">
      <div
        role="status"
        className="rounded-[var(--radius-card)] border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950"
      >
        <strong className="font-semibold">Dados de demonstração.</strong> Indicadores são simulados no
        navegador; integração com API será adicionada quando os endpoints estiverem disponíveis no{' '}
        <a
          className="font-medium text-amber-900 underline-offset-2 hover:underline"
          href="https://do5wegrct3.apidog.io/"
          target="_blank"
          rel="noreferrer"
        >
          Apidog
        </a>
        .
      </div>

      <header className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Gestão
        </p>
        <h1 className="font-display text-2xl text-[var(--color-foreground)]">Indicadores e relatórios</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Visão executiva de atendimento, absenteísmo, desempenho e indicadores financeiros (simulado).
        </p>
      </header>

      <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div>
          <span className="mb-1.5 block text-xs font-medium text-[var(--color-muted-foreground)]">De</span>
          <Input type="date" value={draftFrom} onChange={(e) => setDraftFrom(e.target.value)} />
        </div>
        <div>
          <span className="mb-1.5 block text-xs font-medium text-[var(--color-muted-foreground)]">Até</span>
          <Input type="date" value={draftTo} onChange={(e) => setDraftTo(e.target.value)} />
        </div>
        <Button type="button" onClick={applyPeriod}>
          Aplicar período
        </Button>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Consultas realizadas (demo)"
          value={query.isLoading ? undefined : (m?.appointmentsCompleted ?? '—')}
          icon={Stethoscope}
          loading={query.isLoading}
        />
        <StatCard
          label="Agendadas no período (demo)"
          value={query.isLoading ? undefined : (m?.appointmentsScheduled ?? '—')}
          icon={Calendar}
          loading={query.isLoading}
        />
        <StatCard
          label="Taxa no-show (demo)"
          value={
            query.isLoading
              ? undefined
              : m
                ? `${m.noShowRatePercent}%`
                : '—'
          }
          icon={Percent}
          loading={query.isLoading}
        />
        <StatCard
          label="Faturamento BRL (demo)"
          value={
            query.isLoading
              ? undefined
              : m
                ? m.revenueBrl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                : '—'
          }
          icon={Coins}
          loading={query.isLoading}
        />
        <StatCard
          label="Satisfação média (demo)"
          value={query.isLoading ? undefined : (m?.satisfactionAvg ?? '—')}
          icon={Smile}
          loading={query.isLoading}
        />
      </section>

      {m ? (
        <>
          <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <h2 className="font-display text-lg text-[var(--color-foreground)]">Consultas por dia (demo)</h2>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">Amostra de até 14 dias no intervalo.</p>
            <div className="mt-6 flex h-40 items-end gap-1.5">
              {m.consultationsByDay.map((b) => (
                <div key={b.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full max-w-[40px] rounded-t-md bg-[var(--color-accent-soft)] transition-colors hover:bg-[var(--color-accent)]/35"
                    style={{ height: `${(b.value / maxBar) * 100}%`, minHeight: '8px' }}
                    title={`${b.label}: ${b.value}`}
                  />
                  <span className="truncate text-[10px] text-[var(--color-muted-foreground)]">{b.label}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <h2 className="font-display text-lg text-[var(--color-foreground)]">Faturamento mensal (demo)</h2>
              <div className="mt-4 space-y-3">
                {m.revenueByMonth.map((row) => (
                  <div key={row.month}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span>{row.month}</span>
                      <span className="text-[var(--color-muted-foreground)]">
                        {row.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--color-muted)]">
                      <div
                        className="h-full rounded-full bg-[var(--color-accent)]"
                        style={{
                          width: `${(row.value / Math.max(...m.revenueByMonth.map((x) => x.value), 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <h2 className="font-display text-lg text-[var(--color-foreground)]">Convênios (demo)</h2>
              <ul className="mt-4 space-y-2 text-sm">
                {m.insuranceShare.map((x) => (
                  <li key={x.name} className="flex justify-between gap-2">
                    <span>{x.name}</span>
                    <span className="text-[var(--color-muted-foreground)]">{x.percent}%</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
              <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-5 py-3">
                <UserRound className="h-4 w-4 text-[var(--color-accent)]" />
                <h2 className="font-display text-lg text-[var(--color-foreground)]">Pacientes mais atendidos</h2>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead className="text-right">Atendimentos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {m.topPatients.map((r) => (
                    <TableRow key={r.name}>
                      <TableCell>{r.name}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{r.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>

            <section className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
              <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-5 py-3">
                <ChartBar className="h-4 w-4 text-[var(--color-accent)]" />
                <h2 className="font-display text-lg text-[var(--color-foreground)]">Médicos mais produtivos</h2>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Médico</TableHead>
                    <TableHead className="text-right">Atendimentos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {m.topDoctors.map((r) => (
                    <TableRow key={r.name}>
                      <TableCell>{r.name}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{r.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>
          </div>
        </>
      ) : query.isError ? (
        <p className="text-sm text-[var(--color-destructive)]">Não foi possível carregar os indicadores.</p>
      ) : null}
    </div>
  )
}
