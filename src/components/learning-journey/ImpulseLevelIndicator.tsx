// src/components/learning-journey/ImpulseLevelIndicator.tsx
"use client"

import { cn } from "@/lib/utils"
import { getImpulseLevel, IMPULSE_CONFIG } from "@/lib/impulse-levels"

interface Props {
  requiredLevel: number
  compact?: boolean
}

const levelColors = {
  L1_AWARENESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  L2_GUIDED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  L3_INDEPENDENT: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  L4_EXPERT: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
}

export function ImpulseLevelIndicator({ requiredLevel, compact = false }: Props) {
  const level = getImpulseLevel(requiredLevel)
  const config = IMPULSE_CONFIG[level]
  const colorClass = levelColors[level]

  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium",
          colorClass
        )}
      >
        {level.replace("_", " ")}
      </span>
    )
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
        colorClass
      )}
    >
      <span>{level.replace("_", " ")}</span>
      <span className="opacity-70">• {config.label}</span>
    </div>
  )
}
