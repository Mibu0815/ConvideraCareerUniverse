// src/lib/services/mentor-chat.ts
// KI-Mentor Service basierend auf der Anthropic API
// Verwendet RAG-Logik mit den GapAnalysis Ergebnissen als Kontext

import Anthropic from '@anthropic-ai/sdk';
import type { RoleComparisonResult } from './career-logic';

// Check if API key is configured
const API_KEY = process.env.ANTHROPIC_API_KEY;

// Custom error for missing API key
export class MissingApiKeyError extends Error {
  constructor() {
    super('ANTHROPIC_API_KEY is not configured. Please add it to your environment variables.');
    this.name = 'MissingApiKeyError';
  }
}

// Lazy initialization of Anthropic client
function getAnthropicClient(): Anthropic {
  if (!API_KEY || API_KEY === 'sk-ant-api03-...') {
    throw new MissingApiKeyError();
  }
  return new Anthropic({
    apiKey: API_KEY,
  });
}

// Convidera Skill-Level Definitionen für den System-Kontext
const SKILL_LEVEL_DEFINITIONS = `
## Convidera Skill-Level System (1-4)

**Level 1 - Learner:**
- Grundlegendes Verständnis des Konzepts
- Kann einfache Aufgaben unter Anleitung ausführen
- Benötigt regelmäßiges Feedback und Unterstützung

**Level 2 - Practitioner:**
- Solides Arbeitswissen
- Kann Standardaufgaben eigenständig erledigen
- Erkennt typische Probleme und Lösungsansätze

**Level 3 - Expert:**
- Tiefgehendes Fachwissen
- Kann komplexe Probleme lösen und andere anleiten
- Treibt Best Practices im Team voran

**Level 4 - Master:**
- Herausragende Expertise
- Gestaltet strategische Entscheidungen
- Mentor für Experten, entwickelt neue Methoden
`;

const LEADERSHIP_TYPE_DEFINITIONS = `
## Leadership-Typen bei Convidera

**Functional Leadership (Fachliche Führung):**
- Verantwortung für fachliche Qualität und Standards
- Mentoring und Skill-Entwicklung im Team
- Keine disziplinarische Personalverantwortung
- Typisch: Senior → Functional Lead Übergang

**Disciplinary Leadership (Disziplinarische Führung):**
- Vollständige Personalverantwortung
- Budget- und Ressourcenverantwortung
- Strategische Team-Entwicklung
- Typisch: Head of Position
`;

const SYSTEM_PROMPT = `Du bist der Convidera Career Mentor – ein KI-gestützter Karriereberater, der Mitarbeiter bei ihrer beruflichen Entwicklung unterstützt.

${SKILL_LEVEL_DEFINITIONS}

${LEADERSHIP_TYPE_DEFINITIONS}

## Deine Aufgaben:
1. Analysiere die Skill-Gaps zwischen aktueller und Zielrolle
2. Gib konkrete, umsetzbare Entwicklungsempfehlungen
3. Priorisiere nach Impact und Machbarkeit
4. Berücksichtige Leadership-Übergänge besonders

## Kommunikationsstil:
- Professionell aber empathisch
- Konkret und handlungsorientiert
- Motivierend ohne zu übertreiben
- Strukturiert mit klaren nächsten Schritten

## Wichtig:
- Beziehe dich NUR auf die bereitgestellten Daten
- Keine generischen Ratschläge ohne Bezug zur Gap-Analyse
- Skill-Level müssen dem Convidera-System entsprechen (1-4)
- Bei Leadership-Übergängen: Soft Skills besonders betonen
`;

interface MentorMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface MentorAdviceRequest {
  analysis: RoleComparisonResult;
  question?: string;
  conversationHistory?: MentorMessage[];
}

export interface MentorAdviceResponse {
  advice: string;
  keyActions: string[];
  prioritySkills: {
    skill: string;
    currentLevel: number;
    targetLevel: number;
    recommendation: string;
  }[];
}

/**
 * Formatiert die Gap-Analyse als Kontext für den Mentor
 */
