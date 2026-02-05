// src/components/learning-journey/StructuredImpulseCard.tsx
"use client"

import { useState, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MessageCircle,
  ClipboardList,
  Brain,
  Award,
  ChevronRight,
  Check,
  Sparkles,
  RefreshCw,
  Clock,
  Target,
  User,
} from "lucide-react"
import { ImpulseLevelIndicator } from "./ImpulseLevelIndicator"
import {
  STEP_CONFIG,
  IMPULSE_STEPS,
  type StructuredImpulse,
  type ImpulseStepType,
  isStepCompleted,
  calculateProgress,
} from "@/types/practical-impulse"
import { ImpulseStep } from "@prisma/client"
import { QuickFeedback } from "@/components/feedback/QuickFeedback"

// Icon mapping
const STEP_ICONS = {
  CHECK_IN: MessageCircle,
  TASK: ClipboardList,
  REFLECTION: Brain,
  EVIDENCE: Award,
} as const

interface Props {
  learningFocusId: string
  existingImpulse?: StructuredImpulse | null
  skillName: string
  targetLevel: number
  currentLevel: number
  functionalLeadName?: string
  userId: string
  onGenerateImpulse: (focusId: string) => Promise<StructuredImpulse>
  onUpdateStep: (
    impulseId: string,
    step: ImpulseStep,
    data?: { reflection?: string }
  ) => Promise<{ success: boolean }>
  onSaveEvidence: (
    impulseId: string,
    reflection: string
  ) => Promise<{ success: boolean; evidenceNoteId: string }>
  onRefresh: () => void
}

