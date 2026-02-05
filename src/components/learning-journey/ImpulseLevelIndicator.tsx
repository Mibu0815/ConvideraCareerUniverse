// src/components/learning-journey/ImpulseLevelIndicator.tsx
"use client"

import { cn } from "@/lib/utils"
import { getImpulseLevel, IMPULSE_CONFIG } from "@/lib/impulse-levels"

interface Props {
  requiredLevel: number
  compact?: boolean
}

// User-friendly level names (self-explanatory)
const LEVEL_NAMES: Record<string, { short: string; full: string; color: string }> = {
  L1_AWARENESS: {
    short: "Grundlagen",
    full: "Grundlagen aufbauen",
    color: "bg-sky-100 text-sky-700 border-sky-200"
  },
  L2_GUIDED: {
    short: "Anwenden",
    full: "Mit Unterstützung anwenden",
    color: "bg-amber-100 text-amber-700 border-amber-200"
  },
  L3_INDEPENDENT: {
    short: "Selbstständig",
    full: "Selbstständig umsetzen",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200"
  },
  L4_EXPERT: {
    short: "Experte",
    full: "Wissen weitergeben",
    color: "bg-violet-100 text-violet-700 border-violet-200"
  }
}

export function ImpulseLevelIndicator({ requiredLevel, compact = false }: Props) {
  const level = getImpulseLevel(requiredLevel)
  const config = LEVEL_NAMES[level]

  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
          config.color
        )}
      >
        {config.short}
      </span>
    )
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        config.color
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
      <span>{config.full}</span>
    </div>
  )
}

// Export for use in other components
export function getLevelLabel(targetLevel: number): string {
  const level = getImpulseLevel(targetLevel)
  return LEVEL_NAMES[level]?.full || `Level ${targetLevel}`
}
