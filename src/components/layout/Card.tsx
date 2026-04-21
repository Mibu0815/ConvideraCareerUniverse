import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
  /**
   * 'default' — white surface with subtle border
   * 'subtle'  — soft off-white (for nested cards)
   * 'dark'    — dark charcoal (for admin/statement emphasis)
   * 'accent'  — soft brand-blue tint (for AI/focus elements)
   */
  variant?: 'default' | 'subtle' | 'dark' | 'accent'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  interactive?: boolean
}

const VARIANT_CLASS: Record<NonNullable<CardProps['variant']>, string> = {
  default: 'bg-surface border border-border',
  subtle:  'bg-surface-soft border border-transparent',
  dark:    'bg-canvas-dark text-text-inverse border border-transparent',
  accent:  'bg-brand-blue-subtle border border-transparent',
}

const PADDING_CLASS: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function Card({
  children,
  className,
  variant = 'default',
  padding = 'md',
  interactive,
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg',
        VARIANT_CLASS[variant],
        PADDING_CLASS[padding],
        interactive && 'transition-shadow duration-base hover:shadow-md cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  )
}
