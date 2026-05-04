# Career Universe — Admin-Handbuch

> Onboarding-Leitfaden für neue Administratoren, Domain Experten und Stakeholder.
> Letzter Stand: 2026-05-04

---

## Inhalt

1. [Erste Schritte: Zugang & Login](#1-erste-schritte-zugang--login)
2. [Die drei Rollen im Überblick](#2-die-drei-rollen-im-überblick)
3. [Rolle: Nutzer (USER)](#3-rolle-nutzer-user)
4. [Rolle: Domain Experte (FUNCTIONAL_LEAD)](#4-rolle-domain-experte-functional_lead)
5. [Rolle: Admin (ADMIN)](#5-rolle-admin-admin)
6. [Häufige Admin-Aufgaben](#6-häufige-admin-aufgaben)
7. [Troubleshooting](#7-troubleshooting)
8. [Glossar](#8-glossar)

---

## 1. Erste Schritte: Zugang & Login

### 1.1 Account erhalten

Career Universe nutzt **Supabase Auth**. Es gibt zwei Login-Wege:

- **Magic Link** — du erhältst per E-Mail einen einmaligen Login-Link
- **Passwort** — klassisches E-Mail/Passwort-Login

Neue Accounts werden über den Registrierungs-Flow angelegt (`/auth/register`)
oder von einem bestehenden Admin direkt in Supabase eingeladen.

### 1.2 Erster Login

1. Öffne die Plattform-URL (Production: siehe Vercel-Deploy)
2. Klicke "Anmelden" oder rufe `/auth/login` direkt auf
3. Wähle Magic Link oder Passwort
4. Nach erfolgreicher Anmeldung landest du je nach Onboarding-Status auf:
   - `/my-career` — wenn noch keine aktuelle Rolle gesetzt ist
   - `/` (Dashboard) — sobald Rolle + erste Skills definiert sind

### 1.3 Rolle prüfen

Klicke oben rechts auf deine Avatar-Initialen → `/profile`.
Im Profil-Header steht ein Badge mit deiner aktuellen Plattform-Rolle:

- `Mitglied` → USER
- `Domain Expert` → FUNCTIONAL_LEAD
- `Admin` → ADMIN

Falls die Rolle falsch ist: ein bestehender Admin kann sie über
**Profil → Plattform-Verwaltung → Team** anpassen, oder direkt in der
Datenbank im Feld `User.platformRole`.

### 1.4 Mode-Toggle (für Admin / Domain Expert)

Domain Experten und Admins sehen oben im Profil-Header einen
**Mode-Toggle** zwischen:

- **Meine Entwicklung** — die normale User-Sicht (gilt auch für Admins)
- **Plattform-Verwaltung** (Admin) bzw. **Mein Kompetenzfeld** (Domain Expert)

Der Toggle ist persistent während der Session. Beim Browser-Reload
fällt er auf "Meine Entwicklung" zurück.

---

## 2. Die drei Rollen im Überblick

| Funktion | USER | DOMAIN EXPERT | ADMIN |
|---|:---:|:---:|:---:|
| Profil + Karriereziel verwalten | ✓ | ✓ | ✓ |
| Skills auswählen + bewerten | ✓ | ✓ | ✓ |
| Learning Journey + Impulse | ✓ | ✓ | ✓ |
| Evidence einreichen | ✓ | ✓ | ✓ |
| Timeline einsehen | ✓ | ✓ | ✓ |
| Rollen-Vergleich `/my-career/compare` | ✓ | ✓ | ✓ |
| **Eigene Skills im Kompetenzfeld editieren** | ✗ | ✓ (eigenes Feld) | ✓ (alle) |
| **Evidence anderer Nutzer validieren** | ✗ | ✓ (eigenes Feld) | ✓ (alle) |
| **Admin-Dashboard `/admin/dashboard`** | ✗ | ✓ | ✓ |
| **Validierungs-Inbox `/admin/validations`** | ✗ | ✓ | ✓ |
| **Rollen anlegen/bearbeiten/löschen** | ✗ | ✗ | ✓ |
| **Karrierepfade (CareerPath) verwalten** | ✗ | ✗ | ✓ |
| **Kompetenzfelder anlegen** | ✗ | ✗ | ✓ |
| **Domain Experten zuweisen** | ✗ | ✗ | ✓ |
| **Plattform-Übersicht (alle User)** | ✗ | ✗ | ✓ |
| **Design System `/design-system`** | ✗ | ✗ | ✓ |

> **Hinweis:** Admin **ist immer auch Domain Expert** (`isDomainExpert(admin) === true`).
> Ein Admin kann also alle Validierungs- und Skill-Editor-Funktionen über
> alle Kompetenzfelder hinweg nutzen, nicht nur über zugewiesene.

---

## 3. Rolle: Nutzer (USER)

Standard-Rolle bei Account-Anlage. Alle in der Tabelle markierten
Self-Service-Funktionen.

### 3.1 Onboarding-Pfad

1. **`/my-career`** — Aktuelle Rolle wählen (z.B. "Backend Developer Junior")
2. **`/my-career/compare`** — Zielrolle wählen, Skill-Lücke wird berechnet
3. **`/learning-journey`** — Bis zu 3 Fokus-Skills setzen, Impulse durchlaufen
4. **Evidence einreichen** — Nach Abschluss eines Impulses: "Evidence speichern"

### 3.2 Tägliche Nutzung

- **Dashboard `/`** — "Nächster Schritt" zeigt den aktuellen Impuls,
  Streak-Wabe visualisiert die letzten 56 Tage Aktivität
- **`/learning-journey`** — Aktive Fokus-Skills + nächste Schritte
- **`/timeline`** — Chronologische Übersicht aller eigenen Skill-Events

### 3.3 Was kann ein USER **nicht**?

- Andere Profile sehen
- Skills oder Rollen im Katalog ändern
- Evidence anderer Nutzer validieren
- Admin-Routen aufrufen (`/admin/*` redirected zu `/?error=unauthorized`)

---

## 4. Rolle: Domain Experte (FUNCTIONAL_LEAD)

Hat alle USER-Rechte plus Verantwortung für **eines oder mehrere Kompetenzfelder**.
Die Zuordnung erfolgt durch einen Admin (siehe §6.3).

### 4.1 Was Domain Experten zusätzlich tun

#### Eigene Kompetenzfelder verwalten
**Profil → Mein Kompetenzfeld**

Pro zugewiesenem Kompetenzfeld erscheint ein Skill-Tree-Editor:

- **Skill umbenennen** — Klick auf Skill-Chip → Inline-Input
- **Neuer Skill** — `+ Skill hinzufügen` Button am Ende der Liste

Jede Änderung wird sofort persistiert (Server Action `updateSkill` /
`addSkill` aus `src/app/actions/skill-management.ts`).

#### Evidence validieren
**Top-Nav → Validierungen** (`/admin/validations`)

Liste aller offenen Evidence-Einreichungen aus den eigenen Kompetenzfeldern.
Pro Eintrag:
- Wer hat eingereicht
- Welcher Skill, welches selbst eingeschätzte Level
- Beschreibung + Evidence-URL

Aktionen:
- **Validieren** auf Level X (kann vom Self-Level abweichen)
- **Ablehnen** mit optionalem Kommentar

Alle Aktionen erzeugen einen `ValidationEvent` und ein `TimelineEvent`.

#### Admin-Dashboard einsehen
**Top-Nav → Validierungs-Badge zeigt offene Einreichungen**

Auf `/admin/dashboard` können Domain Experten Team-Analytics einsehen
(Skill-Entwicklung, Heatmaps, Tech-Radar) — aber **keine User-Verwaltung**
oder Rollen-Editing.

### 4.2 Was Domain Experten **nicht** dürfen

- Skills in Kompetenzfeldern bearbeiten, die ihnen nicht zugewiesen sind
- Neue Kompetenzfelder anlegen
- Andere User zu Domain Experten promoten
- Rollen oder Karrierepfade verwalten
- Andere Nutzer-Profile verwalten

---

## 5. Rolle: Admin (ADMIN)

Volle Plattform-Hoheit. Alle Funktionen aus USER + DOMAIN EXPERT plus
exklusive Admin-Werkzeuge.

### 5.1 Plattform-Verwaltung

**Profil → Plattform-Verwaltung** öffnet drei Sub-Tabs:

#### Tab "Skill-Trees"
Übersicht **aller** Kompetenzfelder. Pro Feld:
- Aktueller Domain Expert (oder "Kein Domain Experte" als Warnung)
- Anzahl Skills
- Inline-Editor (Add / Rename) — für Admins über alle Felder hinweg

#### Tab "Rollen & Pfade"
Zwei weitere Sub-Tabs:

**Rollen** — Vollständiges CRUD für Role-Records:
- Neue Rolle anlegen (Titel, Slug, Level, Occupational Field, Beschreibung)
- Rolle umbenennen, Beschreibung ändern
- **Skills zur Rolle hinzufügen / entfernen** mit erforderlichem Level (L1–L4)
- Rolle löschen — blockiert wenn User auf der Rolle aktiv sind

**Karrierepfade** — `CareerPath` zwischen Rollen:
- Pfad anlegen via "Von Rolle → Zu Rolle" Dropdowns
- Pfad löschen via Hover-✕

#### Tab "Team"
Übersicht aller User mit:
- Name, E-Mail, aktuelle Rolle, Plattform-Rolle (Mitglied / Domain Expert / Admin)

### 5.2 Validierungs-Inbox (alle Felder)

**Top-Nav → Validierungen** zeigt für Admins **alle offenen Evidence-Einreichungen**
plattformweit, nicht nur die der eigenen Felder.

### 5.3 Admin-Dashboard `/admin/dashboard`

Dunkle Cockpit-Ansicht mit fünf Tabs:

- **KPI Analytics** — Plattform-Kennzahlen
- **Skill-Trends** — welche Skills werden am häufigsten fokussiert
- **Heatmap** — Skill-Verteilung über Mitarbeiter
- **Tech-Radar** — Technologie-Gewichtung
- **Stimme des Teams** — Feedback-Analyse

### 5.4 Design System `/design-system`

Living styleguide mit allen Tokens, Komponenten und Patterns.
**Nur für Admins zugänglich** (Non-Admins werden auf `/` redirected).

Zweck: visuelle Referenz beim UI-Building, Token-QA bei Design-Updates.

---

## 6. Häufige Admin-Aufgaben

### 6.1 Neuen Nutzer einladen

**Variante A — User registriert sich selbst:**
1. User öffnet `/auth/register`, gibt E-Mail + Passwort ein
2. Bestätigung per E-Mail (Resend SMTP)
3. Trigger `handle_new_user` legt automatisch `User`-Profil mit
   `platformRole = USER` an

**Variante B — Admin lädt direkt ein:**
1. Supabase Dashboard → Authentication → Users → Invite
2. User erhält Magic Link
3. Bei erstem Login wird das Prisma-User-Profil angelegt

### 6.2 User zum Admin oder Domain Expert promoten

**Domain Expert:**
1. Profil → Plattform-Verwaltung → Skill-Trees
2. Beim gewünschten Kompetenzfeld auf "Domain Expert zuweisen" klicken
3. User wählen → Server Action `assignDomainExpert` setzt
   `platformRole = FUNCTIONAL_LEAD` UND `competenceField.ownerId = user.id`

**Admin (kein UI dafür — bewusst):**
Direkter DB-Update via Supabase SQL Editor:
```sql
UPDATE "User" SET "platformRole" = 'ADMIN' WHERE email = 'neuer-admin@…';
```

### 6.3 Neues Kompetenzfeld anlegen

Aktuell nur via Server Action `createCompetenceField` (kein dediziertes
UI in der aktuellen Version). Empfohlener Weg:
1. Skill-Master-JSON aktualisieren (`data/skills/hard-skills.json`)
2. Seed-Skript laufen lassen: `npx tsx scripts/seed/seed-skills-master.ts`
3. Anschließend Domain Expert zuweisen wie in §6.2

### 6.4 Neue Rolle anlegen + Karrierepfad zeichnen

1. Profil → Plattform-Verwaltung → Rollen & Pfade → Tab "Rollen"
2. `+ Neue Rolle` → Formular ausfüllen → Anlegen
3. In der Detail-Ansicht: Skills hinzufügen mit Level
4. Tab "Karrierepfade" → Pfad von einer bestehenden Rolle zur neuen anlegen

### 6.5 Skill-Validierung durchführen (Admin oder Domain Expert)

1. Top-Nav → Validierungen (Badge zeigt Anzahl)
2. Eintrag öffnen → Beschreibung + Evidence-URL prüfen
3. **Validieren** → Level bestätigen (oder anpassen)
4. Im User-Profil und in der Timeline erscheint die Validierung

### 6.6 Bulk-Updates (Daten-Migrationen)

**NIE** über `prisma db push` — siehe `README.md` "Database Migrations".
Korrekter Weg:
```bash
# Schema editieren
vi prisma/schema.prisma

# Migration erzeugen
npx prisma migrate dev --name beschreibung

# Production (Vercel Build)
npx prisma migrate deploy
```

Daten-Updates direkt: Supabase SQL Editor oder Skripte unter `scripts/`.

---

## 7. Troubleshooting

### "Mode-Toggle erscheint nicht im Profil"

`platformRole` ist `USER`. Prüfen:
```sql
SELECT email, "platformRole" FROM "User" WHERE email = 'dein@email';
```
Falls `USER`: per SQL auf `ADMIN` oder `FUNCTIONAL_LEAD` setzen
(siehe §6.2). Browser-Cache ggf. leeren.

### "Validierungs-Tab zeigt 0 obwohl es Einreichungen gibt"

Du bist Domain Expert, aber kein Kompetenzfeld ist dir zugeordnet.
Ein Admin muss dir via §6.2 Felder zuweisen.

### "Logout funktioniert nicht / Session bleibt"

Browser hat Supabase-Cookies gecached. Hard-Reload (Cmd+Shift+R) oder
Cookies für die Domain manuell löschen.

### "Skill-Tree-Editor ist read-only obwohl ich Domain Expert bin"

Die Berechtigungs-Logik (`assertFieldOwnerOrAdmin`) prüft
`competenceField.ownerId === user.id`. Falls trotz korrekter
`platformRole` der ownerId nicht gesetzt ist: per SQL korrigieren oder
Admin um Re-Assignment bitten.

### "Karrierepfade fehlen / leer"

CareerPath-Modell wurde im Mai 2026 hinzugefügt. Falls dein lokaler
Datenbank-Stand älter ist: `npx prisma migrate deploy` ausführen.

---

## 8. Glossar

| Begriff | Bedeutung |
|---|---|
| **USER** | Standard-Plattform-Rolle. Self-Service-Karriere-Entwicklung. |
| **FUNCTIONAL_LEAD** | "Domain Expert". Verantwortlich für ein oder mehrere `CompetenceField`s. Validiert Evidence in diesen Feldern. |
| **ADMIN** | Volle Plattform-Verwaltung. Erbt alle Domain-Expert-Rechte über alle Felder. |
| **CompetenceField** | Fachlich abgegrenzter Skill-Bereich (z.B. "Backend Development", "Content Strategy"). Hat genau einen `Owner` (Domain Expert). |
| **OccupationalField** | Berufsfeld auf höherer Ebene (z.B. "Software Engineering", "Digital Marketing"). Gruppiert Rollen. |
| **Role** | Konkrete Karriere-Rolle mit Level (z.B. "Backend Developer Senior"). Verknüpft mit Skills + erforderlichem Level. |
| **CareerPath** | Gerichtete Verbindung "Von Rolle X → Zu Rolle Y" — visualisiert Karriere-Übergänge. |
| **Skill** | Hard Skill (z.B. "JavaScript", "Stakeholder Management"). Hat 4 Level (L1 Learner → L4 Master). |
| **SoftSkill** | Soft Skill (z.B. "Communication Skills", "Strategic Thinking"). Direkt an Rollen gehängt, ohne Level-Skala. |
| **LearningFocus** | Ein vom User gewählter Fokus-Skill innerhalb seines `LearningPlan`. Maximal 3 gleichzeitig. |
| **PracticalImpulse** | Strukturierte Lerneinheit pro Fokus-Skill: CHECK_IN → TASK → REFLECTION → EVIDENCE. |
| **Evidence** | Vom User eingereichter Nachweis für einen Skill-Level. Status: SELF_ASSESSED → EVIDENCE_SUBMITTED → VALIDATED. |
| **ValidationEvent** | Audit-Eintrag jedes Status-Wechsels einer Evidence durch einen Domain Expert. |
| **TimelineEvent** | User-sichtbares Karriere-Event in `/timeline` (Evidence eingereicht, Skill validiert, …). |
| **ActivityLog** | Internes Tracking für die Streak-Wabe auf dem Dashboard. |

---

## Wo geht's weiter?

- **Entwickler-Dokumentation:** [`README.md`](../README.md), [`PROJECT_MAP.md`](./PROJECT_MAP.md)
- **Beispiel-Impuls-Flow:** [`PRACTICAL_IMPULSE_EXAMPLE.md`](./PRACTICAL_IMPULSE_EXAMPLE.md)
- **Session-Historie:** [`SESSION_LOG.md`](./SESSION_LOG.md)
- **Datenbank-Migrations-Workflow:** [`README.md` §"Database Migrations"](../README.md#database-migrations)
- **Live-Styleguide (nur Admin):** `/design-system`

Bei Fragen oder Lücken in der Doku: Issue im Repo oder direkter Ping
an einen bestehenden Admin.
