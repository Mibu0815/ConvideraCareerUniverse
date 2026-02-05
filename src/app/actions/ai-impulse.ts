"use server"

import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"
import { ImpulseStep } from "@prisma/client"
import { getImpulseLevel, getImpulseConfig } from "@/lib/impulse-levels"
import { logActivity } from "./admin-analytics"

// ─── Types ───────────────────────────────────────────────

export interface SmartImpulseResult {
  success: boolean
  impulseId?: string
  skillName?: string
  taskDescription?: string
  error?: string
}

interface FocusedSkillInfo {
  learningFocusId: string
  skillId: string
  skillName: string
  competenceFieldName: string | null
  currentLevel: number
  targetLevel: number
  functionalLeadId: string | null
  functionalLeadName: string | null
}

// ─── Helper: Get first focused skill ─────────────────────

async function getFirstFocusedSkill(userId: string): Promise<FocusedSkillInfo | null> {
  const plan = await prisma.learningPlan.findUnique({
    where: { userId },
    include: {
      LearningFocus: {
        where: { status: "IN_PROGRESS" },
        include: {
          Skill: { select: { title: true } },
          CompetenceField: {
            select: {
              title: true,
              Owner: { select: { id: true, name: true } }
            }
          },
        },
        orderBy: { focusOrder: "asc" },
        take: 1,
      },
    },
  })

  const focus = plan?.LearningFocus[0]
  if (!focus) return null

  return {
    learningFocusId: focus.id,
    skillId: focus.skillId,
    skillName: focus.Skill.title,
    competenceFieldName: focus.CompetenceField?.title ?? null,
    currentLevel: focus.currentLevel,
    targetLevel: focus.targetLevel,
    functionalLeadId: focus.CompetenceField?.Owner?.id ?? null,
    functionalLeadName: focus.CompetenceField?.Owner?.name ?? null,
  }
}

// ─── Main Action: Generate Smart Impulse ─────────────────

export async function generateSmartImpulse(userId: string): Promise<SmartImpulseResult> {
  try {
    // 1. Get the user's first focused skill
    const focusedSkill = await getFirstFocusedSkill(userId)

    if (!focusedSkill) {
      return {
        success: false,
        error: "Kein fokussierter Skill gefunden. Bitte zuerst einen Skill als Lernziel markieren.",
      }
    }

    // 2. Check for existing incomplete impulse
    const existingImpulse = await prisma.practicalImpulse.findFirst({
      where: {
        learningFocusId: focusedSkill.learningFocusId,
        isCompleted: false,
      },
      orderBy: { generatedAt: "desc" },
    })

    if (existingImpulse) {
      return {
        success: true,
        impulseId: existingImpulse.id,
        skillName: focusedSkill.skillName,
        taskDescription: existingImpulse.taskDescription ?? undefined,
      }
    }

    // 3. Determine impulse level based on target
    const impulseLevel = getImpulseLevel(focusedSkill.targetLevel)
    const levelConfig = getImpulseConfig(impulseLevel)

    // 4. Generate task with Claude API (if available)
    let taskDescription: string
    let checkInMessage: string
    let expectedOutcome: string
    let reflectionQuestion: string

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY

    if (anthropicApiKey) {
      try {
        const anthropic = new Anthropic({ apiKey: anthropicApiKey })

        const systemPrompt = `Du bist ein Karriere-Mentor bei Convidera, einer Digital-Beratung.
Generiere praktische, kurze Lernaufgaben (15-20 Minuten) für Mitarbeiter.

Wichtige Prinzipien:
- Aufgaben MÜSSEN mindestens ein KI-Tool einbeziehen (Claude Code, GitHub Copilot, Cursor, etc.)
- Aufgaben SOLLTEN moderne Cloud-Technologien nutzen (Supabase, Vercel, Edge Functions, etc.)
- Aufgaben müssen im Convidera Consulting-Kontext relevant sein
- Fokus auf praktisches Tun, nicht nur Lesen

Antworte NUR im folgenden JSON-Format:
{
  "taskDescription": "Die konkrete Aufgabe...",
  "checkInMessage": "Motivierende Begrüßung...",
  "expectedOutcome": "Was am Ende entstehen soll...",
  "reflectionQuestion": "Eine Frage zur Reflexion..."
}`

        const userPrompt = `Generiere eine 15-20 Minuten Lernaufgabe für:
- Skill: ${focusedSkill.skillName}
- Kompetenzfeld: ${focusedSkill.competenceFieldName || "Allgemein"}
- Aktuelles Level: ${focusedSkill.currentLevel}
- Ziel-Level: ${focusedSkill.targetLevel}

Die Aufgabe soll:
1. Ein KI-Tool (Claude Code, Copilot, etc.) aktiv nutzen
2. Eine moderne Cloud-Technologie einbeziehen wenn möglich
3. Sofort umsetzbar sein (Daily Spark)`

        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 500,
          messages: [
            { role: "user", content: userPrompt }
          ],
          system: systemPrompt,
        })

        const content = response.content[0]
        if (content.type === "text") {
          try {
            const parsed = JSON.parse(content.text)
            taskDescription = parsed.taskDescription || generateFallbackTask(focusedSkill)
            checkInMessage = parsed.checkInMessage || generateFallbackCheckIn(focusedSkill)
            expectedOutcome = parsed.expectedOutcome || "Dokumentierte Umsetzung"
            reflectionQuestion = parsed.reflectionQuestion || "Was hast du dabei gelernt?"
          } catch {
            // JSON parsing failed, use fallback
            taskDescription = generateFallbackTask(focusedSkill)
            checkInMessage = generateFallbackCheckIn(focusedSkill)
            expectedOutcome = "Dokumentierte Umsetzung"
            reflectionQuestion = "Was war die größte Herausforderung?"
          }
        } else {
          taskDescription = generateFallbackTask(focusedSkill)
          checkInMessage = generateFallbackCheckIn(focusedSkill)
          expectedOutcome = "Dokumentierte Umsetzung"
          reflectionQuestion = "Was war die größte Herausforderung?"
        }
      } catch (apiError) {
        console.error("Claude API error:", apiError)
        taskDescription = generateFallbackTask(focusedSkill)
        checkInMessage = generateFallbackCheckIn(focusedSkill)
        expectedOutcome = "Dokumentierte Umsetzung"
        reflectionQuestion = "Was war die größte Herausforderung?"
      }
    } else {
      // No API key, use template-based generation
      taskDescription = generateFallbackTask(focusedSkill)
      checkInMessage = generateFallbackCheckIn(focusedSkill)
      expectedOutcome = "Dokumentierte Umsetzung"
      reflectionQuestion = "Was war die größte Herausforderung?"
    }

    // 5. Create the impulse in database
    // Estimate minutes based on level (L1: 15min, L2: 20min, L3: 30min, L4: 45min)
    const estimatedMinutes = impulseLevel === "L1_AWARENESS" ? 15
      : impulseLevel === "L2_GUIDED" ? 20
      : impulseLevel === "L3_INDEPENDENT" ? 30
      : 45

    const impulse = await prisma.practicalImpulse.create({
      data: {
        learningFocusId: focusedSkill.learningFocusId,
        targetLevel: impulseLevel,
        prompt: taskDescription,
        taskDescription,
        checkInMessage,
        expectedOutcome,
        estimatedMinutes,
        reflectionQuestion,
        currentStep: "CHECK_IN" as ImpulseStep,
        functionalLeadId: focusedSkill.functionalLeadId,
        functionalLeadName: focusedSkill.functionalLeadName,
        isCompleted: false,
        evidenceSaved: false,
      },
    })

    // 6. Log activity for impulse started (at CHECK_IN step)
    const hasAITool = /claude|copilot|gpt|ai|cursor/i.test(taskDescription)
    const hasCloudTech = /supabase|vercel|edge|serverless|cloud|aws/i.test(taskDescription)

    await logActivity(
      userId,
      "IMPULSE_STARTED",
      impulse.id,
      focusedSkill.skillName,
      {
        skillId: focusedSkill.skillId,
        targetLevel: impulseLevel,
        hasAITool,
        hasCloudTech,
        is2026Tech: hasAITool || hasCloudTech,
      }
    ).catch(console.error) // Don't fail if logging fails

    return {
      success: true,
      impulseId: impulse.id,
      skillName: focusedSkill.skillName,
      taskDescription: impulse.taskDescription ?? undefined,
    }
  } catch (error) {
    console.error("Failed to generate smart impulse:", error)
    return {
      success: false,
      error: "Fehler beim Generieren des Impulses. Bitte versuche es erneut.",
    }
  }
}

