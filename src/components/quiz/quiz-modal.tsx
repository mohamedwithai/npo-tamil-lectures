"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Trophy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { submitQuizAttempt, type AttemptResult } from "@/server/actions/quiz";

export type ClientQuiz = {
  id: string;
  title: string;
  // Correct answers are intentionally NOT included — grading happens server-side.
  questions: { id: string; text: string; options: string[] }[];
};

export function QuizModal({
  quiz,
  open,
  onOpenChange,
  onStarted,
}: {
  quiz: ClientQuiz;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onStarted?: () => void;
}) {
  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState<number[]>([]);
  const [result, setResult] = React.useState<AttemptResult | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) onStarted?.();
  }, [open, onStarted]);

  const q = quiz.questions[step];
  const isLast = step === quiz.questions.length - 1;

  function choose(i: number) {
    setAnswers((a) => {
      const next = [...a];
      next[step] = i;
      return next;
    });
  }

  async function finish() {
    setSubmitting(true);
    const res = await submitQuizAttempt({ quizId: quiz.id, answers });
    setResult(res);
    setSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {!result ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-tamil">{quiz.title}</DialogTitle>
              <DialogDescription>
                Question {step + 1} of {quiz.questions.length}
              </DialogDescription>
            </DialogHeader>

            <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${((step + 1) / quiz.questions.length) * 100}%` }}
              />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <p className="font-tamil text-base font-medium">{q.text}</p>
                <div className="space-y-2">
                  {q.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => choose(i)}
                      className={cn(
                        "w-full rounded-lg border p-3 text-left font-tamil text-sm transition-colors",
                        answers[step] === i
                          ? "border-primary bg-primary/10"
                          : "hover:bg-accent"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between">
              <Button
                variant="ghost"
                disabled={step === 0}
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </Button>
              {isLast ? (
                <Button
                  disabled={answers[step] === undefined || submitting}
                  onClick={finish}
                >
                  {submitting ? "Submitting…" : "Submit"}
                </Button>
              ) : (
                <Button
                  disabled={answers[step] === undefined}
                  onClick={() => setStep((s) => s + 1)}
                >
                  Next
                </Button>
              )}
            </div>
          </>
        ) : (
          <ResultView result={result} quiz={quiz} onClose={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ResultView({
  result,
  quiz,
  onClose,
}: {
  result: AttemptResult;
  quiz: ClientQuiz;
  onClose: () => void;
}) {
  if (!result.ok) {
    return (
      <div className="py-6 text-center">
        <p className="text-destructive">{result.error ?? "Something went wrong."}</p>
        <Button className="mt-4" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }

  const pct = Math.round(((result.score ?? 0) / (result.total ?? 1)) * 100);
  return (
    <div>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" /> You scored {result.score}/{result.total}
        </DialogTitle>
        <DialogDescription>{pct}% correct</DialogDescription>
      </DialogHeader>

      <div className="mt-4 max-h-72 space-y-3 overflow-auto">
        {quiz.questions.map((question, i) => {
          const review = result.review?.[i];
          const correct = review?.chosen === review?.correct;
          return (
            <div key={question.id} className="rounded-lg border p-3 text-sm">
              <div className="flex items-start gap-2">
                {correct ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                )}
                <div className="space-y-1">
                  <p className="font-tamil font-medium">{question.text}</p>
                  {!correct && review && (
                    <p className="font-tamil text-xs text-emerald-700 dark:text-emerald-400">
                      Correct: {question.options[review.correct]}
                    </p>
                  )}
                  {review?.explanation && (
                    <p className="font-tamil text-xs text-muted-foreground">
                      {review.explanation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Button className="mt-4 w-full" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}
