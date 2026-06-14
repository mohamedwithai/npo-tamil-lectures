"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { quranVerseSchema } from "@/lib/validations";
import type { ActionState } from "@/server/actions/lectures";

export async function saveQuranVerse(
  _prev: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const parsed = quranVerseSchema.safeParse({
    id: formData.get("id") || undefined,
    surahName: formData.get("surahName"),
    surahNumber: formData.get("surahNumber") || undefined,
    verseNumber: formData.get("verseNumber"),
    arabicText: formData.get("arabicText"),
    tamilText: formData.get("tamilText"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { id, ...data } = parsed.data;
  try {
    const verse = id
      ? await prisma.quranVerse.update({ where: { id }, data })
      : await prisma.quranVerse.create({ data });
    revalidatePath("/admin/quran");
    return { ok: true, id: verse.id };
  } catch {
    return { ok: false, error: "Could not save the verse (duplicate surah + verse?)." };
  }
}

export async function deleteQuranVerse(id: string): Promise<ActionState> {
  await requireAdmin();
  try {
    await prisma.quranVerse.delete({ where: { id } });
    revalidatePath("/admin/quran");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not delete the verse." };
  }
}
