import type { ReactNode } from 'react'
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type StatusType = 'success' | 'warning' | 'danger' | 'info'
type StatusVariant = 'pill' | 'inline' | 'banner'

interface StatusProps {
  type: StatusType
  children: ReactNode
  variant?: StatusVariant
  className?: string
}

const config: Record<StatusType, { icon: LucideIcon; classes: string }> = {
  success: {
    icon: CheckCircle2,
    classes: 'bg-status-success-soft text-status-success',
  },
  warning: {
    icon: AlertTriangle,
    classes: 'bg-status-warning-soft text-status-warning',
  },
  danger: {
    icon: XCircle,
    classes: 'bg-status-danger-soft text-status-danger',
  },
  info: {
    icon: Info,
    classes: 'bg-status-info-soft text-status-info',
  },
}

const INLINE_TEXT_CLASS: Record<StatusType, string> = {
  success: 'text-status-success',
  warning: 'text-status-warning',
  danger: 'text-status-danger',
  info: 'text-status-info',
}

export function Status({
  type,
  children,
  variant = 'pill',
  className,
}: StatusProps) {
  const { icon: Icon, classes } = config[type]

  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'flex items-start gap-3 p-4 rounded-lg',
          classes,
          className,
        )}
      >
        <Icon className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="flex-1 text-body-s">{children}</div>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 text-body-s',
          INLINE_TEXT_CLASS[type],
          className,
        )}
      >
        <Icon className="h-4 w-4" />
        {children}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-body-s font-medium',
        classes,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </span>
  )
}
