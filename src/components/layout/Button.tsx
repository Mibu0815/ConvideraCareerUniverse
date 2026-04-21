import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  iconLeft?: ReactNode
  iconRight?: ReactNode
  fullWidth?: boolean
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-brand-blue text-white hover:bg-brand-blue-hover ' +
    'active:bg-brand-blue-hover focus-visible:ring-brand-blue/40',
  secondary:
    'bg-surface text-text-primary border border-border ' +
    'hover:bg-surface-soft hover:border-border-strong ' +
    'focus-visible:ring-text-primary/20',
  ghost:
    'bg-transparent text-text-primary ' +
    'hover:bg-surface-soft focus-visible:ring-text-primary/20',
  danger:
    'bg-status-danger-soft text-status-danger border border-transparent ' +
    'hover:bg-status-danger hover:text-white ' +
    'focus-visible:ring-status-danger/40',
  dark:
    'bg-canvas-dark text-text-inverse hover:bg-canvas-dark/90 ' +
    'focus-visible:ring-canvas-dark/40',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-body-s gap-1.5 rounded-md',
  md: 'h-10 px-4 text-body gap-2 rounded-md',
  lg: 'h-12 px-6 text-body gap-2.5 rounded-md',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      iconLeft,
      iconRight,
      fullWidth,
      loading,
      className,
      children,
      disabled,
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium',
          'transition-colors duration-base ease-out-expo',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className,
        )}
        {...rest}
      >
        {loading ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          iconLeft
        )}
        {children}
        {!loading && iconRight}
      </button>
    )
  },
)
