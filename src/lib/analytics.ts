import "server-only";
import { prisma } from "@/lib/prisma";

export type DashboardData = {
  totals: {
    users: number;
    lectures: number;
    views: number;
    completions: number;
    completionRate: number; // % of opens that became completions
    quizParticipation: number; // distinct users who completed a quiz
  };
  mostViewed: { id: string; titleTa: string; slug: string; views: number }[];
  mostCompleted: { titleTa: string; slug: string; completions: number }[];
  activityTimeline: { date: string; events: number; logins: number }[];
  topCountries: { country: string; count: number }[];
};

export async function getDashboardData(): Promise<DashboardData> {
  const [
    users,
    lectures,
    viewsAgg,
    opens,
    completions,
    quizParticipants,
    mostViewed,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.lecture.count({ where: { status: "PUBLISHED" } }),
    prisma.lecture.aggregate({ _sum: { views: true } }),
    prisma.event.count({ where: { type: "lecture_opened" } }),
    prisma.event.count({ where: { type: "lecture_completed" } }),
    prisma.quizAttempt.findMany({ distinct: ["userId"], select: { userId: true } }),
    prisma.lecture.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { views: "desc" },
      take: 5,
      select: { id: true, titleTa: true, slug: true, views: true },
    }),
  ]);

  // Most completed lectures via grouped completion events.
  const completedGroups = await prisma.event.groupBy({
    by: ["lectureId"],
    where: { type: "lecture_completed", lectureId: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { lectureId: "desc" } },
    take: 5,
  });
  const completedLectureMeta = await prisma.lecture.findMany({
    where: { id: { in: completedGroups.map((g) => g.lectureId!).filter(Boolean) } },
    select: { id: true, titleTa: true, slug: true },
  });
  const mostCompleted = completedGroups
    .map((g) => {
      const meta = completedLectureMeta.find((m) => m.id === g.lectureId);
      return meta
        ? { titleTa: meta.titleTa, slug: meta.slug, completions: g._count._all }
        : null;
    })
    .filter(Boolean) as DashboardData["mostCompleted"];

  // Visitor breakdown by country (top 8) from geo-tagged events.
  const countryGroups = await prisma.event.groupBy({
    by: ["country"],
    where: { country: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { country: "desc" } },
    take: 8,
  });
  const topCountries = countryGroups
    .filter((g) => g.country)
    .map((g) => ({ country: g.country as string, count: g._count._all }));

  // 30-day activity timeline aggregated in SQL (date_trunc).
  const timeline = await prisma.$queryRaw<
    { date: Date; events: bigint; logins: bigint }[]
  >`
    SELECT
      date_trunc('day', "createdAt") AS date,
      count(*) AS events,
      count(*) FILTER (WHERE "type" = 'login') AS logins
    FROM "Event"
    WHERE "createdAt" >= now() - interval '30 days'
    GROUP BY 1
    ORDER BY 1 ASC;
  `;

  return {
    totals: {
      users,
      lectures,
      views: viewsAgg._sum.views ?? 0,
      completions,
      completionRate: opens > 0 ? Math.round((completions / opens) * 100) : 0,
      quizParticipation: quizParticipants.length,
    },
    mostViewed,
    mostCompleted,
    activityTimeline: timeline.map((t) => ({
      date: t.date.toISOString().slice(0, 10),
      events: Number(t.events),
      logins: Number(t.logins),
    })),
    topCountries,
  };
}

/** CSV export of recent events for the admin "Export CSV" button. */
export async function eventsCsv(): Promise<string> {
  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: {
      user: { select: { email: true } },
      lecture: { select: { slug: true } },
    },
  });
  const header = "createdAt,type,userEmail,lectureSlug,country,region,meta";
  const rows = events.map((e) => {
    const meta = e.meta ? JSON.stringify(e.meta).replace(/"/g, '""') : "";
    return [
      e.createdAt.toISOString(),
      e.type,
      e.user?.email ?? "",
      e.lecture?.slug ?? "",
      e.country ?? "",
      e.region ?? "",
      `"${meta}"`,
    ].join(",");
  });
  return [header, ...rows].join("\n");
}
