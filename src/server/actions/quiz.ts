"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/session";
import { quizSchema, quizAttemptSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import type { ActionState } from "@/server/actions/lectures";

// ─── Admin: create/replace a lecture's quiz ───────────────────────────────────
export async function saveQuiz(input: unknown): Promise<ActionState> {
  await requireAdmin();
  const parsed = quizSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid quiz" };
  }
  const { lectureId, title, questions } = parsed.data;

  try {
    const quiz = await prisma.quiz.upsert({
      where: { lectureId },
      create: {
        lectureId,
        title,
        questions: {
          create: questions.map((q, i) => ({
            order: i,
            text: q.text,
            options: q.options,
            correct: q.correct,
            explanation: q.explanation || null,
          })),
        },
      },
      update: {
        title,
        questions: {
          deleteMany: {},
          create: questions.map((q, i) => ({
            order: i,
            text: q.text,
            options: q.options,
            correct: q.correct,
            explanation: q.explanation || null,
          })),
        },
      },
      select: { id: true },
    });
    revalidatePath("/admin/quizzes");
    return { ok: true, id: quiz.id };
  } catch {
    return { ok: false, error: "Could not save the quiz." };
  }
}

// ─── Member: submit a quiz attempt ────────────────────────────────────────────
export type AttemptResult = {
  ok: boolean;
  error?: string;
  score?: number;
  total?: number;
  // Per-question correctness + the right answer + explanation for review.
  review?: { correct: number; chosen: number; explanation: string | null }[];
};

export async function submitQuizAttempt(input: unknown): Promise<AttemptResult> {
  const user = await requireUser();

  const limited = await rateLimit(`quiz:${user.id}`, 20, 60);
  if (!limited.success) return { ok: false, error: "Too many attempts. Try again shortly." };

  const parsed = quizAttemptSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid submission" };
  const { quizId, answers } = parsed.data;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: { orderBy: { order: "asc" } }, lecture: { select: { id: true } } },
  });
  if (!quiz) return { ok: false, error: "Quiz not found" };

  let score = 0;
  const review = quiz.questions.map((q, i) => {
    const chosen = answers[i] ?? -1;
    const isCorrect = chosen === q.correct;
    if (isCorrect) score++;
    return { correct: q.correct, chosen, explanation: q.explanation };
  });
  const total = quiz.questions.length;

  try {
    // One attempt per user per quiz (enforces "do not show again after completion").
    await prisma.quizAttempt.upsert({
      where: { quizId_userId: { quizId, userId: user.id } },
      create: { quizId, userId: user.id, score, total },
      update: { score, total },
    });
    await prisma.event.create({
      data: {
        type: "quiz_completed",
        userId: user.id,
        lectureId: quiz.lecture.id,
        meta: { score, total },
      },
    });
  } catch {
    return { ok: false, error: "Could not record your attempt." };
  }

  return { ok: true, score, total, review };
}