export function StructuredImpulseCard({
  learningFocusId,
  existingImpulse,
  skillName,
  targetLevel,
  currentLevel,
  functionalLeadName = "deinen Functional Lead",
  userId,
  onGenerateImpulse,
  onUpdateStep,
  onSaveEvidence,
  onRefresh,
}: Props) {
  const [impulse, setImpulse] = useState<StructuredImpulse | null>(
    existingImpulse ?? null
  )
  const [isPending, startTransition] = useTransition()
  const [reflection, setReflection] = useState(
    existingImpulse?.userReflection ?? ""
  )
  const [activeStep, setActiveStep] = useState<ImpulseStepType>(
    (existingImpulse?.currentStep as ImpulseStepType) ?? "CHECK_IN"
  )
  const [showFeedback, setShowFeedback] = useState(false)

  const handleGenerate = () => {
    startTransition(async () => {
      const result = await onGenerateImpulse(learningFocusId)
      setImpulse(result)
      setActiveStep("CHECK_IN")
      setReflection("")
    })
  }

  const handleStepProgress = (nextStep: ImpulseStep) => {
    if (!impulse) return
    startTransition(async () => {
      await onUpdateStep(impulse.id, nextStep)
      setActiveStep(nextStep as ImpulseStepType)
      onRefresh()
    })
  }

  const handleSaveEvidence = () => {
    if (!impulse || !reflection.trim() || impulse.evidenceSaved) return
    startTransition(async () => {
      await onSaveEvidence(impulse.id, reflection)
      // Trigger feedback - NO refresh yet, refresh happens when feedback closes
      setShowFeedback(true)
    })
  }

  const handleFeedbackClose = () => {
    setShowFeedback(false)
    // Refresh after feedback is closed
    onRefresh()
  }

  const progress = impulse ? calculateProgress(impulse) : 0

  // Wenn kein Impulse existiert: Prominenter Generieren-Button
  if (!impulse) {
    return (
      <button
        onClick={handleGenerate}
        disabled={isPending}
        className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-convidera-blue to-blue-600 p-6 text-white hover:shadow-xl hover:shadow-convidera-blue/25 transition-all disabled:opacity-70"
      >
        {/* Animated background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

        <div className="relative flex items-center justify-center gap-4">
          <div className="p-3 rounded-full bg-white/20">
            {isPending ? (
              <RefreshCw className="h-6 w-6 animate-spin" />
            ) : (
              <Sparkles className="h-6 w-6" />
            )}
          </div>
          <div className="text-left">
            <h4 className="text-lg font-semibold">
              {isPending ? "Impuls wird generiert..." : "Impuls starten"}
            </h4>
            <p className="text-sm text-white/70">
              Praxisnahe Übung für {skillName}
            </p>
          </div>
        </div>
      </button>
    )
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header mit Progress */}
      <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Praktischer Impuls</span>
          <ImpulseLevelIndicator requiredLevel={targetLevel} compact />
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground">{progress}%</div>
          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="px-4 py-3 border-b flex items-center justify-between">
        {IMPULSE_STEPS.map((step, index) => {
          const config = STEP_CONFIG[step]
          const Icon = STEP_ICONS[step]
          const isActive = activeStep === step
          const isComplete = isStepCompleted(impulse, step)
          const stepIndex = IMPULSE_STEPS.indexOf(activeStep)
          const isPast = index < stepIndex

          return (
            <div key={step} className="flex items-center">
              <button
                onClick={() => (isPast || isComplete) && setActiveStep(step)}
                disabled={!isPast && !isComplete && !isActive}
                className={`
                  flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-all
                  ${isActive ? "bg-primary/10" : ""}
                  ${isPast || isComplete ? "cursor-pointer hover:bg-muted" : "cursor-default"}
                `}
              >
                <div
                  className={`
                    p-1.5 rounded-full transition-colors
                    ${isComplete ? "bg-emerald-100 dark:bg-emerald-900/30" : config.bgColor}
                  `}
                >
                  {isComplete ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Icon
                      className={`h-3.5 w-3.5 ${isActive ? config.color : "text-muted-foreground"}`}
                    />
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {config.label}
                </span>
              </button>
              {index < IMPULSE_STEPS.length - 1 && (
                <ChevronRight className="h-3 w-3 text-muted-foreground/50 mx-1" />
              )}
            </div>
          )
        })}
      </div>

      {/* Step Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {/* CHECK-IN Phase */}
          {activeStep === "CHECK_IN" && (
            <motion.div
              key="check-in"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 shrink-0">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm leading-relaxed">
                    {impulse.checkInMessage ||
                      `Ich sehe, du arbeitest an **${skillName}** für Level ${targetLevel}. Das ist ein wichtiger Schritt auf deinem Lernweg!`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Target className="h-3.5 w-3.5" />
                  Level {currentLevel} → {targetLevel}
                </span>
                {impulse.estimatedMinutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />~{impulse.estimatedMinutes}{" "}
                    Min
                  </span>
                )}
              </div>

              <button
                onClick={() => handleStepProgress("TASK")}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Los geht&apos;s!
                <ChevronRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {/* TASK Phase */}
          {activeStep === "TASK" && (
            <motion.div
              key="task"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30 shrink-0">
                  <ClipboardList className="h-5 w-5 text-amber-600" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Deine Aufgabe</h4>
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {impulse.taskDescription || impulse.prompt}
                  </p>
                </div>
              </div>

              {impulse.expectedOutcome && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Erwartetes Ergebnis:</span>{" "}
                    {impulse.expectedOutcome}
                  </p>
                </div>
              )}

              <button
                onClick={() => handleStepProgress("REFLECTION")}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Aufgabe erledigt
                <Check className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {/* REFLECTION Phase */}
          {activeStep === "REFLECTION" && (
            <motion.div
              key="reflection"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-violet-100 dark:bg-violet-900/30 shrink-0">
                  <Brain className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">Reflexion</h4>
                  <p className="text-sm text-foreground/80">
                    {impulse.reflectionQuestion ||
                      "Was war die größte Herausforderung dabei?"}
                  </p>
                </div>
              </div>

              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Teile deine Gedanken und Erkenntnisse..."
                rows={3}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              />

              <button
                onClick={() => handleStepProgress("EVIDENCE")}
                disabled={isPending || !reflection.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Weiter zur Evidence
                <ChevronRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {/* EVIDENCE Phase */}
          {activeStep === "EVIDENCE" && (
            <motion.div
              key="evidence"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 shrink-0">
                  <Award className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1">Evidence-Brücke</h4>
                  <p className="text-sm text-foreground/80">
                    Wenn du das erledigt hast, speichere ich deine Notizen
                    direkt als Beleg für{" "}
                    <span className="font-medium">{functionalLeadName}</span>.
                  </p>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  Deine Reflexion
                </div>
                <p className="text-sm italic">&ldquo;{reflection}&rdquo;</p>
              </div>

              {impulse.evidenceSaved ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400">
                  <Check className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    Evidence gespeichert! Dein Functional Lead kann deinen
                    Fortschritt sehen.
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleSaveEvidence}
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Speichert...
                    </>
                  ) : (
                    <>
                      <Award className="h-4 w-4" />
                      Als Beleg speichern
                    </>
                  )}
                </button>
              )}

              {impulse.evidenceSaved && (
                <button
                  onClick={handleGenerate}
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-primary text-primary hover:bg-primary/5 transition-colors"
                >
                  <Sparkles className="h-4 w-4" />
                  Neuen Impuls starten
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Feedback Component - Triggered after impulse completion */}
      {showFeedback && (
        <QuickFeedback
          userId={userId}
          contextSkill={skillName}
          contextType="impulse_completed"
          onClose={handleFeedbackClose}
        />
      )}
    </div>
  )
}
