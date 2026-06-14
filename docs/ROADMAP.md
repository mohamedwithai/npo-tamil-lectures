# Development Roadmap

Phase-by-phase plan. Phases 0–6 are implemented in this repo; 7+ are optional
next steps.

## ✅ Phase 0 — Foundation
- Next.js 15 + TS + Tailwind + shadcn/ui scaffold, theming (light/dark), fonts
  (Inter, Noto Sans Tamil, Amiri), security headers.

## ✅ Phase 1 — Database
- Prisma schema: all models, relations, indexes. Neon wiring (pooled + direct).
- FTS trigger (`prisma/fts.sql`). Seed with sample lectures/verses/quiz.

## ✅ Phase 2 — Authentication
- Auth.js v5 + Google OAuth, Prisma adapter, DB sessions.
- Role bootstrap from `ADMIN_EMAILS`; `requireUser` / `requireAdmin` guards;
  middleware edge pre-check.

## ✅ Phase 3 — Lectures & reading
- Homepage (hero, featured, latest, ISR), lectures list, lecture detail with
  Medium-style typography, YouTube embed, mind map (zoomable).
- **Server-side 30% gating** + login overlay with return-to-lecture.

## ✅ Phase 4 — Quran & search
- Reusable Quran verse component (RTL Arabic + Tamil), admin linking.
- Postgres FTS: ranked, highlighted, prefix; live dropdown + `/search` page.

## ✅ Phase 5 — Quizzes & analytics
- 95%-scroll quiz modal, server-side grading, one attempt/user/quiz.
- Append-only event tracking (opens, scroll milestones, completions, quiz,
  login); reading progress for members.

## ✅ Phase 6 — Admin dashboard
- Lecture CRUD (Tiptap editor), Quran manager, quiz builder.
- Analytics dashboard (Recharts) + CSV export. All routes admin-gated.

## ▶️ Phase 7 — Hardening & polish (next)
- [ ] Tracked Prisma migrations (move off `db push`).
- [ ] Sitemap + robots + per-lecture JSON-LD (`Article`) for SEO.
- [ ] Image uploads (e.g. Vercel Blob free tier) instead of URL fields.
- [ ] Email digest of the week's 3 lectures (Resend free tier).
- [ ] Unit tests for `splitContentForGate`, search query building, quiz grading.
- [ ] E2E smoke test (Playwright) for gate + login + quiz.

## ▶️ Phase 8 — Scale (only if needed)
- [ ] Move rate limiter to edge KV.
- [ ] Add a read replica / connection caching if Neon free limits are hit.
- [ ] Bookmarks / saved lectures, comments, multi-author workflow.

## Definition of done (per lecture, operationally)
Tamil title + summary + body, optional English title, featured image, optional
YouTube + mind map, linked verses, 3–5 question quiz, status = PUBLISHED.
