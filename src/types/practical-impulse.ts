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
  expectedOutcome: string | null
  estimatedMinutes: number | null
  reflectionPrompt: string | null
  userReflection: string | null
  isCompleted: boolean
  completedAt: Date | null
  generatedAt: Date
}

// Step configuration
export type ImpulseStepType = "CHECK_IN" | "TASK" | "REFLECTION" | "EVIDENCE"

export const IMPULSE_STEPS: ImpulseStepType[] = ["CHECK_IN", "TASK", "REFLECTION", "EVIDENCE"]

export interface StepConfig {
  label: string
  description: string
  icon: string
}

export const STEP_CONFIG: Record<ImpulseStepType, StepConfig> = {
  CHECK_IN: {
    label: "Check-In",
    description: "Begrüßung und Kontext zum Skill",
    icon: "MessageCircle"
  },
  TASK: {
    label: "Aufgabe",
    description: "Die praktische Übung bearbeiten",
    icon: "ClipboardList"
  },
  REFLECTION: {
    label: "Reflexion",
    description: "Über Gelerntes und Herausforderungen nachdenken",
    icon: "Brain"
  },
  EVIDENCE: {
    label: "Evidence",
    description: "Als Nachweis für das Assessment speichern",
    icon: "Award"
  }
}

export function isStepCompleted(
  currentStep: ImpulseStep,
  checkStep: ImpulseStepType,
  isCompleted: boolean
): boolean {
  const stepOrder: Record<ImpulseStep, number> = {
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

  if (isCompleted && checkStep === "EVIDENCE") return true
  if (isCompleted) return true

  const currentOrder = stepOrder[currentStep] ?? 0
  const targetOrder = checkStepOrder[checkStep]

  return currentOrder > targetOrder
}

export function calculateProgress(currentStep: ImpulseStep, isCompleted: boolean): number {
  if (isCompleted) return 100

  const stepProgress: Record<ImpulseStep, number> = {
    CHECK_IN: 25,
    TASK: 50,
    REFLECTION: 75
  }

  return stepProgress[currentStep] ?? 0
}
