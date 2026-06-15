"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { articleSchema } from "@/lib/validations";
import { htmlToText, estimateReadTime } from "@/lib/utils";

export type ActionState = { ok: boolean; error?: string; id?: string };

export async function saveArticle(
  _prev: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const parsed = articleSchema.safeParse({
    id: formData.get("id") || undefined,
    titleTa: formData.get("titleTa"),
    titleEn: formData.get("titleEn") || "",
    slug: formData.get("slug"),
    summary: formData.get("summary"),
    content: formData.get("content"),
    coverImage: formData.get("coverImage") || "",
    category: formData.get("category") || "",
    status: formData.get("status") || "DRAFT",
    featured: formData.get("featured") === "on" || formData.get("featured") === "true",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const d = parsed.data;
  const contentText = htmlToText(d.content);
  const readTime = estimateReadTime(contentText);
  const publishing = d.status === "PUBLISHED";

  const data = {
    titleTa: d.titleTa,
    titleEn: d.titleEn || null,
    slug: d.slug,
    summary: d.summary,
    content: d.content,
    contentText,
    coverImage: d.coverImage || null,
    category: d.category || null,
    status: d.status,
    featured: d.featured,
    readTime,
  };

  try {
    let id = d.id;
    if (id) {
      const existing = await prisma.article.findUnique({
        where: { id },
        select: { publishedAt: true },
      });
      await prisma.article.update({
        where: { id },
        data: {
          ...data,
          publishedAt:
            publishing && !existing?.publishedAt ? new Date() : existing?.publishedAt,
        },
      });
    } else {
      const created = await prisma.article.create({
        data: { ...data, publishedAt: publishing ? new Date() : null },
        select: { id: true },
      });
      id = created.id;
    }

    revalidatePath("/articles");
    revalidatePath(`/articles/${d.slug}`);
    revalidatePath("/admin/articles");
    revalidatePath("/");
    return { ok: true, id };
  } catch (e) {
    const msg =
      e instanceof Error && e.message.includes("Unique")
        ? "That slug is already in use."
        : "Could not save the article.";
    return { ok: false, error: msg };
  }
}

export async function deleteArticle(id: string): Promise<ActionState> {
  await requireAdmin();
  try {
    const article = await prisma.article.delete({
      where: { id },
      select: { slug: true },
    });
    revalidatePath("/articles");
    revalidatePath(`/articles/${article.slug}`);
    revalidatePath("/admin/articles");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not delete the article." };
  }
}
