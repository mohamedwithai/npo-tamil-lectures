import { z } from "zod";

// ─── Lecture ────────────────────────────────────────────────────────────────
export const lectureSchema = z.object({
  id: z.string().cuid().optional(),
  titleTa: z.string().min(1, "Tamil title is required").max(300),
  titleEn: z.string().max(300).optional().or(z.literal("")),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[\p{L}\p{N}-]+$/u, "Slug may only contain letters, numbers and hyphens"),
  summary: z.string().min(1, "Summary is required").max(600),
  content: z.string().min(1, "Content is required"),
  featuredImage: z.string().url().optional().or(z.literal("")),
  youtubeUrl: z.string().url().optional().or(z.literal("")),
  mindMapImage: z.string().url().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  featured: z.boolean().default(false),
  verseIds: z.array(z.string().cuid()).default([]),
});
export type LectureInput = z.infer<typeof lectureSchema>;

// ─── Quran verse ──────────────────────────────────────────────────────────────
export const quranVerseSchema = z.object({
  id: z.string().cuid().optional(),
  surahName: z.string().min(1, "Surah name is required").max(120),
  surahNumber: z.coerce.number().int().min(1).max(114).optional(),
  verseNumber: z.coerce.number().int().min(1),
  arabicText: z.string().min(1, "Arabic text is required"),
  tamilText: z.string().min(1, "Tamil translation is required"),
});
export type QuranVerseInput = z.infer<typeof quranVerseSchema>;

// ─── Quiz ──────────────────────────────────────────────────────────────────────
export const quizQuestionSchema = z.object({
  id: z.string().cuid().optional(),
  text: z.string().min(1, "Question text is required"),
  options: z.array(z.string().min(1)).min(2, "At least 2 options").max(6),
  correct: z.coerce.number().int().min(0),
  explanation: z.string().optional().or(z.literal("")),
});

export const quizSchema = z
  .object({
    lectureId: z.string().cuid(),
    title: z.string().min(1).default("Test Your Understanding"),
    questions: z
      .array(quizQuestionSchema)
      .min(3, "A quiz needs 3–5 questions")
      .max(5, "A quiz needs 3–5 questions"),
  })
  .refine(
    (q) => q.questions.every((qq) => qq.correct < qq.options.length),
    { message: "Correct answer index is out of range", path: ["questions"] }
  );
export type QuizInput = z.infer<typeof quizSchema>;

export const quizAttemptSchema = z.object({
  quizId: z.string().cuid(),
  // answers[i] = chosen option index for question i.
  answers: z.array(z.coerce.number().int().min(0)).min(1),
});
export type QuizAttemptInput = z.infer<typeof quizAttemptSchema>;

// ─── Analytics event ────────────────────────────────────────────────────────────
export const eventSchema = z.object({
  type: z.enum([
    "lecture_opened",
    "lecture_completed",
    "scroll_25",
    "scroll_50",
    "scroll_75",
    "scroll_100",
    "quiz_started",
    "quiz_completed",
    "login",
  ]),
  lectureId: z.string().cuid().optional(),
  meta: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
});
export type EventInput = z.infer<typeof eventSchema>;

// ─── Search ──────────────────────────────────────────────────────────────────────
export const searchSchema = z.object({
  q: z.string().trim().min(1).max(120),
});
