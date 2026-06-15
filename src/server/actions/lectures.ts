"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { lectureSchema } from "@/lib/validations";
import { htmlToText, estimateReadTime } from "@/lib/utils";
import { generateMindMap } from "@/lib/gemini";
import type { MindMapNode } from "@/lib/mindmap";
import type { Prisma } from "@prisma/client";

export type ActionState = { ok: boolean; error?: string; id?: string };

export async function saveLecture(
  _prev: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const parsed = lectureSchema.safeParse({
    id: formData.get("id") || undefined,
    titleTa: formData.get("titleTa"),
    titleEn: formData.get("titleEn") || "",
    slug: formData.get("slug"),
    summary: formData.get("summary"),
    content: formData.get("content"),
    featuredImage: formData.get("featuredImage") || "",
    youtubeUrl: formData.get("youtubeUrl") || "",
    mindMapImage: formData.get("mindMapImage") || "",
    category: formData.get("category") || "",
    status: formData.get("status") || "DRAFT",
    featured: formData.get("featured") === "on" || formData.get("featured") === "true",
    verseIds: formData.getAll("verseIds").map(String).filter(Boolean),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const d = parsed.data;
  const contentText = htmlToText(d.content);
  const readTime = estimateReadTime(contentText);
  const publishing = d.status === "PUBLISHED";

  // Auto-generate the NotebookLM-style mind map from the content (Gemini, with a
  // heading-based fallback). Never blocks the save: on any error we store null.
  let mindMap: MindMapNode | null = null;
  try {
    mindMap = await generateMindMap(d.titleTa, d.content, d.titleEn);
  } catch {
    mindMap = null;
  }

  try {
    const data = {
      titleTa: d.titleTa,
      titleEn: d.titleEn || null,
      slug: d.slug,
      summary: d.summary,
      content: d.content,
      contentText,
      featuredImage: d.featuredImage || null,
      youtubeUrl: d.youtubeUrl || null,
      mindMapImage: d.mindMapImage || null,
      category: d.category || null,
      mindMap: (mindMap ?? undefined) as Prisma.InputJsonValue | undefined,
      status: d.status,
      featured: d.featured,
      readTime,
    };

    let id = d.id;
    if (id) {
      const existing = await prisma.lecture.findUnique({
        where: { id },
        select: { publishedAt: true },
      });
      await prisma.lecture.update({
        where: { id },
        data: {
          ...data,
          publishedAt:
            publishing && !existing?.publishedAt ? new Date() : existing?.publishedAt,
          verses: {
            deleteMany: {},
            create: d.verseIds.map((verseId, i) => ({ verseId, order: i })),
          },
        },
      });
    } else {
      const created = await prisma.lecture.create({
        data: {
          ...data,
          publishedAt: publishing ? new Date() : null,
          verses: { create: d.verseIds.map((verseId, i) => ({ verseId, order: i })) },
        },
        select: { id: true },
      });
      id = created.id;
    }

    revalidatePath("/");
    revalidatePath("/lectures");
    revalidatePath(`/lectures/${d.slug}`);
    revalidatePath("/admin/lectures");

    return { ok: true, id };
  } catch (e) {
    const msg =
      e instanceof Error && e.message.includes("Unique")
        ? "That slug is already in use."
        : "Could not save the lecture.";
    return { ok: false, error: msg };
  }
}

/**
 * Generate (but do not save) a mind map from the current editor content, so the
 * admin can preview it before publishing. Admin-only.
 */
export async function previewMindMap(
  titleTa: string,
  content: string,
  titleEn?: string
): Promise<{ ok: boolean; mindMap?: MindMapNode; error?: string }> {
  await requireAdmin();
  if (!content.trim()) {
    return { ok: false, error: "Add some content first." };
  }
  try {
    const mindMap = await generateMindMap(titleTa || "Mind Map", content, titleEn);
    return { ok: true, mindMap };
  } catch {
    return { ok: false, error: "Could not generate a mind map." };
  }
}

export async function deleteLecture(id: string): Promise<ActionState> {
  await requireAdmin();
  try {
    const lecture = await prisma.lecture.delete({
      where: { id },
      select: { slug: true },
    });
    revalidatePath("/");
    revalidatePath("/lectures");
    revalidatePath(`/lectures/${lecture.slug}`);
    revalidatePath("/admin/lectures");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not delete the lecture." };
  }
}
