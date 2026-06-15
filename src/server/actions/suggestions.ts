"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireAdmin } from "@/lib/session";
import { suggestionSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { htmlToText } from "@/lib/utils";

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

/**
 * Admin: apply a correction to the actual lecture. Replaces the suggestion's
 * original passage with `finalText` (which the admin may have tweaked) in the
 * lecture content, refreshes the search text + mind map, and marks the
 * suggestion reviewed. The public page then reflects the change.
 */
export async function applySuggestion(
  id: string,
  finalText: string
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const text = finalText.trim();
  if (!text) return { ok: false, error: "The correction text is empty." };

  try {
    const s = await prisma.suggestion.findUnique({
      where: { id },
      select: { originalText: true, lectureId: true },
    });
    if (!s) return { ok: false, error: "Suggestion not found." };

    const lecture = await prisma.lecture.findUnique({
      where: { id: s.lectureId },
      select: { content: true, titleTa: true, titleEn: true, slug: true },
    });
    if (!lecture) return { ok: false, error: "Lecture not found." };

    if (!lecture.content.includes(s.originalText)) {
      return {
        ok: false,
        error:
          "The original passage wasn't found in the lecture (it may have changed or contains inline formatting). Please edit the lecture manually.",
      };
    }

    // Replace the first occurrence of the original passage with the final text.
    const newContent = lecture.content.replace(s.originalText, text);
    const contentText = htmlToText(newContent);

    // Note: we intentionally do NOT regenerate the mind map here. The mind map
    // is generated once when the admin first posts the lecture; applying a
    // reader correction must not re-call the NotebookLM/Gemini API.
    await prisma.lecture.update({
      where: { id: s.lectureId },
      data: {
        content: newContent,
        contentText,
      },
    });
    // Accepted: the change is now in the lecture, so remove the suggestion.
    await prisma.suggestion.delete({ where: { id } });

    revalidatePath(`/lectures/${lecture.slug}`);
    revalidatePath("/");
    revalidatePath("/lectures");
    revalidatePath("/admin/suggestions");
    revalidatePath("/admin");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not apply the correction." };
  }
}

/** Admin: delete a suggestion (reject / cleanup) without changing the lecture. */
export async function deleteSuggestion(id: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  try {
    await prisma.suggestion.delete({ where: { id } });
    revalidatePath("/admin/suggestions");
    revalidatePath("/admin");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
