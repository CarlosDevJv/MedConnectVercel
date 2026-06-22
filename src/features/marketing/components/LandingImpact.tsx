export function LandingImpact() {
  return (
    <section aria-labelledby="impact-heading" className="bg-[var(--color-muted)]/50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2
          id="impact-heading"
          className="max-w-3xl font-display text-3xl font-semibold tracking-tight text-[var(--color-foreground)] sm:text-4xl"
        >
          Impacto <span className="text-[var(--color-accent-ink)]">mensurável</span> na sua operação.
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-[var(--color-muted-foreground)]">
          Cada clínica mede resultado de modo diferente — estes cenários são ilustrativos para conversa com sua equipe; valide
          sempre com dados reais.
        </p>

        <div className="mt-14 grid gap-8 md:grid-cols-2">
          <figure className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 shadow-[var(--shadow-card)]">
            <figcaption className="text-sm font-semibold text-[var(--color-foreground)]">Clínica Exemplo</figcaption>
            <p className="mt-8 text-6xl font-bold tracking-tight text-[var(--color-accent-solid)] sm:text-7xl">25%</p>
            <p className="mt-6 text-[15px] leading-relaxed text-[var(--color-muted-foreground)]">
              Número ilustrativo de ganho de eficiência após unificar agenda e comunicações rastreadas num primeiro ciclo de
              adoção — valide sempre com seus dados.
            </p>
          </figure>
          <figure className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 shadow-[var(--shadow-card)] ring-2 ring-[var(--color-accent-soft)]">
            <figcaption className="text-sm font-semibold text-[var(--color-foreground)]">Clínica Médica ABC</figcaption>
            <p className="mt-8 text-6xl font-bold tracking-tight text-[var(--color-accent-ink)] sm:text-7xl">40%</p>
            <p className="mt-6 text-[15px] leading-relaxed text-[var(--color-muted-foreground)]">
              Cenário fictício combinando multi unidade relatórios e treinamento contínuo — apenas referência narrativa para
              apresentações comerciais.
            </p>
          </figure>
        </div>
      </div>
    </section>
  )
}
