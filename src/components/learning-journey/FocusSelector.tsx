// src/components/learning-journey/FocusSelector.tsx
"use client"

import { Target, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

interface FocusedItem {
  id: string
  Skill: {
    id: string
    title: string
  }
  targetLevel: number
  currentLevel: number
}

interface Props {
  focusedItems: FocusedItem[]
  maxFocus: number
}

export function FocusSelector({ focusedItems, maxFocus }: Props) {
  const slots = Array.from({ length: maxFocus }, (_, i) => focusedItems[i] || null)

  return (
    <div className="bg-card border rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Target className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">Dein Fokus</h3>
        <span className="text-xs text-muted-foreground">
          ({focusedItems.length}/{maxFocus} Skills)
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {slots.map((item, index) => (
          <div
            key={item?.id || `empty-${index}`}
            className={cn(
              "rounded-lg border-2 border-dashed p-3 min-h-[72px] flex items-center justify-center transition-all",
              item
                ? "border-primary/40 bg-primary/5"
                : "border-muted-foreground/20 bg-muted/30"
            )}
          >
            {item ? (
              <div className="text-center">
                <p className="text-sm font-medium line-clamp-2">
                  {item.Skill.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Level {item.currentLevel} → {item.targetLevel}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 text-muted-foreground/50">
                <Circle className="h-5 w-5" />
                <span className="text-xs">Frei</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {focusedItems.length === 0 && (
        <p className="text-xs text-muted-foreground text-center mt-3">
          Wähle bis zu 3 Skills aus der Timeline, um sie zu fokussieren.
        </p>
      )}
    </div>
  )
}
