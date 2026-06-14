"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { eventSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Record a single analytics event (append-only). Called from the client via a
 * server action when scroll milestones / opens / completions happen. No
 * heartbeat: each event is a discrete fact. Guests may emit events too
 * (userId stays null) so we can measure visitor funnels.
 */
export async function recordEvent(input: unknown): Promise<{ ok: boolean }> {
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) return { ok: false };

  const user = await getCurrentUser();

  // Loose rate limit keyed by user or a coarse anonymous bucket.
  const limited = await rateLimit(`event:${user?.id ?? "anon"}`, 120, 60);
  if (!limited.success) return { ok: false };

  try {
    await prisma.event.create({
      data: {
        type: parsed.data.type,
        userId: user?.id ?? null,
        lectureId: parsed.data.lectureId ?? null,
        meta: parsed.data.meta ?? undefined,
      },
    });

    // Cheap denormalized view counter for sorting/cards.
    if (parsed.data.type === "lecture_opened" && parsed.data.lectureId) {
      await prisma.lecture.update({
        where: { id: parsed.data.lectureId },
        data: { views: { increment: 1 } },
      });
    }

    // Persist member reading progress on scroll milestones.
    if (
      user?.id &&
      parsed.data.lectureId &&
      ["scroll_25", "scroll_50", "scroll_75", "scroll_100", "lecture_completed"].includes(
        parsed.data.type
      )
    ) {
      const percentMap: Record<string, number> = {
        scroll_25: 25,
        scroll_50: 50,
        scroll_75: 75,
        scroll_100: 100,
        lecture_completed: 100,
      };
      const percent = percentMap[parsed.data.type] ?? 0;
      await prisma.readingProgress.upsert({
        where: { userId_lectureId: { userId: user.id, lectureId: parsed.data.lectureId } },
        create: {
          userId: user.id,
          lectureId: parsed.data.lectureId,
          percent,
          completed: percent >= 100,
        },
        update: {
          percent: { set: percent },
          completed: percent >= 100,
        },
      });
    }

    return { ok: true };
  } catch {
    return { ok: false };
  }
}
