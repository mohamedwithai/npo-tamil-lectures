# Architecture

## Priorities (NPO)

1. **Reliability** 2. **Simplicity** 3. **Maintainability** 4. **Low cost** 5. **Scalability**

Every decision below is justified against these, in order.

## High-level

```
Vercel (Next.js 15, RSC + Server Actions)
 ├─ Public pages (ISR)        home, /lectures, /lectures/[slug] preview, /search
 ├─ Member pages (SSR)        full lecture content, quizzes, progress
 ├─ Admin pages (SSR, gated)  CRUD + analytics
 ├─ Route handlers            /api/auth/[...nextauth], /api/search, /api/analytics/export
 └─ Auth.js (Google OAuth, database sessions)
        │ Prisma (pooled)
   Neon Postgres (free): app tables + tsvector FTS + append-only Event table
```

## Key decisions

### Roles as an enum, not a table
The platform has exactly three fixed roles. An enum (`VISITOR | MEMBER | ADMIN`)
gives referential safety and zero join cost. A role *table* would add complexity
with no benefit for an NPO that will never configure custom roles. (Priority 2.)

### Server-side content gating (real, not cosmetic)
`splitContentForGate()` divides lecture HTML at a block boundary near 30% of the
text. **Guests never receive the gated remainder** — it is not serialized into
their HTML, so it can't be revealed via devtools. Members get the full document.
This is both more secure and simpler than client-side blur tricks. (Priority 1.)

### Full-text search in Postgres
A `searchVector tsvector` column on `Lecture`, maintained by a trigger
(`prisma/fts.sql`) over title/summary/body with weights A/B/C, indexed with GIN.
We use the **`simple`** text-search config because Postgres' language configs
don't understand Tamil; `simple` tokenizes on Unicode word boundaries, which is
correct for Tamil and fine for the English titles. Prefix queries (`word:*`)
power search-as-you-type. No Algolia/Elasticsearch/Meilisearch. (Priorities 4, 1.)

### Analytics = append-only events, no heartbeat
A single `Event` table records discrete facts (`lecture_opened`, `scroll_50`,
`quiz_completed`, …). The dashboard aggregates with SQL `GROUP BY` / `date_trunc`.
No background pings, no time-series DB. A denormalized `Lecture.views` counter
makes card sorting cheap. (Priorities 2, 4.)

### Rate limiting without Redis
`rateLimit()` uses the `Setting` table as a per-window counter store. Good enough
for NPO traffic and stays on the free tier. The call signature is KV-agnostic, so
swapping to an edge KV later is a one-file change. (Priorities 4, 5.)

### ISR for public, SSR for personalized
Public pages use `export const revalidate` and are re-validated on admin save via
`revalidatePath`. Member/admin pages are dynamic because they depend on the
session. (Priorities 1, 5.)

## Component architecture

```
components/
├─ ui/            shadcn primitives (button, card, dialog, dropdown, …)
├─ layout/        navbar, footer, hero, theme-toggle, search-bar, login-button
├─ lecture/       lecture-card, featured-lecture, lecture-reader (scroll+events),
│                 gated-overlay, youtube-embed, mind-map
├─ quran/         quran-verse (+ list)
├─ quiz/          quiz-modal (95%-scroll trigger, server-graded)
└─ admin/         admin-sidebar, lecture-form, rich-text-editor (Tiptap),
                  quran-manager, quiz-manager, analytics-charts, delete-lecture-button
```

**Server vs client:** data fetching, gating, auth and grading happen in RSC /
server actions. Client components are only used where interactivity is required
(editor, modals, scroll tracking, charts, theme).

## Data flow examples

- **Reading (guest):** RSC fetches lecture → `splitContentForGate` → sends preview
  + `<GatedOverlay>` (login CTA). The remainder is never sent.
- **Reading (member):** RSC sends full content → `<LectureReader>` fires scroll
  milestone events via a server action and opens the quiz at 95%.
- **Quiz:** client collects answers → `submitQuizAttempt` server action grades
  against the DB (correct answers never leave the server), upserts one attempt
  per user/quiz, records a `quiz_completed` event.
- **Search:** `/api/search?q=` → `searchLectures()` raw SQL with `ts_rank` +
  `ts_headline` highlighting → dropdown.

## Database models

`User`, `Account`, `Session`, `VerificationToken` (Auth.js), `Lecture`,
`QuranVerse`, `LectureVerse` (M:N), `Quiz`, `QuizQuestion`, `QuizAttempt`
(unique per user/quiz), `ReadingProgress`, `Event`, `Setting`. See
`prisma/schema.prisma` for fields, relations and indexes.
