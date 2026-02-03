// src/components/learning-journey/HorizonSection.tsx
"use client"

import { motion } from "framer-motion"
import { SkillTimelineItem } from "./SkillTimelineItem"
import type { StructuredImpulse } from "@/types/practical-impulse"
import type { ImpulseStep } from "@prisma/client"

interface HorizonConfig {
  title: string
  subtitle: string
  icon: string
  color: string
  dotColor: string
  bgColor: string
  accentColor: string
}

interface Props {
  config: HorizonConfig
  items: any[] // LearningFocus with relations
  planId: string
  focusedCount: number
  onSetFocus: (planId: string, skillId: string) => Promise<{ success: boolean; error?: string }>
  onRemoveFocus: (planId: string, skillId: string) => Promise<{ success: boolean }>
  onGenerateImpulse: (focusId: string) => Promise<StructuredImpulse>
  onUpdateStep: (impulseId: string, step: ImpulseStep, data?: { reflection?: string }) => Promise<{ success: boolean }>
  onSaveEvidence: (impulseId: string, reflection: string) => Promise<{ success: boolean; evidenceNoteId: string }>
  onRefresh: () => void
}

export function HorizonSection({
  config,
  items,
  planId,
  focusedCount,
  onSetFocus,
  onRemoveFocus,
  onGenerateImpulse,
  onUpdateStep,
  onSaveEvidence,
  onRefresh
}: Props) {
  return (
    <div className="mb-10">
      {/* Horizon Header */}
      <div className="relative flex items-center gap-3 mb-4 pl-14">
        {/* Timeline Dot */}
        <div className={`absolute left-[18px] h-4 w-4 rounded-full ${config.dotColor} ring-4 ring-background`} />

        <span className="text-xl">{config.icon}</span>
        <div>
          <h2 className={`text-lg font-bold ${config.accentColor}`}>{config.title}</h2>
          <p className="text-sm text-muted-foreground">{config.subtitle}</p>
        </div>
        <span className="ml-auto text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
          {items.length} Skill{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Skill Items */}
      <div className="space-y-3 pl-14">
        {items.map((item: any, index: number) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, duration: 0.25 }}
          >
            {/* Timeline connection line dot */}
            <div className="relative">
              <div className={`absolute -left-[38px] top-5 h-2 w-2 rounded-full ${
                item.status === "COMPLETED" ? "bg-emerald-500" :
                item.status === "IN_PROGRESS" ? "bg-primary" :
                "bg-muted-foreground/30"
              }`} />
            </div>

            <SkillTimelineItem
              item={item}
              planId={planId}
              canFocus={focusedCount < 3 || item.status === "IN_PROGRESS"}
              priorityColor={config.color}
              onSetFocus={onSetFocus}
              onRemoveFocus={onRemoveFocus}
              onGenerateImpulse={onGenerateImpulse}
              onUpdateStep={onUpdateStep}
              onSaveEvidence={onSaveEvidence}
              onRefresh={onRefresh}
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
