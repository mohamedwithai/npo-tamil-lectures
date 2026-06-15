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
  // Content taxonomy slug (see src/lib/categories.ts). Empty = untagged.
  category: z.string().max(40).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  featured: z.boolean().default(false),
  verseIds: z.array(z.string().cuid()).default([]),
});
export type LectureInput = z.infer<typeof lectureSchema>;

// ─── Book (library) ───────────────────────────────────────────────────────────
export const bookSchema = z.object({
  id: z.string().cuid().optional(),
  title: z.string().min(1, "Title is required").max(300),
  titleEn: z.string().max(300).optional().or(z.literal("")),
  author: z.string().max(200).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  coverImage: z.string().url().optional().or(z.literal("")),
  pdfUrl: z.string().url().optional().or(z.literal("")),
  category: z.string().max(40).optional().or(z.literal("")),
  pages: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().int().min(0).max(100000).optional()
  ),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
});
export type BookInput = z.infer<typeof bookSchema>;

// ─── Article (written piece) ──────────────────────────────────────────────────
export const articleSchema = z.object({
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
  coverImage: z.string().url().optional().or(z.literal("")),
  category: z.string().max(40).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  featured: z.boolean().default(false),
});
export type ArticleInput = z.infer<typeof articleSchema>;

// ─── Bookmarks & highlights (member features) ─────────────────────────────────
export const HIGHLIGHT_COLORS = ["yellow", "green", "blue", "pink"] as const;

const contentTarget = {
  target: z.enum(["lecture", "article"]),
  id: z.string().cuid(),
};

export const bookmarkSchema = z.object(contentTarget);
export type BookmarkInput = z.infer<typeof bookmarkSchema>;

export const highlightCreateSchema = z.object({
  ...contentTarget,
  quote: z.string().trim().min(1, "Nothing selected").max(4000),
  prefix: z.string().max(200).default(""),
  suffix: z.string().max(200).default(""),
  startOffset: z.number().int().min(0),
  endOffset: z.number().int().min(0),
  color: z.enum(HIGHLIGHT_COLORS).default("yellow"),
  note: z.string().max(4000).optional().or(z.literal("")),
});
export type HighlightCreateInput = z.infer<typeof highlightCreateSchema>;

export const highlightUpdateSchema = z.object({
  id: z.string().cuid(),
  note: z.string().max(4000).optional(),
  color: z.enum(HIGHLIGHT_COLORS).optional(),
});
export type HighlightUpdateInput = z.infer<typeof highlightUpdateSchema>;

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

// ─── Correction suggestion (reader → admin) ───────────────────────────────────
export const suggestionSchema = z
  .object({
    lectureId: z.string().cuid(),
    originalText: z.string().trim().min(1, "Missing original text").max(2000),
    suggestedText: z
      .string()
      .trim()
      .min(1, "Please enter your correction")
      .max(2000),
  })
  .refine((d) => d.originalText !== d.suggestedText, {
    message: "No change detected",
    path: ["suggestedText"],
  });
export type SuggestionInput = z.infer<typeof suggestionSchema>;
