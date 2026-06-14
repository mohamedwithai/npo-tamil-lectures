import { prisma } from "@/lib/prisma";
import { QuizManager, type LectureWithQuiz } from "@/components/admin/quiz-manager";

export default async function AdminQuizzesPage() {
  const rows = await prisma.lecture.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      titleTa: true,
      quiz: {
        select: {
          title: true,
          questions: {
            orderBy: { order: "asc" },
            select: { text: true, options: true, correct: true, explanation: true },
          },
        },
      },
    },
  });

  const lectures: LectureWithQuiz[] = rows.map((l) => ({
    id: l.id,
    titleTa: l.titleTa,
    quiz: l.quiz
      ? {
          title: l.quiz.title,
          questions: l.quiz.questions.map((q) => ({
            text: q.text,
            options: (q.options as string[]) ?? [],
            correct: q.correct,
            explanation: q.explanation,
          })),
        }
      : null,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quizzes</h1>
      {lectures.length === 0 ? (
        <p className="text-muted-foreground">Create a lecture first, then add its quiz here.</p>
      ) : (
        <QuizManager lectures={lectures} />
      )}
    </div>
  );
}
