// src/lib/impulse-levels.ts
// Level-Didaktik Konfiguration für AI Impulse

import type { ImpulseLevel } from "@prisma/client"

export interface ImpulseConfig {
  label: string
  maxMinutes: number
  outputType: string
  systemContext: string
}

export const IMPULSE_CONFIG: Record<ImpulseLevel, ImpulseConfig> = {
  L1_AWARENESS: {
    label: "Verstehen & Erkennen",
    maxMinutes: 30,
    outputType: "Beobachtung oder Recherche-Ergebnis",
    systemContext: `Der Nutzer ist auf AWARENESS-Level (L1). Generiere Aufgaben zum:
- Beobachten und Identifizieren von Best Practices
- Recherchieren von Grundlagen und Konzepten
- Sammeln von Beispielen aus dem Arbeitsalltag
Die Aufgabe sollte in maximal 30 Minuten machbar sein.`
  },
  L2_GUIDED: {
    label: "Anwenden mit Unterstützung",
    maxMinutes: 45,
    outputType: "Anwendungsbeispiel mit Feedback",
    systemContext: `Der Nutzer ist auf GUIDED-Level (L2). Generiere Aufgaben zum:
- Anwenden von Gelerntem mit Hilfestellung
- Einholen von Feedback zu ersten Versuchen
- Strukturiertes Nachahmen von Vorbildern
Die Aufgabe sollte in maximal 45 Minuten machbar sein.`
  },
  L3_INDEPENDENT: {
    label: "Selbstständig Umsetzen",
    maxMinutes: 60,
    outputType: "Eigenständige Lösung mit Dokumentation",
    systemContext: `Der Nutzer ist auf INDEPENDENT-Level (L3). Generiere Aufgaben zum:
- Eigenständigen Implementieren von Lösungen
- Dokumentieren des Vorgehens und der Entscheidungen
- Reflektieren über Alternativen und Trade-offs
Die Aufgabe sollte in maximal 60 Minuten machbar sein.`
  },
  L4_EXPERT: {
    label: "Weitergeben & Standards setzen",
    maxMinutes: 60,
    outputType: "Mentorat oder Standardisierung",
    systemContext: `Der Nutzer ist auf EXPERT-Level (L4). Generiere Aufgaben zum:
- Mentoring von Kollegen in diesem Skill
- Definieren oder Verbessern von Standards und Best Practices
- Leiten von Workshops oder Knowledge-Sharing Sessions
Die Aufgabe sollte in maximal 60 Minuten machbar sein.`
  }
}

export function getImpulseLevel(requiredLevel: number): ImpulseLevel {
  switch (requiredLevel) {
    case 1:
      return "L1_AWARENESS"
    case 2:
      return "L2_GUIDED"
    case 3:
      return "L3_INDEPENDENT"
    case 4:
      return "L4_EXPERT"
    default:
      return "L1_AWARENESS"
  }
}

export function getImpulseConfig(level: ImpulseLevel): ImpulseConfig {
  return IMPULSE_CONFIG[level]
}
