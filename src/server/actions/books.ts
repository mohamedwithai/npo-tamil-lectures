"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { bookSchema } from "@/lib/validations";

export type ActionState = { ok: boolean; error?: string; id?: string };

export async function saveBook(
  _prev: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const parsed = bookSchema.safeParse({
    id: formData.get("id") || undefined,
    title: formData.get("title"),
    titleEn: formData.get("titleEn") || "",
    author: formData.get("author") || "",
    description: formData.get("description") || "",
    coverImage: formData.get("coverImage") || "",
    pdfUrl: formData.get("pdfUrl") || "",
    category: formData.get("category") || "",
    pages: formData.get("pages") || "",
    featured: formData.get("featured") === "on" || formData.get("featured") === "true",
    published: formData.get("published") === "on" || formData.get("published") === "true",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const d = parsed.data;
  const data = {
    title: d.title,
    titleEn: d.titleEn || null,
    author: d.author || null,
    description: d.description || "",
    coverImage: d.coverImage || null,
    pdfUrl: d.pdfUrl || null,
    category: d.category || null,
    pages: d.pages ?? null,
    featured: d.featured,
    published: d.published,
  };

  try {
    let id = d.id;
    if (id) {
      await prisma.book.update({ where: { id }, data });
    } else {
      const created = await prisma.book.create({ data, select: { id: true } });
      id = created.id;
    }
    revalidatePath("/library");
    revalidatePath("/admin/books");
    revalidatePath("/");
    return { ok: true, id };
  } catch {
    return { ok: false, error: "Could not save the book." };
  }
}

export async function deleteBook(id: string): Promise<ActionState> {
  await requireAdmin();
  try {
    await prisma.book.delete({ where: { id } });
    revalidatePath("/library");
    revalidatePath("/admin/books");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not delete the book." };
  }
}
