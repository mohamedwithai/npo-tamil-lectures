import { prisma } from "@/lib/prisma";

/**
 * Postgres-backed fixed-window rate limiter.
 *
 * We deliberately avoid Redis/Upstash to stay on free tiers (NPO constraint).
 * It uses the `Setting` table as a tiny counter store, keyed per time window.
 * This is sufficient for abuse protection on write endpoints (events, search,
 * quiz submit) at NPO traffic levels. To scale, swap this implementation for an
 * edge KV — the call signature (`rateLimit(key, limit, window)`) stays the same.
 * See docs/SECURITY.md.
 */
export async function rateLimit(
  key: string,
  limit = 30,
  windowSeconds = 60
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const now = Date.now();
  const windowStart =
    Math.floor(now / (windowSeconds * 1000)) * windowSeconds * 1000;
  const storeKey = `ratelimit:${key}:${windowStart}`;
  const reset = windowStart + windowSeconds * 1000;

  try {
    const existing = await prisma.setting.findUnique({
      where: { key: storeKey },
      select: { value: true },
    });
    const count = (existing?.value as { count?: number })?.count ?? 0;
    const next = count + 1;

    await prisma.setting.upsert({
      where: { key: storeKey },
      create: { key: storeKey, value: { count: 1 } },
      update: { value: { count: next } },
    });

    return {
      success: next <= limit,
      remaining: Math.max(0, limit - next),
      reset,
    };
  } catch {
    // Fail open: never block legitimate users because the limiter errored.
    return { success: true, remaining: limit, reset };
  }
}

/** Best-effort cleanup of expired rate-limit rows. Call from a cron/route if desired. */
export async function pruneRateLimits() {
  await prisma.setting.deleteMany({
    where: {
      key: { startsWith: "ratelimit:" },
      updatedAt: { lt: new Date(Date.now() - 3600_000) },
    },
  });
}
