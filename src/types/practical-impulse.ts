// src/types/practical-impulse.ts
// TypeScript Types für den strukturierten Practical Impulse Workflow

import { ImpulseLevel, ImpulseStep } from "@prisma/client"

/**
 * Die 4 Phasen des Practical Impulse Workflows
 */
export const IMPULSE_STEPS = ["CHECK_IN", "TASK", "REFLECTION", "EVIDENCE"] as const

export type ImpulseStepType = (typeof IMPULSE_STEPS)[number]

/**
 * Konfiguration für jeden Schritt im Workflow
 */
export const STEP_CONFIG = {
  CHECK_IN: {
    order: 0,
    label: "Check-In",
    description: "Begrüßung und Kontext",
    icon: "MessageCircle",
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  TASK: {
    order: 1,
    label: "Aufgabe",
    description: "30-60 Min Praxisübung",
    icon: "ClipboardList",
    color: "text-amber-600",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
  REFLECTION: {
    order: 2,
    label: "Reflexion",
    description: "Herausforderungen reflektieren",
    icon: "Brain",
    color: "text-violet-600",
    bgColor: "bg-violet-100 dark:bg-violet-900/30",
  },
  EVIDENCE: {
    order: 3,
    label: "Evidence",
    description: "Beleg für Functional Lead",
    icon: "Award",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
  },
} as const

/**
 * Strukturierter Practical Impulse mit allen Workflow-Daten
 */
export interface StructuredImpulse {
  id: string
  learningFocusId: string
  targetLevel: ImpulseLevel
  currentStep: ImpulseStep

  // Check-In Phase
  checkInMessage: string | null
  checkInViewedAt: Date | null

  // Task Phase
  taskDescription: string | null
  prompt: string // Legacy: wird zu taskDescription migriert
  expectedOutcome: string | null
  estimatedMinutes: number | null
  taskStartedAt: Date | null

  // Reflection Phase
  reflectionQuestion: string | null
  userReflection: string | null
  reflectionStartedAt: Date | null

  // Evidence Phase
  evidenceSaved: boolean
  evidenceNoteId: string | null
  evidenceSavedAt: Date | null
  functionalLeadId: string | null
  functionalLeadName: string | null

  // Status
  isCompleted: boolean
  completedAt: Date | null
  generatedAt: Date
}

/**
 * Props für die generierte Impulse-Nachricht
 */
export interface ImpulseGenerationInput {
  skillName: string
  skillDescription?: string
  competenceFieldName?: string
  currentLevel: number
  targetLevel: number
  userRole?: string
  functionalLeadName?: string
  previousImpulses?: string[] // Vermeidung von Wiederholungen
}

/**
 * Generierter strukturierter Impulse (von der AI)
 */
export interface GeneratedImpulse {
  checkInMessage: string
  taskDescription: string
  expectedOutcome: string
  estimatedMinutes: number
  reflectionQuestion: string
  level: ImpulseLevel
}

/**
 * Helper: Prüft ob ein Schritt abgeschlossen ist
 */
export function isStepCompleted(
  impulse: StructuredImpulse,
  step: ImpulseStepType
): boolean {
  switch (step) {
    case "CHECK_IN":
      return impulse.checkInViewedAt !== null
    case "TASK":
      return impulse.taskStartedAt !== null && impulse.userReflection !== null
    case "REFLECTION":
      return impulse.userReflection !== null && impulse.userReflection.length > 0
    case "EVIDENCE":
      return impulse.evidenceSaved
    default:
      return false
  }
}

/**
 * Helper: Berechnet den Fortschritt (0-100%)
 */
export function calculateProgress(impulse: StructuredImpulse): number {
  const steps = IMPULSE_STEPS
  const completed = steps.filter((step) => isStepCompleted(impulse, step)).length
  return Math.round((completed / steps.length) * 100)
}

/**
 * Helper: Nächster Schritt im Workflow
 */
export function getNextStep(current: ImpulseStep): ImpulseStep | null {
  const currentIndex = IMPULSE_STEPS.indexOf(current)
  if (currentIndex < IMPULSE_STEPS.length - 1) {
    return IMPULSE_STEPS[currentIndex + 1] as ImpulseStep
  }
  return null
}
