# NPO Tamil Lecture Platform

A Tamil-first lecture platform for a non-profit that publishes ~3 lectures/week.
Medium-style reading, partial content gating for guests, Quran verse integration,
Postgres full-text search, quizzes, analytics, and an admin dashboard.

Built to run **entirely on free tiers**: Vercel (hosting) + Neon (Postgres) +
Google OAuth. No Redis, no paid search, no paid analytics.

## Tech Stack

| Concern        | Choice                                   |
| -------------- | ---------------------------------------- |
| Framework      | Next.js 15 (App Router) + TypeScript     |
| Styling        | Tailwind CSS + shadcn/ui                 |
| Animation      | Framer Motion                            |
| Database       | Neon PostgreSQL (free)                   |
| ORM            | Prisma                                   |
| Auth           | Auth.js (NextAuth v5), Google OAuth only |
| Rich text      | Tiptap                                   |
| Charts         | Recharts                                 |
| Search         | PostgreSQL Full-Text Search (tsvector)   |
| Deploy         | Vercel (free)                            |

## Quick Start

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env
#   → fill in DATABASE_URL, DIRECT_URL (Neon), AUTH_SECRET,
#     AUTH_GOOGLE_ID/SECRET, ADMIN_EMAILS

# 3. Create the schema + FTS trigger + sample data
npm run db:push      # create tables
npm run db:seed      # sample lectures/verses/quiz + installs FTS trigger

# 4. Run
npm run dev          # http://localhost:3000
```

The first person to sign in with an email listed in `ADMIN_EMAILS` becomes an
ADMIN; everyone else becomes a MEMBER.

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — system & component architecture
- [docs/ENV.md](docs/ENV.md) — environment variables
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Vercel + Neon + Google OAuth setup
- [docs/SECURITY.md](docs/SECURITY.md) — auth, validation, rate limiting, CSRF
- [docs/ROADMAP.md](docs/ROADMAP.md) — phase-by-phase development plan

## Scripts

| Script               | Purpose                                  |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Start dev server                         |
| `npm run build`      | `prisma generate` + production build     |
| `npm run db:push`    | Push schema to the database              |
| `npm run db:migrate` | Create a migration (uses `DIRECT_URL`)   |
| `npm run db:seed`    | Seed data + install the FTS trigger      |
| `npm run db:studio`  | Open Prisma Studio                       |
| `npm run typecheck`  | `tsc --noEmit`                           |
