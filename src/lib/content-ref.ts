import "server-only";
import { prisma } from "@/lib/prisma";

export type ContentTarget = "lecture" | "article";

export type ContentRef = { lectureId: string | null; articleId: string | null };

/**
 * Map a (target, id) pair to the right FK column for the polymorphic Bookmark /
 * Highlight models, verifying the content actually exists. Returns null when the
 * referenced lecture/article is missing.
 */
export async function resolveContentRef(
  target: ContentTarget,
  id: string
): Promise<ContentRef | null> {
  if (target === "lecture") {
    const l = await prisma.lecture.findUnique({ where: { id }, select: { id: true } });
    return l ? { lectureId: id, articleId: null } : null;
  }
  const a = await prisma.article.findUnique({ where: { id }, select: { id: true } });
  return a ? { lectureId: null, articleId: id } : null;
}

export function refOf(target: ContentTarget, id: string): ContentRef {
  return target === "lecture"
    ? { lectureId: id, articleId: null }
    : { lectureId: null, articleId: id };
}
