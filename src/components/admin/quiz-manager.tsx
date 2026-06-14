"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { saveQuiz } from "@/server/actions/quiz";

type Question = {
  text: string;
  options: string[];
  correct: number;
  explanation: string;
};

export type LectureWithQuiz = {
  id: string;
  titleTa: string;
  quiz: {
    title: string;
    questions: { text: string; options: string[]; correct: number; explanation: string | null }[];
  } | null;
};

const blankQuestion = (): Question => ({
  text: "",
  options: ["", ""],
  correct: 0,
  explanation: "",
});

export function QuizManager({ lectures }: { lectures: LectureWithQuiz[] }) {
  const router = useRouter();
  const [lectureId, setLectureId] = React.useState(lectures[0]?.id ?? "");
  const [title, setTitle] = React.useState("Test Your Understanding");
  const [questions, setQuestions] = React.useState<Question[]>([blankQuestion()]);
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [pending, setPending] = React.useState(false);

  // Load the selected lecture's quiz into the editor.
  React.useEffect(() => {
    const lecture = lectures.find((l) => l.id === lectureId);
    if (lecture?.quiz) {
      setTitle(lecture.quiz.title);
      setQuestions(
        lecture.quiz.questions.map((q) => ({
          text: q.text,
          options: q.options.length ? q.options : ["", ""],
          correct: q.correct,
          explanation: q.explanation ?? "",
        }))
      );
    } else {
      setTitle("Test Your Understanding");
      setQuestions([blankQuestion()]);
    }
    setMsg(null);
  }, [lectureId, lectures]);

  function update(i: number, patch: Partial<Question>) {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }

  async function save() {
    setPending(true);
    setMsg(null);
    const res = await saveQuiz({ lectureId, title, questions });
    setPending(false);
    setMsg({ ok: res.ok, text: res.ok ? "Quiz saved." : res.error ?? "Failed to save" });
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Lecture</Label>
          <Select value={lectureId} onChange={(e) => setLectureId(e.target.value)}>
            {lectures.map((l) => (
              <option key={l.id} value={l.id}>
                {l.titleTa} {l.quiz ? "• has quiz" : ""}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Quiz title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Add 3–5 multiple-choice questions. Mark the correct option with the radio button.
      </p>

      {questions.map((q, i) => (
        <Card key={i}>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <Label>Question {i + 1}</Label>
              {questions.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuestions((qs) => qs.filter((_, idx) => idx !== i))}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
            <Textarea
              placeholder="Question text"
              className="font-tamil"
              value={q.text}
              onChange={(e) => update(i, { text: e.target.value })}
            />
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${i}`}
                    checked={q.correct === oi}
                    onChange={() => update(i, { correct: oi })}
                    aria-label={`Mark option ${oi + 1} correct`}
                  />
                  <Input
                    className="font-tamil"
                    placeholder={`Option ${oi + 1}`}
                    value={opt}
                    onChange={(e) =>
                      update(i, {
                        options: q.options.map((o, idx) => (idx === oi ? e.target.value : o)),
                      })
                    }
                  />
                  {q.options.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        update(i, {
                          options: q.options.filter((_, idx) => idx !== oi),
                          correct: q.correct >= q.options.length - 1 ? 0 : q.correct,
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {q.options.length < 6 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => update(i, { options: [...q.options, ""] })}
                >
                  <Plus className="h-4 w-4" /> Add option
                </Button>
              )}
            </div>
            <Textarea
              placeholder="Explanation (shown after answering)"
              className="font-tamil"
              value={q.explanation}
              onChange={(e) => update(i, { explanation: e.target.value })}
            />
          </CardContent>
        </Card>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        {questions.length < 5 && (
          <Button variant="outline" onClick={() => setQuestions((qs) => [...qs, blankQuestion()])}>
            <Plus className="h-4 w-4" /> Add question
          </Button>
        )}
        <Button onClick={save} disabled={pending || !lectureId}>
          {pending ? "Saving…" : "Save quiz"}
        </Button>
        {msg && (
          <span className={msg.ok ? "text-sm text-emerald-600" : "text-sm text-destructive"}>
            {msg.text}
          </span>
        )}
      </div>
    </div>
  );
}
