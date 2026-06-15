import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// Lightweight usage counters for external API calls, stored as a single JSON
// row in the Setting table (key = "api_usage"). No per-call history — just
// running totals so the admin can keep an eye on Gemini/NotebookLM quota.
const KEY = "api_usage";

export type ApiProvider = "gemini";

export type ApiCounters = {
  total: number;
  success: number;
  failed: number;
  lastCalledAt: string | null;
};

export type ApiUsage = Record<string, ApiCounters>;

const emptyCounters = (): ApiCounters => ({
  total: 0,
  success: 0,
  failed: 0,
  lastCalledAt: null,
});

/**
 * Record one external API call. `ok` is true when the call returned a usable
 * result, false on any error/timeout/unusable response. Never throws — usage
 * tracking must not break the request it is measuring.
 */
export async function recordApiCall(provider: ApiProvider, ok: boolean): Promise<void> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: KEY } });
    const usage = ((row?.value as ApiUsage | null) ?? {}) as ApiUsage;
    const c = usage[provider] ?? emptyCounters();
    c.total += 1;
    if (ok) c.success += 1;
    else c.failed += 1;
    c.lastCalledAt = new Date().toISOString();
    usage[provider] = c;

    await prisma.setting.upsert({
      where: { key: KEY },
      create: { key: KEY, value: usage as unknown as Prisma.InputJsonValue },
      update: { value: usage as unknown as Prisma.InputJsonValue },
    });
  } catch {
    // Swallow: tracking failures must be invisible to callers.
  }
}

/** Read the current usage counters (empty object if nothing recorded yet). */
export async function getApiUsage(): Promise<ApiUsage> {
  const row = await prisma.setting
    .findUnique({ where: { key: KEY } })
    .catch(() => null);
  return ((row?.value as ApiUsage | null) ?? {}) as ApiUsage;
}
