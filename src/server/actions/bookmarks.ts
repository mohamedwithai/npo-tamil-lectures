"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { bookmarkSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { resolveContentRef } from "@/lib/content-ref";

/**
 * Save or unsave a lecture/article for the current user. Returns the resulting
 * bookmarked state so the client can sync its optimistic toggle.
 */
export async function toggleBookmark(
  input: unknown
): Promise<{ ok: boolean; bookmarked?: boolean; error?: string }> {
  const parsed = bookmarkSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in to save bookmarks." };

  const limited = await rateLimit(`bookmark:${user.id}`, 60, 60);
  if (!limited.success) {
    return { ok: false, error: "Too many requests — please try again shortly." };
  }

  const ref = await resolveContentRef(parsed.data.target, parsed.data.id);
  if (!ref) return { ok: false, error: "Content not found." };

  try {
    const existing = await prisma.bookmark.findFirst({
      where: { userId: user.id, lectureId: ref.lectureId, articleId: ref.articleId },
      select: { id: true },
    });

    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      revalidatePath("/bookmarks");
      return { ok: true, bookmarked: false };
    }

    await prisma.bookmark.create({ data: { userId: user.id, ...ref } });
    revalidatePath("/bookmarks");
    return { ok: true, bookmarked: true };
  } catch {
    return { ok: false, error: "Could not update the bookmark." };
  }
}
