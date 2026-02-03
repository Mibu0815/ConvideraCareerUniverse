# Practical Impulse - Beispiel

## Szenario

**Nutzer:** Lisa Müller, Professional Consultant bei Convidera
**Fokus-Skill:** "API Design"
**Aktuelles Level:** 2 (Guided)
**Ziel-Level:** 3 (Independent)
**Functional Lead:** Max Schmidt (Competence Field Owner: Backend Development)

---

## Der 4-Phasen Workflow

### Phase 1: CHECK-IN

```
┌─────────────────────────────────────────────────────────────────┐
│  💬 Check-In                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Ich sehe, du arbeitest an **API Design** für Level 3.          │
│  Das ist ein wichtiger Schritt auf deinem Entwicklungsweg       │
│  bei Convidera – lass uns das gemeinsam angehen!                │
│                                                                 │
│  🎯 Level 2 → 3     ⏱ ~60 Min                                   │
│                                                                 │
│  ┌─────────────────────────────────────────────┐                │
│  │          Los geht's!              →         │                │
│  └─────────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

**Was passiert:**
- Personalisierte Begrüßung mit Skill-Name und Ziel-Level
- Motivierende, partnerschaftliche Sprache (Convidera-Spirit)
- Klare Übersicht über Zeitinvestment

---

### Phase 2: TASK (Die Aufgabe)

```
┌─────────────────────────────────────────────────────────────────┐
│  📋 Deine Aufgabe                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Übernimm eigenverantwortlich eine Aufgabe, die API Design      │
│  erfordert. Dokumentiere deine Entscheidungen und               │
│  Begründungen in einem kurzen Architecture Decision Record      │
│  (ADR).                                                         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Erwartetes Ergebnis: Implementierung + ADR              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │          Aufgabe erledigt            ✓                  │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

**Was passiert:**
- Konkrete, praxisnahe Aufgabe (30-60 Minuten)
- Direkt im Convidera-Arbeitsalltag umsetzbar
- Klares Deliverable definiert

**Level-spezifische Didaktik:**

| Level | Fokus | Beispiel-Aufgabe |
|-------|-------|------------------|
| L1 (Awareness) | Beobachten & Recherchieren | "Suche im Projekt ein Beispiel für API Design und dokumentiere..." |
| L2 (Guided) | Anwenden mit Feedback | "Erstelle einen Entwurf und bitte Max um Feedback..." |
| L3 (Independent) | Eigenständig umsetzen | "Übernimm eigenverantwortlich und dokumentiere in ADR..." |
| L4 (Expert) | Wissen weitergeben | "Halte eine Session über API Best Practices für das Team..." |

---

### Phase 3: REFLECTION (Reflexion)

```
┌─────────────────────────────────────────────────────────────────┐
│  🧠 Reflexion                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Was war die größte Herausforderung dabei?                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Die Entscheidung zwischen REST und GraphQL war          │    │
│  │ schwierig. Ich habe mich für REST entschieden, weil     │    │
│  │ unser Team damit mehr Erfahrung hat und die Clients     │    │
│  │ einfacher zu implementieren sind. Das ADR hat mir       │    │
│  │ geholfen, die Entscheidung klar zu begründen.           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │          Weiter zur Evidence              →             │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

**Was passiert:**
- Strukturierte Reflexion über Herausforderungen
- Fördert tieferes Lernen durch Verbalisierung
- Vorbereitung für das Assessment-Gespräch

---

### Phase 4: EVIDENCE (Evidence-Brücke)

```
┌─────────────────────────────────────────────────────────────────┐
│  🏆 Evidence-Brücke                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Wenn du das erledigt hast, speichere ich deine Notizen         │
│  direkt als Beleg für **Max Schmidt**.                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 👤 Deine Reflexion                                      │    │
│  │                                                         │    │
│  │ "Die Entscheidung zwischen REST und GraphQL war         │    │
│  │ schwierig. Ich habe mich für REST entschieden..."       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │    🏆   Als Beleg speichern                             │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

**Was passiert:**
- Reflexion wird als EvidenceNote gespeichert
- Automatisch mit `isAssessmentReady: true` markiert
- Functional Lead kann den Fortschritt einsehen

---

## Datenfluss

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   LearningFocus  │────▶│ PracticalImpulse │────▶│   EvidenceNote   │
│                  │     │                  │     │                  │
│  skillId         │     │  checkInMessage  │     │  content         │
│  currentLevel: 2 │     │  taskDescription │     │  isAssessmentRdy │
│  targetLevel: 3  │     │  reflectionQ     │     │                  │
│                  │     │  currentStep     │     │                  │
│                  │     │  evidenceNoteId ─┼────▶│                  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                                  │
                                  │ functionalLeadId
                                  ▼
                         ┌──────────────────┐
                         │      User        │
                         │  (Max Schmidt)   │
                         │  Functional Lead │
                         └──────────────────┘
```

---

## UI-Komponente verwenden

```tsx
import { StructuredImpulseCard } from "@/components/learning-journey"
import {
  generateStructuredImpulse,
  updateImpulseStep,
  saveImpulseEvidence
} from "@/app/actions/learning-journey"

export function SkillLearningView({ learningFocus, userId }) {
  return (
    <StructuredImpulseCard
      learningFocusId={learningFocus.id}
      existingImpulse={learningFocus.PracticalImpulse[0]}
      skillName={learningFocus.Skill.title}
      currentLevel={learningFocus.currentLevel}
      targetLevel={learningFocus.targetLevel}
      functionalLeadName={learningFocus.CompetenceField?.User?.name}
      onGenerateImpulse={async (focusId) => {
        return generateStructuredImpulse(focusId, userId)
      }}
      onUpdateStep={async (impulseId, step, data) => {
        return updateImpulseStep(impulseId, step, data)
      }}
      onSaveEvidence={async (impulseId, reflection) => {
        return saveImpulseEvidence(impulseId, reflection, userId)
      }}
      onRefresh={() => router.refresh()}
    />
  )
}
```

---

## Step-by-Step Progress Indicator

Die Komponente zeigt visuell den Fortschritt durch die 4 Phasen:

```
  ○ Check-In  →  ○ Aufgabe  →  ○ Reflexion  →  ○ Evidence
  ────────────────────────────────────────────────────────
       ✓             ●              ○              ○
     (done)      (active)      (pending)      (pending)
```

**Progress-Berechnung:**
- 0%: Neu generiert
- 25%: Check-In abgeschlossen
- 50%: Aufgabe markiert als erledigt
- 75%: Reflexion eingegeben
- 100%: Evidence gespeichert

---

## Zusammenfassung

| Komponente | Funktion |
|------------|----------|
| **Check-In** | Personalisierte Begrüßung, motivierender Einstieg |
| **Aufgabe** | 30-60 Min praxisnahe Übung im Convidera-Alltag |
| **Reflexion** | "Was war die größte Herausforderung dabei?" |
| **Evidence-Brücke** | Speicherung als Beleg für Functional Lead |

**Convidera-Spirit:**
- Partnerschaftliche Sprache
- Motivierend und professionell
- Klare Erwartungen und Deliverables
- Direkte Verknüpfung zum Assessment-Prozess
