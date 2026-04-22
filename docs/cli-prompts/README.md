# CLI Prompts Index

Dokumentierte Claude Code Prompts für dieses Projekt.
Chronologisch nach Thema gruppiert.

## Review & Security
- `review-prompt.md` — 9-teiliger Code Review + Security Audit
  (Git-State, Schema, TypeScript, DB-Content, Files, CSP, Dev-Server, Vercel)
- `nachpatch-prompt.md` — Admin-Validations-Route, archiveSkill, Settings-Patches

## Feature Build
- `evidence-timeline-prompt.md` — Evidence-Timeline Feature (10 Phasen)
- `profile-roles-prompt.md` — Dual-Role Profile Pages (Personal / Domain-Expert /
  Admin), Skill-Tree-Editor, Mode-Toggle

## Data & Content
- `complete-role-seed-prompt.md` — 37 Rollen über 8 Occupational Fields seeden
  (wurde zu 41 über 7 OFs nach Sales-OF-Cleanup + Product-Designer-Erweiterung)

## Usage

```bash
# Prompt in Claude Code laden
claude < docs/cli-prompts/<prompt-name>.md
```

## Konventionen

- **Schema ist Quelle der Wahrheit**: Prompts enthalten oft spekulative
  Feldnamen. Immer gegen `prisma/schema.prisma` validieren.
- **Große Prompts stückeln**: Bei >500 Zeilen Review-Checkpoints nach
  jeder Phase einbauen, damit der Agent zwischendurch Feedback bekommt.
- **Adaptationen dokumentieren**: Wenn Prompt-Code vom Schema abweicht,
  im Commit-Message erwähnen (z.B. "schema-conform adapted: X → Y").

## Gaps
Folgende Prompts wurden im Verlauf verwendet, sind aber nicht mehr als
Datei im Repo (gingen über Konversation, nicht über Datei-Prompt):

- Dual-Role Profile Follow-ups (Badge-Styling, Permissions-Helper)
- Roles & Career Paths CRUD (als Teil von `profile-roles-prompt.md` erweitert)
- Phase 1 Design Foundation (Tokens, Layout-Primitives)
- Phase 2a-d Navigation & Dashboard Redesign
- Legacy Soft-Skills Cleanup (ad-hoc, via Backup + deleteMany)

Falls künftig wieder benötigt: aus den Commits (21.-22. April 2026) rekonstruierbar.
