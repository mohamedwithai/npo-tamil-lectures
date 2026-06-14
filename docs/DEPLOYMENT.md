# Deployment Guide (Free Tier)

Target stack: **Vercel** (hosting) + **Neon** (Postgres) + **Google OAuth**.

## 1. Database — Neon

1. Create a free project at <https://neon.tech>.
2. In **Connection Details**, copy two strings:
   - **Pooled** connection → `DATABASE_URL`
   - **Direct** connection → `DIRECT_URL`
   Both should keep `?sslmode=require`.
3. Locally, with `.env` filled in:
   ```bash
   npm run db:push     # create tables
   npm run db:seed     # sample data + install FTS trigger
   ```
   > The FTS trigger (`prisma/fts.sql`) is installed by the seed. If you ever
   > push schema changes without seeding, re-run it once:
   > `psql "$DIRECT_URL" -f prisma/fts.sql`

## 2. Google OAuth

1. <https://console.cloud.google.com> → create/select a project.
2. **APIs & Services → OAuth consent screen**: External, add app name + your
   email, and add your Google account under **Test users** (while unverified).
3. **APIs & Services → Credentials → Create credentials → OAuth client ID →
   Web application**. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://YOUR-DOMAIN.vercel.app/api/auth/callback/google`
4. Copy the Client ID/Secret → `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`.

## 3. Vercel

1. Push the repo to GitHub and **Import** it at <https://vercel.com>.
2. Add all environment variables (see [ENV.md](ENV.md)) for **Production** (and
   Preview if you use it). Set `NEXT_PUBLIC_SITE_URL` to your Vercel URL.
3. Build command is `npm run build` (runs `prisma generate` first — already set
   in `package.json`). Output is detected automatically.
4. Deploy. After the first deploy, update the Google redirect URI with the real
   domain if it changed.

## 4. Post-deploy checklist

- [ ] Sign in with an `ADMIN_EMAILS` account → you land with ADMIN access.
- [ ] `/admin/lectures/new` → create & publish a lecture.
- [ ] Visit it as a guest (incognito) → only ~30% shows + login CTA.
- [ ] Search returns the lecture (FTS trigger installed?).
- [ ] `/admin/analytics` shows events; **Export CSV** downloads.

## Cost & limits

Everything fits the free tiers. Watch Neon's storage/compute and Vercel's
function execution if traffic grows; the rate limiter and ISR keep DB load low.
See [SECURITY.md](SECURITY.md) for scaling the rate limiter.

## Database migrations vs. `db push`

- For a small NPO, `npm run db:push` is the simplest path.
- For tracked migrations, use `npm run db:migrate` (uses `DIRECT_URL`) and commit
  the generated SQL in `prisma/migrations/`. Re-apply `prisma/fts.sql` after a
  migration that recreates the `Lecture` table.
