# Security

## Authentication
- **Auth.js (NextAuth v5)** with **Google OAuth only** — no passwords to store or
  leak. Database session strategy via the Prisma adapter; sessions are revocable
  and the role is always read authoritatively from the DB.
- `AUTH_SECRET` signs/encrypts session tokens. Session cookies are
  `httpOnly`, `secure` (prod), `sameSite=lax`.

## Authorization (RBAC)
- Roles: `VISITOR` (unauthenticated), `MEMBER`, `ADMIN`.
- **Two layers** for `/admin`:
  1. `middleware.ts` — fast edge cookie pre-check (bounces clearly-logged-out
     users) without DB access.
  2. `requireAdmin()` in the admin layout + every admin server action — the
     authoritative check, reads role from the DB. **Never trust the middleware
     alone.**
- Member-only actions call `requireUser()`. Content gating is enforced server-side
  (gated HTML never sent to guests).

## Input validation
- All mutations validate input with **Zod** (`src/lib/validations.ts`) before
  touching the DB: lectures, verses, quizzes, attempts, events, search.
- Quiz grading happens **server-side**; correct answers are never sent to the
  client, so answers can't be scraped from the page.

## CSRF
- Auth.js provides built-in CSRF protection for its endpoints (double-submit
  token on sign-in/out).
- **Server Actions** are protected by Next.js: they require a POST with the
  framework's action token and enforce same-origin via the `Origin` header /
  `serverActions.allowedOrigins`. There are no state-changing GET handlers.
- The only custom write paths (`recordEvent`, quiz submit) are server actions
  (origin-checked) and additionally rate-limited.

## Rate limiting
- `rateLimit(key, limit, window)` — Postgres fixed-window counter (no Redis).
  Applied to: `/api/search` (per IP), `recordEvent` (per user/anon),
  `submitQuizAttempt` (per user).
- **Fail-open**: limiter errors never block legitimate users.
- **Scaling**: at higher traffic, swap the implementation for an edge KV
  (e.g. Vercel KV / Upstash). Call sites are unchanged. Run `pruneRateLimits()`
  from a cron route to clean old counter rows.

## Output / headers
- Security headers set in `next.config.mjs`: `X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`. `poweredByHeader`
  disabled.
- `dangerouslySetInnerHTML` is used only for (a) admin-authored Tiptap content
  and (b) Postgres `ts_headline` output — both first-party, not visitor input.
  If you later accept untrusted HTML, sanitize with a server-side sanitizer.

## Secrets
- Never commit `.env`. Only `NEXT_PUBLIC_*` reaches the browser; secrets stay
  server-side.

## Data & privacy
- Analytics store discrete events (type, optional user/lecture, tiny meta). No
  IPs are persisted (IP is used transiently only for search rate-limiting).
