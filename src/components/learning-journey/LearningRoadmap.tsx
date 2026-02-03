// src/components/learning-journey/LearningRoadmap.tsx
"use client"

import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { HorizonSection } from "./HorizonSection"
import { FocusSelector } from "./FocusSelector"
import type { LearningRoadmap as RoadmapType } from "@/app/actions/learning-journey"
import type { StructuredImpulse } from "@/types/practical-impulse"
import type { ImpulseStep } from "@prisma/client"

interface Props {
  plan: any // LearningPlan with LearningFocus relations
  roadmap: RoadmapType
  onSetFocus: (planId: string, skillId: string) => Promise<{ success: boolean; error?: string }>
  onRemoveFocus: (planId: string, skillId: string) => Promise<{ success: boolean }>
  onGenerateImpulse: (focusId: string) => Promise<StructuredImpulse>
  onUpdateStep: (impulseId: string, step: ImpulseStep, data?: { reflection?: string }) => Promise<{ success: boolean }>
  onSaveEvidence: (impulseId: string, reflection: string) => Promise<{ success: boolean; evidenceNoteId: string }>
}

const horizonConfig = {
  CRITICAL: {
    title: "Critical",
    subtitle: "Kritische Grundlagen aufbauen",
    icon: "🏗️",
    color: "border-red-500",
    dotColor: "bg-red-500",
    bgColor: "bg-red-50 dark:bg-red-950/20",
    accentColor: "text-red-600 dark:text-red-400"
  },
  GROWTH: {
    title: "Growth",
    subtitle: "Kompetenzen vertiefen",
    icon: "🎯",
    color: "border-amber-500",
    dotColor: "bg-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
    accentColor: "text-amber-600 dark:text-amber-400"
  },
  STRETCH: {
    title: "Stretch",
    subtitle: "Den nächsten Schritt vorbereiten",
    icon: "🚀",
    color: "border-emerald-500",
    dotColor: "bg-emerald-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
    accentColor: "text-emerald-600 dark:text-emerald-400"
  }
} as const

export function LearningRoadmap({
  plan,
  roadmap,
  onSetFocus,
  onRemoveFocus,
  onGenerateImpulse,
  onUpdateStep,
  onSaveEvidence
}: Props) {
  const router = useRouter()

  const focusedItems = plan.LearningFocus.filter(
    (item: any) => item.status === "IN_PROGRESS"
  )

  const priorities = ["CRITICAL", "GROWTH", "STRETCH"] as const

  const handleRefresh = () => {
    router.refresh()
  }

  return (
    <div className="relative">
      {/* Focus Status Bar */}
      <FocusSelector
        focusedItems={focusedItems}
        maxFocus={3}
      />

      {/* Vertical Timeline */}
      <div className="relative mt-8">
        {/* Timeline Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

        <AnimatePresence mode="wait">
          {priorities.map((priority, priorityIndex) => {
            const items = plan.LearningFocus.filter(
              (item: any) => item.priority === priority
            )

            if (items.length === 0) return null

            return (
              <motion.div
                key={priority}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: priorityIndex * 0.15,
                  duration: 0.4,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
              >
                <HorizonSection
                  config={horizonConfig[priority]}
                  items={items}
                  planId={plan.id}
                  focusedCount={focusedItems.length}
                  onSetFocus={onSetFocus}
                  onRemoveFocus={onRemoveFocus}
                  onGenerateImpulse={onGenerateImpulse}
                  onUpdateStep={onUpdateStep}
                  onSaveEvidence={onSaveEvidence}
                  onRefresh={handleRefresh}
                />
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Empty State */}
        {roadmap.meta.totalGaps === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-lg font-medium text-emerald-600">
              🎉 Alle Skill-Anforderungen erfüllt!
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Du hast alle Skills für deine aktuelle und Zielrolle erreicht.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
