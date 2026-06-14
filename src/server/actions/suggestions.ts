"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireAdmin } from "@/lib/session";
import { suggestionSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import type { SuggestionStatus } from "@prisma/client";

/**
 * Submit a correction suggestion for a lecture. Members only (we tie each
 * suggestion to a user to curb spam). Rate-limited via the Postgres limiter.
 */
export async function createSuggestion(
  input: unknown
): Promise<{ ok: boolean; error?: string }> {
  const parsed = suggestionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Please sign in to suggest a correction." };
  }

  // 10 suggestions per 5 minutes per user.
  const limited = await rateLimit(`suggestion:${user.id}`, 10, 300);
  if (!limited.success) {
    return { ok: false, error: "Too many suggestions — please try again shortly." };
  }

  try {
    const lecture = await prisma.lecture.findFirst({
      where: { id: parsed.data.lectureId, status: "PUBLISHED" },
      select: { id: true },
    });
    if (!lecture) return { ok: false, error: "Lecture not found." };

    await prisma.suggestion.create({
      data: {
        lectureId: parsed.data.lectureId,
        userId: user.id,
        originalText: parsed.data.originalText,
        suggestedText: parsed.data.suggestedText,
      },
    });

    revalidatePath("/admin/suggestions");
    revalidatePath("/admin");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not submit your suggestion." };
  }
}

/** Admin: change a suggestion's status (reviewed / dismissed / reopen). */
export async function updateSuggestionStatus(
  id: string,
  status: SuggestionStatus
): Promise<{ ok: boolean }> {
  await requireAdmin();
  try {
    await prisma.suggestion.update({ where: { id }, data: { status } });
    revalidatePath("/admin/suggestions");
    revalidatePath("/admin");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