function formatAnalysisContext(analysis: RoleComparisonResult): string {
  const { fromRole, toRole, skillComparisons, responsibilityDiff, softSkillComparisons, summary } = analysis;

  let context = '## Karriere-Analyse Kontext\n\n';

  // Rollen-Übersicht
  if (fromRole) {
    context += `**Aktuelle Rolle:** ${fromRole.name} (${fromRole.level})\n`;
    context += `- Leadership-Typ: ${fromRole.leadershipType || 'Keine'}\n\n`;
  } else {
    context += '**Aktuelle Rolle:** Keine (Neueinstieg)\n\n';
  }

  context += `**Zielrolle:** ${toRole.name} (${toRole.level})\n`;
  context += `- Leadership-Typ: ${toRole.leadershipType || 'Keine'}\n`;
  context += `- Budget-Verantwortung: ${toRole.hasBudgetAuth ? 'Ja' : 'Nein'}\n`;
  if (toRole.reportsTo) {
    context += `- Berichtet an: ${toRole.reportsTo}\n`;
  }
  context += '\n';

  // Summary
  context += '### Zusammenfassung\n';
  context += `- Skill-Upgrades benötigt: ${summary.totalSkillUpgrades}\n`;
  context += `- Neue Skills zu erlernen: ${summary.totalNewSkills}\n`;
  context += `- Neue Verantwortlichkeiten: ${summary.newResponsibilities}\n`;
  context += `- Leadership-Veränderung: ${summary.leadershipChange}\n`;
  context += `- Durchschnittliche Level-Steigerung: ${summary.averageLevelIncrease}\n\n`;

  // Skill-Gaps (nur relevante)
  const upgradeSkills = skillComparisons.filter(s => s.delta > 0);
  const newSkills = skillComparisons.filter(s => s.isNew);

  if (upgradeSkills.length > 0) {
    context += '### Skills mit Level-Upgrade\n';
    upgradeSkills.forEach(skill => {
      context += `- **${skill.skillName}**: Level ${skill.fromLevel} → ${skill.toLevel} (+${skill.delta})\n`;
      context += `  Kompetenzfeld: ${skill.competenceFieldName}\n`;
    });
    context += '\n';
  }

  if (newSkills.length > 0) {
    context += '### Neue Skills zu erlernen\n';
    newSkills.forEach(skill => {
      context += `- **${skill.skillName}**: Ziel-Level ${skill.toLevel}\n`;
      context += `  Kompetenzfeld: ${skill.competenceFieldName}\n`;
    });
    context += '\n';
  }

  // Neue Verantwortlichkeiten
  const newResponsibilities = responsibilityDiff.filter(r => r.status === 'added');
  if (newResponsibilities.length > 0) {
    context += '### Neue Verantwortlichkeiten\n';
    newResponsibilities.forEach(resp => {
      context += `- ${resp.text}\n`;
    });
    context += '\n';
  }

  // Soft Skills Änderungen
  const newSoftSkills = softSkillComparisons.filter(s => s.status === 'added');
  if (newSoftSkills.length > 0) {
    context += '### Neue Soft Skills erforderlich\n';
    newSoftSkills.forEach(skill => {
      context += `- ${skill.name}`;
      if (skill.category) context += ` (${skill.category})`;
      context += '\n';
    });
    context += '\n';
  }

  return context;
}

/**
 * Generiert personalisierte Karriereberatung basierend auf der Gap-Analyse
 */
export async function getMentorAdvice(request: MentorAdviceRequest): Promise<MentorAdviceResponse> {
  const { analysis, question, conversationHistory = [] } = request;

  const analysisContext = formatAnalysisContext(analysis);

  // Baue die Nachrichten-Historie auf
  const messages: Anthropic.MessageParam[] = [];

  // Füge den Analyse-Kontext als erste User-Nachricht ein
  const initialUserMessage = `${analysisContext}

${question || 'Bitte gib mir eine personalisierte Karriereberatung basierend auf dieser Gap-Analyse. Fokussiere auf die wichtigsten 3-5 Entwicklungsschritte.'}`;

  // Füge vorherige Konversation hinzu (falls vorhanden)
  if (conversationHistory.length > 0) {
    messages.push({ role: 'user', content: analysisContext });
    conversationHistory.forEach(msg => {
      messages.push({ role: msg.role, content: msg.content });
    });
    if (question) {
      messages.push({ role: 'user', content: question });
    }
  } else {
    messages.push({ role: 'user', content: initialUserMessage });
  }

  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages,
  });

  // Extrahiere den Text aus der Response
  const adviceText = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map(block => block.text)
    .join('\n');

  // Extrahiere strukturierte Daten aus der Antwort
  const keyActions = extractKeyActions(adviceText);
  const prioritySkills = extractPrioritySkills(adviceText, analysis);

  return {
    advice: adviceText,
    keyActions,
    prioritySkills,
  };
}

/**
 * Generiert eine initiale Begrüßung/Übersicht für den Mentor
 */
