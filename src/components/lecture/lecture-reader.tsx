"use client";

import * as React from "react";
import { recordEvent } from "@/server/actions/analytics";
import { QuizModal, type ClientQuiz } from "@/components/quiz/quiz-modal";

/**
 * Wraps the rendered lecture body. Responsibilities:
 *  - Render a top reading-progress bar.
 *  - Fire discrete analytics events at scroll milestones (no heartbeat).
 *  - At 95% scroll, open the quiz modal (members only, once).
 */
export function LectureReader({
  lectureId,
  isMember,
  quiz,
  quizAlreadyTaken,
  children,
}: {
  lectureId: string;
  isMember: boolean;
  quiz: ClientQuiz | null;
  quizAlreadyTaken: boolean;
  children: React.ReactNode;
}) {
  const [progress, setProgress] = React.useState(0);
  const [quizOpen, setQuizOpen] = React.useState(false);
  const fired = React.useRef<Set<string>>(new Set());

  type EventName =
    | "lecture_opened"
    | "lecture_completed"
    | "scroll_25"
    | "scroll_50"
    | "scroll_75"
    | "scroll_100"
    | "quiz_started";

  // Fire-once helper.
  const fire = React.useCallback(
    (type: EventName) => {
      if (fired.current.has(type)) return;
      fired.current.add(type);
      recordEvent({ type, lectureId }).catch(() => {});
    },
    [lectureId]
  );

  React.useEffect(() => {
    fire("lecture_opened");
  }, [fire]);

  React.useEffect(() => {
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        const pct = max > 0 ? Math.min(100, Math.round((doc.scrollTop / max) * 100)) : 0;
        setProgress(pct);

        if (pct >= 25) fire("scroll_25");
        if (pct >= 50) fire("scroll_50");
        if (pct >= 75) fire("scroll_75");
        if (pct >= 100) {
          fire("scroll_100");
          fire("lecture_completed");
        }

        // Quiz trigger at 95% — members only, not already taken.
        if (pct >= 95 && isMember && quiz && !quizAlreadyTaken && !fired.current.has("quiz_open")) {
          fired.current.add("quiz_open");
          setQuizOpen(true);
        }
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [fire, isMember, quiz, quizAlreadyTaken]);

  return (
    <>
      <div className="reading-progress" style={{ width: `${progress}%` }} aria-hidden />
      {children}
      {quiz && (
        <QuizModal
          quiz={quiz}
          open={quizOpen}
          onOpenChange={setQuizOpen}
          onStarted={() => fire("quiz_started")}
        />
      )}
    </>
  );
}
