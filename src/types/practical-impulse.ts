// src/types/practical-impulse.ts

import type { ImpulseLevel, ImpulseStep } from "@prisma/client"

export interface GeneratedImpulse {
  impulse: string
  expectedOutcome: string
  estimatedMinutes: number
  level: string
  id: string
}

export interface StructuredImpulse {
  id: string
  learningFocusId: string
  targetLevel: ImpulseLevel
  currentStep: ImpulseStep
  checkInMessage: string | null
  taskPrompt: string
  taskDescription: string | null
  expectedOutcome: string | null
  estimatedMinutes: number | null
  reflectionPrompt: string | null
  reflectionQuestion: string | null
  userReflection: string | null
  isCompleted: boolean
  completedAt: Date | null
  generatedAt: Date
  evidenceSaved: boolean
  // Three-step model (Glashaus-Prinzip)
  vorbereitungText: string | null
  durchfuehrungText: string | null
  ergebnisCheckText: string | null
  // Interactive Scaffolding
  supportConcept: string | null
  supportExplanation: string | null
  supportTemplate: string | null
}

// Step configuration
export type ImpulseStepType = "CHECK_IN" | "TASK" | "REFLECTION" | "EVIDENCE"

export const IMPULSE_STEPS: ImpulseStepType[] = ["CHECK_IN", "TASK", "REFLECTION", "EVIDENCE"]

export interface StepConfig {
  label: string
  description: string
  icon: string
  bgColor: string
  color: string
}

export const STEP_CONFIG: Record<ImpulseStepType, StepConfig> = {
  CHECK_IN: {
    label: "Check-In",
    description: "Begrüßung und Kontext zum Skill",
    icon: "MessageCircle",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    color: "text-blue-600"
  },
  TASK: {
    label: "Aufgabe",
    description: "Die praktische Übung bearbeiten",
    icon: "ClipboardList",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    color: "text-amber-600"
  },
  REFLECTION: {
    label: "Reflexion",
    description: "Über Gelerntes und Herausforderungen nachdenken",
    icon: "Brain",
    bgColor: "bg-violet-100 dark:bg-violet-900/30",
    color: "text-violet-600"
  },
  EVIDENCE: {
    label: "Evidence",
    description: "Als Nachweis für das Assessment speichern",
    icon: "Award",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    color: "text-emerald-600"
  }
}

export function isStepCompleted(
  impulse: StructuredImpulse,
  checkStep: ImpulseStepType
): boolean {
  // Map Prisma ImpulseStep to order (CHECK_IN, TASK, REFLECTION are DB values)
  const stepOrder: Partial<Record<ImpulseStep, number>> = {
    CHECK_IN: 0,
    TASK: 1,
    REFLECTION: 2
  }

  const checkStepOrder: Record<ImpulseStepType, number> = {
    CHECK_IN: 0,
    TASK: 1,
    REFLECTION: 2,
    EVIDENCE: 3
  }

  if (impulse.isCompleted && checkStep === "EVIDENCE") return true
  if (impulse.evidenceSaved && checkStep === "EVIDENCE") return true
  if (impulse.isCompleted) return true

  const currentOrder = stepOrder[impulse.currentStep] ?? 0
  const targetOrder = checkStepOrder[checkStep]

  return currentOrder > targetOrder
}

export function calculateProgress(impulse: StructuredImpulse): number {
  if (impulse.isCompleted || impulse.evidenceSaved) return 100

  // Map Prisma ImpulseStep to progress (CHECK_IN, TASK, REFLECTION are DB values)
  const stepProgress: Partial<Record<ImpulseStep, number>> = {
    CHECK_IN: 25,
    TASK: 50,
    REFLECTION: 75
  }

  return stepProgress[impulse.currentStep] ?? 0
}
