import { cn } from '@/lib/cn'

interface MediConnectLogoMarkProps {
  className?: string
  title?: string
}

/**
 * Marca MediConnect — hélice + circuito + núcleo (chip): inspiração biotech/digital,
 * simplificada para leitura em tamanhos pequenos e cores da identidade (--color-accent*).
 */
export function MediConnectLogoMark({ className, title }: MediConnectLogoMarkProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      {/* Moléculas laterais sutis */}
      <g opacity="0.55" stroke="var(--color-accent-ink)" strokeWidth="1.1" strokeLinecap="round">
        <circle cx="5.5" cy="14" r="2.2" fill="var(--color-accent-soft)" stroke="none" />
        <circle cx="4" cy="20" r="1.3" fill="none" />
        <path d="M5.5 16.2 L4 18.7" />
        <circle cx="34.5" cy="14" r="2.2" fill="var(--color-accent-soft)" stroke="none" />
        <circle cx="36" cy="20" r="1.3" fill="none" />
        <path d="M34.5 16.2 L36 18.7" />
      </g>
      {/* Trilhas tipo PCB */}
      <g stroke="var(--color-accent-ink)" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" opacity="0.28">
        <path d="M8 30h6l3-4 3-2h4" />
        <path d="M32 30h-6l-3-4-3-2h-4" />
        <circle cx="10" cy="29.5" r="0.9" fill="var(--color-accent-ink)" stroke="none" />
        <circle cx="30" cy="29.5" r="0.9" fill="var(--color-accent-ink)" stroke="none" />
      </g>
      {/* Hélice — duas fitas que se cruzam */}
      <path
        d="M20 3.5C12.5 8.5 11 16.5 20 20c9 3.5 7.5 11.5 0 16.5"
        stroke="var(--color-accent-solid)"
        strokeWidth="2.05"
        strokeLinecap="round"
      />
      <path
        d="M20 3.5C27.5 8.5 29 16.5 20 20c-9 3.5-7.5 11.5 0 16.5"
        stroke="var(--color-accent)"
        strokeWidth="2.05"
        strokeLinecap="round"
      />
      {/* Pontes entre fitas */}
      <g stroke="var(--color-accent-ink)" strokeWidth="1.35" strokeLinecap="round" opacity="0.42">
        <path d="M14.8 11.2h10.4" />
        <path d="M16.2 16.8h7.6" />
        <path d="M12.8 26.8h14.4" />
        <path d="M14.8 31.5h10.4" />
      </g>
      {/* Núcleo — chip dentro do vértice da hélice */}
      <rect
        x="15.85"
        y="15.85"
        width="8.3"
        height="8.3"
        rx="1.85"
        fill="var(--color-accent-ink)"
      />
      <rect
        x="17.4"
        y="17.4"
        width="5.2"
        height="5.2"
        rx="0.9"
        fill="none"
        stroke="var(--color-surface)"
        strokeWidth="0.55"
        opacity="0.35"
      />
      {/* “pinos” do chip */}
      <g fill="var(--color-accent-soft)" opacity={0.95}>
        <rect x="19.85" y="14.95" width="0.95" height="1.05" rx="0.2" />
        <rect x="19.85" y="24" width="0.95" height="1.05" rx="0.2" />
        <rect x="14.75" y="19.52" width="1.05" height="0.95" rx="0.2" ry="0.2" />
        <rect x="24.2" y="19.52" width="1.05" height="0.95" rx="0.2" ry="0.2" />
      </g>
    </svg>
  )
}