export async function getMentorGreeting(analysis: RoleComparisonResult): Promise<string> {
  const { fromRole, toRole, summary } = analysis;

  const fromName = fromRole?.name || 'Ihrem aktuellen Stand';
  const toName = toRole.name;

  // Kurze, einladende Begrüßung ohne API-Call für schnellere Ladezeit
  let greeting = `Willkommen! Ich analysiere Ihren Karriereweg von **${fromName}** zu **${toName}**.\n\n`;

  if (summary.totalNewSkills > 0 || summary.totalSkillUpgrades > 0) {
    greeting += `Auf einen Blick:\n`;
    if (summary.totalSkillUpgrades > 0) {
      greeting += `- ${summary.totalSkillUpgrades} Skills müssen auf ein höheres Level entwickelt werden\n`;
    }
    if (summary.totalNewSkills > 0) {
      greeting += `- ${summary.totalNewSkills} neue Skills sind zu erlernen\n`;
    }
    if (summary.newResponsibilities > 0) {
      greeting += `- ${summary.newResponsibilities} neue Verantwortlichkeiten kommen hinzu\n`;
    }
    if (summary.leadershipChange !== 'none') {
      const leadershipText = {
        gained: 'Sie übernehmen erstmals Führungsverantwortung',
        upgraded: 'Ihre Führungsverantwortung erweitert sich',
        lost: 'Die Zielrolle hat keine Führungsverantwortung',
      };
      greeting += `- ${leadershipText[summary.leadershipChange]}\n`;
    }
  }

  greeting += '\nFragen Sie mich nach konkreten Empfehlungen!';

  return greeting;
}

/**
 * Chat-Funktion für Follow-up Fragen
 */
export async function chatWithMentor(
  analysis: RoleComparisonResult,
  userMessage: string,
  conversationHistory: MentorMessage[]
): Promise<string> {
  const response = await getMentorAdvice({
    analysis,
    question: userMessage,
    conversationHistory,
  });

  return response.advice;
}

/**
 * Kurzer, motivierender Evidence-Nudge nach einem Self-Assessment.
 * Verwendet denselben Anthropic-Client wie die restlichen Mentor-Funktionen.
 */
export async function getEvidenceNudge(params: {
  skillName: string
  newLevel: number
  competenceField: string
}): Promise<string> {
  const levelLabels = ['', 'Learner', 'Practitioner', 'Advanced', 'Master']
  const label = levelLabels[params.newLevel] ?? `Level ${params.newLevel}`

  const userMessage = `
Der Mitarbeiter hat gerade ${params.skillName} (${params.competenceField}) auf Level ${params.newLevel} (${label}) eingeschätzt.

Schreibe eine kurze, motivierende Aufforderung (2 Sätze, informell, Du-Form), die den Mitarbeiter ermutigt, eine konkrete Evidence dafür einzureichen. Nenne ein spezifisches Beispiel, was als Evidence für L${params.newLevel} in diesem Skill-Bereich passen würde. Nur der Text, keine Formatierung.
`.trim()

  const client = getAnthropicClient()
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    system:
      'Du bist der Convidera Career Mentor. Antworte knapp, motivierend, Du-Form, ohne Markdown.',
    messages: [{ role: 'user', content: userMessage }],
  })

  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim()
}

// Helper: Extrahiert Key Actions aus dem Advice-Text
function extractKeyActions(text: string): string[] {
  const actions: string[] = [];
  const lines = text.split('\n');

  let inActionSection = false;
  for (const line of lines) {
    // Suche nach nummerierten Listen oder Bullet Points
    const actionMatch = line.match(/^[\d\-\*•]\.\s*(.+)$|^[\-\*•]\s*(.+)$/);
    if (actionMatch) {
      const action = actionMatch[1] || actionMatch[2];
      if (action && action.length > 10 && action.length < 200) {
        actions.push(action.trim());
      }
    }

    // Erkenne Abschnittstitel für Actions
    if (line.toLowerCase().includes('nächste schritte') ||
        line.toLowerCase().includes('empfehlungen') ||
        line.toLowerCase().includes('aktionsplan')) {
      inActionSection = true;
    }
  }

  return actions.slice(0, 5); // Max 5 Actions
}

// Helper: Extrahiert Priority Skills aus dem Text und der Analyse
function extractPrioritySkills(
  _text: string,
  analysis: RoleComparisonResult
): MentorAdviceResponse['prioritySkills'] {
  // Kombiniere Skills mit dem höchsten Delta und neue Skills
  const allSkills = analysis.skillComparisons
    .filter(s => s.delta > 0 || s.isNew)
    .sort((a, b) => {
      // Priorisiere nach Delta, dann nach Ziel-Level
      if (a.isNew && !b.isNew) return -1;
      if (!a.isNew && b.isNew) return 1;
      return b.delta - a.delta || b.toLevel - a.toLevel;
    })
    .slice(0, 5);

  return allSkills.map(skill => ({
    skill: skill.skillName,
    currentLevel: skill.fromLevel,
    targetLevel: skill.toLevel,
    recommendation: skill.isNew
      ? `Neuer Skill - starten Sie mit Grundlagen und arbeiten Sie zu Level ${skill.toLevel}`
      : `Entwickeln Sie sich von Level ${skill.fromLevel} zu ${skill.toLevel} (+${skill.delta})`,
  }));
}
