// src/components/learning-journey/SkillTimelineItem.tsx
"use client"

import { useState, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, ChevronRight, Check, Clock, Target, User2 } from "lucide-react"
import { ImpulseLevelIndicator, getLevelLabel } from "./ImpulseLevelIndicator"
import { StructuredImpulseCard } from "./StructuredImpulseCard"
import { QuickFeedback } from "@/components/feedback/QuickFeedback"
import type { StructuredImpulse } from "@/types/practical-impulse"
import type { ImpulseStep, ImpulseLevel } from "@prisma/client"

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
    Owner: { id: string; name: string; avatarUrl: string | null } | null
  } | null
  PracticalImpulse: Array<{
    id: string
    prompt: string
    expectedOutcome: string | null
    estimatedMinutes: number | null
    targetLevel: string
    isCompleted: boolean
    userReflection: string | null
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
  userId: string
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
  userId,
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
  const [showFeedback, setShowFeedback] = useState(false)

  const isFocused = item.status === "IN_PROGRESS"
  const isCompleted = item.status === "COMPLETED"
  const latestImpulse = item.PracticalImpulse[0] ?? null
  const hasActiveImpulse = latestImpulse && !latestImpulse.isCompleted

  const handleFocusToggle = () => {
    setError(null)
    startTransition(async () => {
      if (isFocused) {
        await onRemoveFocus(planId, item.skillId)
        onRefresh()
      } else {
        const result = await onSetFocus(planId, item.skillId)
        if (!result.success && result.error) {
          setError(result.error)
          onRefresh()
        } else if (result.success) {
          setShowFeedback(true)
        }
      }
    })
  }

  const handleFeedbackClose = () => {
    setShowFeedback(false)
    onRefresh()
  }

  // Progress calculation
  const progressPercent = Math.round((item.currentLevel / item.targetLevel) * 100)

  return (
    <div className={`
      rounded-2xl border-2 transition-all bg-white
      ${isFocused
        ? "border-convidera-blue shadow-lg shadow-convidera-blue/10"
        : isCompleted
          ? "border-emerald-300 bg-emerald-50/30"
          : "border-gray-100 hover:border-gray-200 hover:shadow-md"
      }
    `}>
      {/* Card Header - Always Visible */}
      <div
        className="p-5 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-4">
          {/* Progress Ring */}
          <div className="relative w-14 h-14 shrink-0">
            <svg className="w-14 h-14 -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="4"
              />
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                stroke={isCompleted ? "#10B981" : "#0055FF"}
                strokeWidth="4"
                strokeDasharray={`${progressPercent * 1.51} 151`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {isCompleted ? (
                <Check className="w-5 h-5 text-emerald-600" />
              ) : (
                <span className="text-sm font-bold text-gray-900">
                  {item.currentLevel}/{item.targetLevel}
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className={`text-lg font-semibold text-gray-900 ${isCompleted ? "line-through opacity-60" : ""}`}>
                  {item.Skill.title}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {item.CompetenceField?.title}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <ImpulseLevelIndicator requiredLevel={item.targetLevel} compact />
                {isFocused && (
                  <span className="px-2 py-0.5 rounded-full bg-convidera-blue text-white text-xs font-medium">
                    Fokus
                  </span>
                )}
              </div>
            </div>

            {/* Quick Info */}
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Target className="w-3.5 h-3.5" />
                {getLevelLabel(item.targetLevel)}
              </span>
              {item.EvidenceNote.length > 0 && (
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  {item.EvidenceNote.length} Beleg{item.EvidenceNote.length !== 1 ? "e" : ""}
                </span>
              )}
            </div>
          </div>

          {/* Expand Arrow */}
          <ChevronRight
            className={`w-5 h-5 text-gray-300 transition-transform shrink-0 ${isExpanded ? "rotate-90" : ""}`}
          />
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0 space-y-4 border-t border-gray-100">
              {/* Error message */}
              {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Main Action Area */}
              <div className="mt-4">
                {!isFocused && !isCompleted ? (
                  // Not focused - Show activation CTA
                  <button
                    onClick={handleFocusToggle}
                    disabled={isPending || !canFocus}
                    className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-gradient-to-r from-convidera-blue to-blue-600 text-white font-medium hover:shadow-lg hover:shadow-convidera-blue/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>Diesen Skill jetzt lernen</span>
                  </button>
                ) : isFocused ? (
                  // Focused - Show Impulse Card or Generate Button
                  <div className="space-y-4">
                    {/* Mentor Info */}
                    {item.CompetenceField?.Owner && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-xs font-medium">
                          {item.CompetenceField.Owner.name[0]}
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Dein Mentor:</span>
                          <span className="font-medium text-gray-900 ml-1">
                            {item.CompetenceField.Owner.name}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Structured Impulse Card */}
                    <StructuredImpulseCard
                      learningFocusId={item.id}
                      existingImpulse={hasActiveImpulse ? {
                        id: latestImpulse.id,
                        learningFocusId: item.id,
                        targetLevel: latestImpulse.targetLevel as ImpulseLevel,
                        currentStep: (latestImpulse.currentStep as ImpulseStep) ?? "CHECK_IN",
                        checkInMessage: latestImpulse.checkInMessage ?? null,
                        taskPrompt: latestImpulse.prompt,
                        taskDescription: latestImpulse.taskDescription ?? null,
                        expectedOutcome: latestImpulse.expectedOutcome ?? null,
                        estimatedMinutes: latestImpulse.estimatedMinutes ?? null,
                        reflectionPrompt: latestImpulse.reflectionQuestion ?? null,
                        reflectionQuestion: latestImpulse.reflectionQuestion ?? null,
                        userReflection: latestImpulse.userReflection ?? null,
                        evidenceSaved: latestImpulse.evidenceSaved ?? false,
                        isCompleted: latestImpulse.isCompleted,
                        completedAt: latestImpulse.completedAt ?? null,
                        generatedAt: latestImpulse.generatedAt ?? new Date(),
                        // Three-step model (use type assertion for new fields that may not be in old DB records)
                        vorbereitungText: (latestImpulse as { vorbereitungText?: string | null }).vorbereitungText ?? null,
                        durchfuehrungText: (latestImpulse as { durchfuehrungText?: string | null }).durchfuehrungText ?? null,
                        ergebnisCheckText: (latestImpulse as { ergebnisCheckText?: string | null }).ergebnisCheckText ?? null,
                        // Scaffolding
                        supportConcept: (latestImpulse as { supportConcept?: string | null }).supportConcept ?? null,
                        supportExplanation: (latestImpulse as { supportExplanation?: string | null }).supportExplanation ?? null,
                        supportTemplate: (latestImpulse as { supportTemplate?: string | null }).supportTemplate ?? null,
                      } : null}
                      skillName={item.Skill.title}
                      currentLevel={item.currentLevel}
                      targetLevel={item.targetLevel}
                      functionalLeadName={item.CompetenceField?.Owner?.name}
                      userId={userId}
                      onGenerateImpulse={onGenerateImpulse}
                      onUpdateStep={onUpdateStep}
                      onSaveEvidence={onSaveEvidence}
                      onRefresh={onRefresh}
                    />

                    {/* Pause Focus Button */}
                    <button
                      onClick={handleFocusToggle}
                      disabled={isPending}
                      className="w-full p-3 rounded-lg border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition-colors"
                    >
                      Fokus pausieren
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Evidence Notes Timeline */}
              {item.EvidenceNote.length > 0 && (
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Deine Belege
                  </h4>
                  <div className="space-y-3">
                    {item.EvidenceNote.slice(0, 3).map((note, index) => (
                      <div
                        key={note.id}
                        className="relative pl-6 before:absolute before:left-2 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-emerald-400"
                      >
                        <p className="text-sm text-gray-700 line-clamp-2">{note.content}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(note.createdAt).toLocaleDateString("de-DE", {
                            day: "numeric",
                            month: "short"
                          })}
                          {note.isAssessmentReady && (
                            <span className="ml-2 text-emerald-600">• Bereit für Assessment</span>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback Portal */}
      {showFeedback && (
        <QuickFeedback
          userId={userId}
          contextSkill={item.Skill.title}
          contextType="skill_started"
          onClose={handleFeedbackClose}
        />
      )}
    </div>
  )
}
