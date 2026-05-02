import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[#2c2c30] active:bg-[#1f1f22] shadow-sm',
        outline:
          'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)] active:bg-[#ececef]',
        ghost: 'text-[var(--color-foreground)] hover:bg-[var(--color-muted)]',
        link: 'text-[var(--color-accent)] underline-offset-4 hover:underline px-0 h-auto',
        destructive:
          'bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] hover:bg-[#dc2626]',
      },
      size: {
        default: 'h-11 px-5 py-2',
        sm: 'h-9 px-4',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
)