// ─── Fallback Task Generation ────────────────────────────

function generateFallbackTask(skill: FocusedSkillInfo): string {
  const tasks = [
    `Nutze Claude Code, um ein kleines Beispiel für "${skill.skillName}" zu erstellen. Dokumentiere dabei, welche Prompts du verwendet hast und wie du das Ergebnis verfeinert hast.`,
    `Recherchiere mit Hilfe von Claude, wie "${skill.skillName}" in einem aktuellen Convidera-Projekt angewendet werden könnte. Erstelle eine kurze Zusammenfassung (max. 5 Bullet Points).`,
    `Implementiere eine Micro-Übung zu "${skill.skillName}" mit GitHub Copilot. Notiere, wie die KI-Unterstützung deinen Workflow beschleunigt hat.`,
    `Erstelle mit Claude Code einen kurzen Guide (3-5 Schritte) zu "${skill.skillName}" für neue Team-Mitglieder.`,
  ]

  return tasks[Math.floor(Math.random() * tasks.length)]
}

function generateFallbackCheckIn(skill: FocusedSkillInfo): string {
  return `Hey! Heute fokussieren wir uns auf **${skill.skillName}** – ein wichtiger Skill für Level ${skill.targetLevel}. Ich habe eine praktische Aufgabe für dich vorbereitet, die du in etwa 15-20 Minuten umsetzen kannst. Los geht's!`
}

// ─── Get Active Impulse ──────────────────────────────────

export async function getActiveImpulse(userId: string) {
  const plan = await prisma.learningPlan.findUnique({
    where: { userId },
    include: {
      LearningFocus: {
        where: { status: "IN_PROGRESS" },
        include: {
          Skill: { select: { title: true } },
          PracticalImpulse: {
            where: { isCompleted: false },
            orderBy: { generatedAt: "desc" },
            take: 1,
          },
        },
        orderBy: { focusOrder: "asc" },
        take: 1,
      },
    },
  })

  const focus = plan?.LearningFocus[0]
  const impulse = focus?.PracticalImpulse[0]

  if (!impulse) return null

  return {
    impulseId: impulse.id,
    skillName: focus.Skill.title,
    currentStep: impulse.currentStep,
    taskDescription: impulse.taskDescription,
    checkInMessage: impulse.checkInMessage,
    expectedOutcome: impulse.expectedOutcome,
    estimatedMinutes: impulse.estimatedMinutes,
    isCompleted: impulse.isCompleted,
  }
}
