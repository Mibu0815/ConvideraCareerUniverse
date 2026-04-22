# Career Universe 2.0

Career comparison platform for Convidera - analyze skill gaps and discover career paths.

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

### 3. Initialize database & seed data

```bash
# Push schema to Supabase
pnpm prisma db push

# Seed soft skills and roles from HTML files
pnpm db:seed --html ./data/roles/*.html

# Or seed from JSON files
pnpm db:seed:json
```

### 4. Start development server

```bash
pnpm dev
```

## Database Setup (Supabase)

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings > Database** and copy:
   - **Connection string (Session mode)** → `DATABASE_URL`
   - **Connection string (Transaction mode)** → `DIRECT_URL`
3. Replace `[YOUR-PASSWORD]` with your database password

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL via Supabase
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Animations**: Framer Motion
- **AI**: Anthropic Claude (Career Mentor)

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm db:seed` | Seed database from HTML files |
| `pnpm db:seed:json` | Seed database from JSON files |
| `pnpm prisma studio` | Open Prisma database GUI |

## Project Structure

```
src/
├── app/
│   ├── my-career/compare/    # Role comparison feature
│   ├── actions/              # Server actions
│   └── globals.css           # Global styles
├── lib/
│   ├── career-logic.ts       # Gap analysis algorithms
│   └── prisma.ts             # Database client
data/
├── roles/                    # Role definition files (HTML/JSON)
scripts/
└── seed/                     # Database seeders
```

## Deployment (Vercel)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `ANTHROPIC_API_KEY`
4. Deploy

## Database Migrations

Migration history was realigned with the live schema on 2026-04-22.
The single `20240115000000_init` migration represents the full current
production schema (24 tables, 12 enums).

### Schema changes workflow

1. Edit `prisma/schema.prisma`
2. Create migration: `npx prisma migrate dev --name descriptive_name`
3. Commit both the schema change AND the new migration directory

### Production deployment

Run on the production database after deploy:

```bash
npx prisma migrate deploy
```

### Don't use

- `prisma db push` — bypasses migration history (got us into baselining
  trouble; see `chore(db): realign init migration` commit for context)
- `prisma migrate reset` against production — drops all data

### Connection strings

- `DATABASE_URL` (port 6543, `pgbouncer=true`) — runtime via Supabase pooler
- `DIRECT_URL` (port 5432) — Prisma CLI migrate commands (needs prepared
  statement support)
