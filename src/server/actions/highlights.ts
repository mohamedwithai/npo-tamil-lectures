"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import {
  highlightCreateSchema,
  highlightUpdateSchema,
} from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { resolveContentRef } from "@/lib/content-ref";

export async function createHighlight(
  input: unknown
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const parsed = highlightCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in to highlight." };

  const limited = await rateLimit(`highlight:${user.id}`, 100, 60);
  if (!limited.success) {
    return { ok: false, error: "Too many requests — please try again shortly." };
  }

  const d = parsed.data;
  const ref = await resolveContentRef(d.target, d.id);
  if (!ref) return { ok: false, error: "Content not found." };

  try {
    const created = await prisma.highlight.create({
      data: {
        userId: user.id,
        ...ref,
        quote: d.quote,
        prefix: d.prefix,
        suffix: d.suffix,
        startOffset: d.startOffset,
        endOffset: d.endOffset,
        color: d.color,
        note: d.note || "",
      },
      select: { id: true },
    });
    revalidatePath("/notes");
    return { ok: true, id: created.id };
  } catch {
    return { ok: false, error: "Could not save the highlight." };
  }
}

export async function updateHighlight(
  input: unknown
): Promise<{ ok: boolean; error?: string }> {
  const parsed = highlightUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in." };

  const d = parsed.data;
  try {
    // updateMany scopes the write to the owner — a user can't edit others' notes.
    const res = await prisma.highlight.updateMany({
      where: { id: d.id, userId: user.id },
      data: {
        ...(d.note !== undefined ? { note: d.note } : {}),
        ...(d.color !== undefined ? { color: d.color } : {}),
      },
    });
    if (res.count === 0) return { ok: false, error: "Not found." };
    revalidatePath("/notes");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not update the note." };
  }
}

export async function deleteHighlight(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in." };

  try {
    await prisma.highlight.deleteMany({ where: { id, userId: user.id } });
    revalidatePath("/notes");
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not delete." };
  }
}
