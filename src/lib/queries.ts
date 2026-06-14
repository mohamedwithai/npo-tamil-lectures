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
