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
    let vorbereitungText: string | null = null
    let durchfuehrungText: string | null = null
    let ergebnisCheckText: string | null = null
    let supportConcept: string | null = null
    let supportExplanation: string | null = null
    let supportTemplate: string | null = null

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY

    if (anthropicApiKey) {
      try {
        const anthropic = new Anthropic({ apiKey: anthropicApiKey })

        const systemPrompt = `Du bist ein supportiver Lern-Coach bei Convidera (Digital-Beratung).

## GLASHAUS-PRINZIP (WICHTIG!)
Jeder Fachbegriff (ADR, Stakeholder-Map, User Story, etc.) muss beim ersten Auftreten erklärt werden.
Format: "**Begriff** – kurze Erklärung in einfacher Sprache"

## DREI-SCHRITTE-MODELL
Jede Aufgabe besteht aus:
1. **Vorbereitung**: Was sammeln/klären bevor man startet (max 5 Min)
2. **Durchführung**: Die eigentliche Aufgabe Schritt für Schritt
3. **Ergebnis-Check**: Wie prüft man, ob es gelungen ist

## TONALITÄT
- Supportiv und ermutigend, NICHT bewertend
- "Du könntest..." statt "Du musst..."
- "Das ist ein guter erster Schritt" statt "Richtig/Falsch"
- Normalisiere Unsicherheit: "Es ist völlig okay, wenn..."

## SCAFFOLDING
Generiere eine Vorlage/Template, die den Einstieg erleichtert.

Antworte NUR im folgenden JSON-Format:
{
  "checkInMessage": "Persönliche, ermutigende Begrüßung mit Kontext zum Skill",
  "taskDescription": "Überblick der Aufgabe (1-2 Sätze)",
  "vorbereitung": "Schritt 1: Was vorbereiten (mit erklärten Begriffen)",
  "durchfuehrung": "Schritt 2: Die Durchführung als nummerierte Liste",
  "ergebnisCheck": "Schritt 3: Wie man das Ergebnis prüft",
  "expectedOutcome": "Was am Ende entstehen soll",
  "reflectionQuestion": "Offene Reflexionsfrage (nicht bewertend)",
  "supportConcept": "Der wichtigste erklärte Begriff",
  "supportExplanation": "Die Erklärung dazu in 1-2 Sätzen",
  "supportTemplate": "Markdown-Template als Starthilfe (z.B. Checkliste, Gliederung)"
}`

        const userPrompt = `Generiere eine praktische Lernaufgabe für:
- Skill: ${focusedSkill.skillName}
- Kompetenzfeld: ${focusedSkill.competenceFieldName || "Allgemein"}
- Aktuelles Level: ${focusedSkill.currentLevel} (von 4)
- Ziel-Level: ${focusedSkill.targetLevel}

Wichtig:
- Erkläre JEDEN Fachbegriff beim ersten Auftreten (Glashaus-Prinzip)
- Nutze supportive Sprache ("Du könntest...", "Ein guter Ansatz wäre...")
- Erstelle ein hilfreiches Template für den Einstieg
- Die Aufgabe soll in 15-30 Minuten machbar sein
- Wenn möglich, integriere ein KI-Tool (Claude, Copilot) als Unterstützung`

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
            // New three-step model fields
            vorbereitungText = parsed.vorbereitung || null
            durchfuehrungText = parsed.durchfuehrung || null
            ergebnisCheckText = parsed.ergebnisCheck || null
            // Scaffolding support fields
            supportConcept = parsed.supportConcept || null
            supportExplanation = parsed.supportExplanation || null
            supportTemplate = parsed.supportTemplate || null
          } catch {
            // JSON parsing failed, use fallback
            const fallback = generateFallbackWithStructure(focusedSkill)
            taskDescription = fallback.taskDescription
            checkInMessage = fallback.checkInMessage
            expectedOutcome = fallback.expectedOutcome
            reflectionQuestion = fallback.reflectionQuestion
            vorbereitungText = fallback.vorbereitungText
            durchfuehrungText = fallback.durchfuehrungText
            ergebnisCheckText = fallback.ergebnisCheckText
            supportConcept = fallback.supportConcept
            supportExplanation = fallback.supportExplanation
            supportTemplate = fallback.supportTemplate
          }
        } else {
          const fallback = generateFallbackWithStructure(focusedSkill)
          taskDescription = fallback.taskDescription
          checkInMessage = fallback.checkInMessage
          expectedOutcome = fallback.expectedOutcome
          reflectionQuestion = fallback.reflectionQuestion
          vorbereitungText = fallback.vorbereitungText
          durchfuehrungText = fallback.durchfuehrungText
          ergebnisCheckText = fallback.ergebnisCheckText
          supportConcept = fallback.supportConcept
          supportExplanation = fallback.supportExplanation
          supportTemplate = fallback.supportTemplate
        }
      } catch (apiError) {
        console.error("Claude API error:", apiError)
        const fallback = generateFallbackWithStructure(focusedSkill)
        taskDescription = fallback.taskDescription
        checkInMessage = fallback.checkInMessage
        expectedOutcome = fallback.expectedOutcome
        reflectionQuestion = fallback.reflectionQuestion
        vorbereitungText = fallback.vorbereitungText
        durchfuehrungText = fallback.durchfuehrungText
        ergebnisCheckText = fallback.ergebnisCheckText
        supportConcept = fallback.supportConcept
        supportExplanation = fallback.supportExplanation
        supportTemplate = fallback.supportTemplate
      }
    } else {
      // No API key, use template-based generation
      const fallback = generateFallbackWithStructure(focusedSkill)
      taskDescription = fallback.taskDescription
      checkInMessage = fallback.checkInMessage
      expectedOutcome = fallback.expectedOutcome
      reflectionQuestion = fallback.reflectionQuestion
      vorbereitungText = fallback.vorbereitungText
      durchfuehrungText = fallback.durchfuehrungText
      ergebnisCheckText = fallback.ergebnisCheckText
      supportConcept = fallback.supportConcept
      supportExplanation = fallback.supportExplanation
      supportTemplate = fallback.supportTemplate
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
        // Three-step model
        vorbereitungText,
        durchfuehrungText,
        ergebnisCheckText,
        // Scaffolding support
        supportConcept,
        supportExplanation,
        supportTemplate,
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

// ─── Fallback Task Generation with Three-Step Model ────────

interface FallbackImpulse {
  taskDescription: string
  checkInMessage: string
  expectedOutcome: string
  reflectionQuestion: string
  vorbereitungText: string
  durchfuehrungText: string
  ergebnisCheckText: string
  supportConcept: string
  supportExplanation: string
  supportTemplate: string
}

function generateFallbackWithStructure(skill: FocusedSkillInfo): FallbackImpulse {
  // Detect if this is a soft skill based on common patterns
  const isSoftSkill = /stakeholder|kommunikation|feedback|präsentation|moderation|coaching|leadership|team|konflikt|verhandlung/i.test(skill.skillName)

  if (isSoftSkill) {
    return generateSoftSkillFallback(skill)
  }
  return generateTechnicalSkillFallback(skill)
}

function generateSoftSkillFallback(skill: FocusedSkillInfo): FallbackImpulse {
  return {
    checkInMessage: `Hey! Heute geht es um **${skill.skillName}** – ein Skill, der in Zeiten von KI noch wichtiger wird. Warum? Während KI immer mehr technische Aufgaben übernimmt, bleibt die menschliche Verbindung dein Alleinstellungsmerkmal. Lass uns das gemeinsam üben!`,

    taskDescription: `Führe ein kurzes "Pulse-Check" Gespräch mit einem Stakeholder oder Teammitglied durch.`,

    vorbereitungText: `**Was ist ein Pulse-Check?** – Ein kurzes, informelles Gespräch (5-10 Min), um frühzeitig Stimmungen und Bedenken wahrzunehmen.

1. Wähle eine Person aus deinem aktuellen Projekt, mit der du diese Woche noch nicht gesprochen hast
2. Überlege dir einen konkreten Anknüpfungspunkt (z.B. ein Modul, ein Meeting, eine Deadline)`,

    durchfuehrungText: `1. Sprich die Person kurz an (persönlich, Teams oder Slack)
2. Nutze einen lockeren Einstieg: "Hey, kurze Frage zu [Thema]..."
3. Stelle eine offene Frage: "Wo siehst du aktuell die größte Hürde für uns?"
4. Höre aktiv zu – keine Lösungen anbieten, nur verstehen
5. Bedanke dich für die Offenheit`,

    ergebnisCheckText: `✓ Du hast mindestens eine neue Information erhalten
✓ Die Person fühlte sich gehört (nicht "abgefertigt")
✓ Du hast keine Versprechungen gemacht, die du nicht halten kannst`,

    expectedOutcome: `Ein kurzes Gespräch mit einer dokumentierten Erkenntnis`,

    reflectionQuestion: `Was hat dich überrascht? Gab es etwas, das du ohne dieses Gespräch nicht erfahren hättest?`,

    supportConcept: `Pulse-Check`,

    supportExplanation: `Ein Pulse-Check ist ein kurzes, informelles Gespräch, um frühzeitig Stimmungen, Bedenken oder Blocker wahrzunehmen – bevor sie zu echten Problemen werden.`,

    supportTemplate: `## Gesprächsleitfaden: Pulse-Check

**Einstieg:**
"Hey [Name], hast du kurz 5 Minuten? Ich wollte mal kurz zu [Thema/Projekt] nachhaken."

**Kernfrage:**
"Wie läuft es aus deiner Sicht? Wo siehst du aktuell die größte Hürde?"

**Follow-up:**
"Gibt es etwas, das ich tun kann, um dir zu helfen?"

**Abschluss:**
"Danke für deine Offenheit! Ich melde mich, wenn ich etwas herausfinde."

---
📝 **Notizen:**
- Person:
- Thema:
- Wichtigste Erkenntnis:
- Mögliche Aktion:`
  }
}

function generateTechnicalSkillFallback(skill: FocusedSkillInfo): FallbackImpulse {
  return {
    checkInMessage: `Hey! Heute arbeiten wir an **${skill.skillName}** für Level ${skill.targetLevel}. Ich habe eine praktische Übung vorbereitet, die du mit KI-Unterstützung in 15-20 Minuten umsetzen kannst. Kein Vorwissen nötig – ich erkläre alles!`,

    taskDescription: `Erstelle ein kleines Beispiel für "${skill.skillName}" mit KI-Unterstützung.`,

    vorbereitungText: `**Was brauchst du?**
- Zugang zu Claude, ChatGPT oder GitHub Copilot
- Optional: Ein aktuelles Projekt als Kontext

**Begriffserklärung:**
- **Prompt** – Die Anweisung, die du der KI gibst
- **Iteration** – Das schrittweise Verbessern des Ergebnisses durch Nachfragen`,

    durchfuehrungText: `1. Öffne dein KI-Tool (Claude, Copilot, etc.)
2. Beschreibe dein Ziel in einfachen Worten: "Ich möchte [Skill] für [Kontext] anwenden"
3. Lass dir ein erstes Beispiel generieren
4. Stelle Nachfragen zur Verbesserung: "Kannst du das vereinfachen?" oder "Erkläre mir den ersten Schritt genauer"
5. Dokumentiere deinen besten Prompt für später`,

    ergebnisCheckText: `✓ Du hast ein konkretes Beispiel erstellt
✓ Du verstehst, was der Code/die Lösung macht
✓ Du könntest einem Kollegen erklären, wie du vorgegangen bist`,

    expectedOutcome: `Ein dokumentiertes Beispiel mit den verwendeten Prompts`,

    reflectionQuestion: `Welcher Prompt hat am besten funktioniert? Was würdest du beim nächsten Mal anders machen?`,

    supportConcept: `Prompt Engineering`,

    supportExplanation: `Prompt Engineering ist die Kunst, KI-Systeme durch klare Anweisungen zu steuern. Je präziser dein Prompt, desto besser das Ergebnis.`,

    supportTemplate: `## Mein ${skill.skillName} Experiment

**Ziel:**
[Was möchte ich erreichen?]

**Mein bester Prompt:**
\`\`\`
[Hier den Prompt einfügen]
\`\`\`

**Ergebnis:**
[Was kam heraus?]

**Gelernt:**
- [Erkenntnis 1]
- [Erkenntnis 2]

**Nächster Schritt:**
[Was möchte ich als nächstes ausprobieren?]`
  }
}

function generateFallbackTask(skill: FocusedSkillInfo): string {
  return generateFallbackWithStructure(skill).taskDescription
}

function generateFallbackCheckIn(skill: FocusedSkillInfo): string {
  return generateFallbackWithStructure(skill).checkInMessage
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
