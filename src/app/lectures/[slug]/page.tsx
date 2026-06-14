import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Clock, Calendar } from "lucide-react";
import { getLectureBySlug, getAllPublishedSlugs } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { splitContentForGate } from "@/lib/content";
import { formatDate } from "@/lib/utils";
import { GatedOverlay } from "@/components/lecture/gated-overlay";
import { LectureReader } from "@/components/lecture/lecture-reader";
import { QuranVerseList } from "@/components/quran/quran-verse";
import { YouTubeEmbed } from "@/components/lecture/youtube-embed";
import { MindMap } from "@/components/lecture/mind-map";
import type { MindMapNode } from "@/lib/mindmap";
import type { ClientQuiz } from "@/components/quiz/quiz-modal";

// ISR with on-demand revalidation triggered by admin save (revalidatePath).
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const slugs = await getAllPublishedSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    // DB unreachable at build time: fall back to on-demand rendering
    // (dynamicParams = true). Keeps deploys resilient to transient DB issues.
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lecture = await getLectureBySlug(slug);
  if (!lecture) return { title: "Lecture not found" };
  return {
    title: lecture.titleEn || lecture.titleTa,
    description: lecture.summary,
    openGraph: {
      title: lecture.titleTa,
      description: lecture.summary,
      images: lecture.featuredImage ? [lecture.featuredImage] : undefined,
    },
  };
}

export default async function LecturePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lecture = await getLectureBySlug(slug);
  if (!lecture) notFound();

  const user = await getCurrentUser();
  const isMember = !!user; // any authenticated user can read in full

  // ── Server-side gating ──────────────────────────────────────────────────
  // Guests receive only the first ~30%. The remainder is computed here and
  // simply never serialized into the guest's HTML — it cannot be unlocked in
  // devtools. Members get the whole thing.
  const { preview, hasMore } = splitContentForGate(lecture.content, 0.3);
  const visibleHtml = isMember ? lecture.content : preview;
  const showGate = !isMember && hasMore;

  // Quiz: members only, and only if they haven't completed it.
  let clientQuiz: ClientQuiz | null = null;
  let quizAlreadyTaken = false;
  if (isMember && lecture.quiz) {
    const attempt = await prisma.quizAttempt.findUnique({
      where: { quizId_userId: { quizId: lecture.quiz.id, userId: user!.id } },
      select: { id: true },
    });
    quizAlreadyTaken = !!attempt;
    clientQuiz = {
      id: lecture.quiz.id,
      title: lecture.quiz.title,
      // Strip correct answers before sending to the client.
      questions: lecture.quiz.questions.map((q) => ({
        id: q.id,
        text: q.text,
        options: (q.options as string[]) ?? [],
      })),
    };
  }

  const verses = lecture.verses.map((lv) => lv.verse);
  const callbackUrl = `/lectures/${slug}`;

  return (
    <LectureReader
      lectureId={lecture.id}
      isMember={isMember}
      quiz={clientQuiz}
      quizAlreadyTaken={quizAlreadyTaken}
    >
      <article className="container max-w-3xl py-10">
        <header className="mb-8">
          <h1 className="font-tamil text-3xl font-bold leading-tight sm:text-4xl">
            {lecture.titleTa}
          </h1>
          {lecture.titleEn && (
            <p className="mt-2 text-lg text-muted-foreground">{lecture.titleEn}</p>
          )}
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" /> {formatDate(lecture.publishedAt)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> {lecture.readTime} min read
            </span>
          </div>
        </header>

        {lecture.featuredImage && (
          <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-xl bg-muted">
            <Image
              src={lecture.featuredImage}
              alt={lecture.titleTa}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              priority
            />
          </div>
        )}

        <p className="mb-8 font-tamil text-lg font-medium text-muted-foreground">
          {lecture.summary}
        </p>

        {lecture.youtubeUrl && <YouTubeEmbed url={lecture.youtubeUrl} />}

        {/* Rendered lecture body. Content is authored by admins via Tiptap. */}
        <div
          className="prose-lecture"
          dangerouslySetInnerHTML={{ __html: visibleHtml }}
        />

        {showGate && <GatedOverlay callbackUrl={callbackUrl} />}

        {/* Members-only sections below the gate */}
        {isMember && (
          <>
            <MindMap
              data={lecture.mindMap as MindMapNode | null}
              src={lecture.mindMapImage}
              alt={lecture.titleTa}
            />
            <QuranVerseList verses={verses} />
          </>
        )}
      </article>
    </LectureReader>
  );
}
