# Environment Variables

Copy `.env.example` → `.env` for local dev. Set the same keys in Vercel → Project
→ Settings → Environment Variables for production.

| Variable               | Required | Description |
| ---------------------- | -------- | ----------- |
| `DATABASE_URL`         | ✅       | Neon **pooled** connection string (used at runtime). Ends with `-pooler...`. Keep `?sslmode=require`. |
| `DIRECT_URL`           | ✅       | Neon **direct** connection string (used by `prisma migrate`). |
| `AUTH_SECRET`          | ✅       | Random secret for Auth.js. Generate: `npx auth secret` or `openssl rand -base64 32`. |
| `AUTH_GOOGLE_ID`       | ✅       | Google OAuth client ID. |
| `AUTH_GOOGLE_SECRET`   | ✅       | Google OAuth client secret. |
| `NEXT_PUBLIC_SITE_URL` | ✅       | Public URL, e.g. `https://your-app.vercel.app` (local: `http://localhost:3000`). |
| `ADMIN_EMAILS`         | ✅       | Comma-separated emails auto-granted ADMIN on first login. |

## Notes

- **Two DB URLs?** Neon's pooled endpoint is great for serverless runtime but
  doesn't support the session-level operations `prisma migrate` needs, hence the
  separate `DIRECT_URL`. The Prisma schema wires `url`/`directUrl` accordingly.
- `NEXT_PUBLIC_SITE_URL` is the only variable exposed to the browser. Never prefix
  secrets with `NEXT_PUBLIC_`.
- Auth.js v5 reads `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` by
  convention — no extra wiring needed.
