import "server-only";
import { prisma } from "@/lib/prisma";

const cardSelect = {
  slug: true,
  titleTa: true,
  titleEn: true,
  summary: true,
  featuredImage: true,
  publishedAt: true,
  readTime: true,
} as const;

export async function getLatestLectures(take = 9) {
  return prisma.lecture.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take,
    select: cardSelect,
  });
}

export async function getFeaturedLecture() {
  return (
    (await prisma.lecture.findFirst({
      where: { status: "PUBLISHED", featured: true },
      orderBy: { publishedAt: "desc" },
      select: cardSelect,
    })) ??
    (await prisma.lecture.findFirst({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      select: cardSelect,
    }))
  );
}

export async function getLecturesByCategory(category: string, take = 30) {
  return prisma.lecture.findMany({
    where: { status: "PUBLISHED", category },
    orderBy: { publishedAt: "desc" },
    take,
    select: cardSelect,
  });
}

/** Published-lecture counts per category slug, for the topics hub. */
export async function getCategoryCounts(): Promise<Record<string, number>> {
  const rows = await prisma.lecture.groupBy({
    by: ["category"],
    where: { status: "PUBLISHED", category: { not: null } },
    _count: { _all: true },
  });
  const out: Record<string, number> = {};
  for (const r of rows) if (r.category) out[r.category] = r._count._all;
  return out;
}

export async function getAllPublishedSlugs() {
  const rows = await prisma.lecture.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}

export async function getLectureBySlug(slug: string) {
  return prisma.lecture.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      verses: {
        orderBy: { order: "asc" },
        include: { verse: true },
      },
      quiz: {
        include: { questions: { orderBy: { order: "asc" } } },
      },
    },
  });
}

export async function getSuggestions() {
  return prisma.suggestion.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      lecture: { select: { slug: true, titleTa: true } },
      user: { select: { name: true, email: true } },
    },
  });
}

export async function getSuggestionCount() {
  return prisma.suggestion.count();
}

// ─── Books (library) ──────────────────────────────────────────────────────────
export async function getPublishedBooks(take?: number) {
  return prisma.book.findMany({
    where: { published: true },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take,
  });
}

export async function getAdminBooks() {
  return prisma.book.findMany({ orderBy: { updatedAt: "desc" } });
}

export async function getBookById(id: string) {
  return prisma.book.findUnique({ where: { id } });
}

// ─── Articles ─────────────────────────────────────────────────────────────────
const articleCardSelect = {
  slug: true,
  titleTa: true,
  titleEn: true,
  summary: true,
  coverImage: true,
  category: true,
  publishedAt: true,
  readTime: true,
} as const;

export async function getPublishedArticles(take?: number) {
  return prisma.article.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take,
    select: articleCardSelect,
  });
}

export async function getArticleBySlug(slug: string) {
  return prisma.article.findFirst({ where: { slug, status: "PUBLISHED" } });
}

export async function getAllPublishedArticleSlugs() {
  const rows = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}

export async function getAdminArticles() {
  return prisma.article.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      titleTa: true,
      status: true,
      category: true,
      featured: true,
      publishedAt: true,
      updatedAt: true,
    },
  });
}

export async function getAdminLectures() {
  return prisma.lecture.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      titleTa: true,
      status: true,
      views: true,
      featured: true,
      publishedAt: true,
      updatedAt: true,
      _count: { select: { verses: true } },
      quiz: { select: { id: true } },
    },
  });
}
