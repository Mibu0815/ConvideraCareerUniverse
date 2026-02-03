// src/components/learning-journey/SkillTimelineItem.tsx
"use client"

import { useState, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Target, Pause, User2 } from "lucide-react"
import { ImpulseLevelIndicator } from "./ImpulseLevelIndicator"
import { StructuredImpulseCard } from "./StructuredImpulseCard"
import type { StructuredImpulse } from "@/types/practical-impulse"
import type { ImpulseStep } from "@prisma/client"

interface LearningFocusItem {
  id: string
  skillId: string
  currentLevel: number
  targetLevel: number
  gapSize: number | null
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"
  focusOrder: number | null
  Skill: { id: string; title: string; description: string | null }
  CompetenceField: {
    id: string
    title: string
    User: { id: string; name: string; avatarUrl: string | null } | null
  } | null
  PracticalImpulse: Array<{
    id: string
    prompt: string
    expectedOutcome: string | null
    estimatedMinutes: number | null
    targetLevel: string
    isCompleted: boolean
    userReflection: string | null
    // Neue strukturierte Felder
    checkInMessage?: string | null
    taskDescription?: string | null
    reflectionQuestion?: string | null
    currentStep?: string
    evidenceSaved?: boolean
    evidenceNoteId?: string | null
    functionalLeadId?: string | null
    functionalLeadName?: string | null
    checkInViewedAt?: Date | null
    taskStartedAt?: Date | null
    reflectionStartedAt?: Date | null
    evidenceSavedAt?: Date | null
    completedAt?: Date | null
    generatedAt?: Date
  }>
  EvidenceNote: Array<{
    id: string
    content: string
    isAssessmentReady: boolean
    createdAt: Date
  }>
}

interface Props {
  item: LearningFocusItem
  planId: string
  canFocus: boolean
  priorityColor: string
  onSetFocus: (planId: string, skillId: string) => Promise<{ success: boolean; error?: string }>
  onRemoveFocus: (planId: string, skillId: string) => Promise<{ success: boolean }>
  onGenerateImpulse: (focusId: string) => Promise<StructuredImpulse>
  onUpdateStep: (impulseId: string, step: ImpulseStep, data?: { reflection?: string }) => Promise<{ success: boolean }>
  onSaveEvidence: (impulseId: string, reflection: string) => Promise<{ success: boolean; evidenceNoteId: string }>
  onRefresh: () => void
}

