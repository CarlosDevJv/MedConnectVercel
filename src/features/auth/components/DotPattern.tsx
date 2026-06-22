import { cn } from '@/lib/cn'

interface DotPatternProps {
  className?: string
}

export function DotPattern({ className }: DotPatternProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 dot-pattern opacity-[0.55]',
        '[mask-image:radial-gradient(ellipse_at_center,black_55%,transparent_85%)]',
        className
      )}
    />
  )
}