export function SkillTimelineItem({
  item,
  planId,
  canFocus,
  priorityColor,
  onSetFocus,
  onRemoveFocus,
  onGenerateImpulse,
  onUpdateStep,
  onSaveEvidence,
  onRefresh
}: Props) {
  const [isExpanded, setIsExpanded] = useState(item.status === "IN_PROGRESS")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isFocused = item.status === "IN_PROGRESS"
  const isCompleted = item.status === "COMPLETED"
  const latestImpulse = item.PracticalImpulse[0] ?? null

  const handleFocusToggle = () => {
    setError(null)
    startTransition(async () => {
      if (isFocused) {
        await onRemoveFocus(planId, item.skillId)
      } else {
        const result = await onSetFocus(planId, item.skillId)
        if (!result.success && result.error) {
          setError(result.error)
        }
      }
      onRefresh()
    })
  }

  return (
    <div className={`rounded-xl border transition-all ${
      isFocused ? "border-primary bg-primary/5 shadow-sm" :
      isCompleted ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20" :
      "bg-card hover:border-muted-foreground/30"
    }`}>
      {/* Header (always visible) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        {/* Level indicator bars */}
        <div className="flex items-center gap-1 shrink-0">
          {Array.from({ length: item.targetLevel }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 w-4 rounded-full transition-colors ${
                i < item.currentLevel ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1 font-mono">
            {item.currentLevel}/{item.targetLevel}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`text-sm font-semibold truncate ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
              {item.Skill.title}
            </h3>
            {isFocused && (
              <span className="shrink-0 text-xs px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">
                Fokus {item.focusOrder}
              </span>
            )}
            {isCompleted && (
              <span className="shrink-0 text-xs px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                ✓
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {item.CompetenceField?.title}
            {item.CompetenceField?.User && ` · Mentor: ${item.CompetenceField.User.name}`}
          </p>
        </div>

        {/* Impulse Level Badge */}
        <ImpulseLevelIndicator requiredLevel={item.targetLevel} compact />

        <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${
          isExpanded ? "rotate-180" : ""
        }`} />
      </button>

      {/* Expanded Area */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t pt-4">
              {/* Error message */}
              {error && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              {/* Focus Button */}
              {!isCompleted && (
                <button
                  onClick={handleFocusToggle}
                  disabled={isPending || (!canFocus && !isFocused)}
                  className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-colors ${
                    isFocused
                      ? "bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
                  }`}
                >
                  {isFocused ? (
                    <><Pause className="h-3.5 w-3.5" /> Fokus pausieren</>
                  ) : (
                    <><Target className="h-3.5 w-3.5" /> Als Fokus aktivieren</>
                  )}
                </button>
              )}

              {/* Mentor Info */}
              {item.CompetenceField?.User && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg bg-secondary/50">
                  <User2 className="h-4 w-4 text-primary/60 shrink-0" />
                  <span>
                    Functional Lead: <span className="font-medium text-foreground">{item.CompetenceField.User.name}</span>
                  </span>
                </div>
              )}

              {/* Structured Practical Impulse (only for focused skills) */}
              {isFocused && (
                <StructuredImpulseCard
                  learningFocusId={item.id}
                  existingImpulse={latestImpulse && !latestImpulse.isCompleted ? {
                    id: latestImpulse.id,
                    learningFocusId: item.id,
                    targetLevel: latestImpulse.targetLevel as any,
                    currentStep: (latestImpulse.currentStep as ImpulseStep) ?? "CHECK_IN",
                    checkInMessage: latestImpulse.checkInMessage ?? null,
                    checkInViewedAt: latestImpulse.checkInViewedAt ?? null,
                    taskDescription: latestImpulse.taskDescription ?? null,
                    prompt: latestImpulse.prompt,
                    expectedOutcome: latestImpulse.expectedOutcome ?? null,
                    estimatedMinutes: latestImpulse.estimatedMinutes ?? null,
                    taskStartedAt: latestImpulse.taskStartedAt ?? null,
                    reflectionQuestion: latestImpulse.reflectionQuestion ?? null,
                    userReflection: latestImpulse.userReflection ?? null,
                    reflectionStartedAt: latestImpulse.reflectionStartedAt ?? null,
                    evidenceSaved: latestImpulse.evidenceSaved ?? false,
                    evidenceNoteId: latestImpulse.evidenceNoteId ?? null,
                    evidenceSavedAt: latestImpulse.evidenceSavedAt ?? null,
                    functionalLeadId: latestImpulse.functionalLeadId ?? null,
                    functionalLeadName: latestImpulse.functionalLeadName ?? null,
                    isCompleted: latestImpulse.isCompleted,
                    completedAt: latestImpulse.completedAt ?? null,
                    generatedAt: latestImpulse.generatedAt ?? new Date()
                  } : null}
                  skillName={item.Skill.title}
                  currentLevel={item.currentLevel}
                  targetLevel={item.targetLevel}
                  functionalLeadName={item.CompetenceField?.User?.name}
                  onGenerateImpulse={onGenerateImpulse}
                  onUpdateStep={onUpdateStep}
                  onSaveEvidence={onSaveEvidence}
                  onRefresh={onRefresh}
                />
              )}

              {/* Evidence Notes */}
              {item.EvidenceNote.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Evidence-Notes
                  </h4>
                  {item.EvidenceNote.map((note) => (
                    <div key={note.id} className="text-sm p-3 rounded-lg bg-secondary/50">
                      <p className="text-foreground/80">{note.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(note.createdAt).toLocaleDateString("de-DE")}
                        {note.isAssessmentReady && " · 📋 Für Assessment vorgemerkt"}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Skill Description */}
              {item.Skill.description && (
                <div className="text-xs text-muted-foreground border-t pt-3">
                  <span className="font-medium">Skill-Beschreibung:</span> {item.Skill.description}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
