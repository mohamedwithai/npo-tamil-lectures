"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { saveQuranVerse, deleteQuranVerse } from "@/server/actions/quran";

export type VerseRow = {
  id: string;
  surahName: string;
  surahNumber: number | null;
  verseNumber: number;
  arabicText: string;
  tamilText: string;
};

export function QuranManager({ verses }: { verses: VerseRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<VerseRow | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    if (editing) fd.set("id", editing.id);
    const res = await saveQuranVerse(undefined, fd);
    setPending(false);
    if (res.ok) {
      formRef.current?.reset();
      setEditing(null);
      router.refresh();
    } else {
      setError(res.error ?? "Could not save");
    }
  }

  async function onDelete(id: string) {
    await deleteQuranVerse(id);
    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
      <Card className="h-fit">
        <CardContent className="p-5">
          <h2 className="mb-4 font-semibold">
            {editing ? "Edit verse" : "Add verse"}
          </h2>
          <form ref={formRef} onSubmit={onSubmit} className="space-y-3" key={editing?.id ?? "new"}>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1.5">
                <Label>Surah name *</Label>
                <Input name="surahName" required defaultValue={editing?.surahName} />
              </div>
              <div className="space-y-1.5">
                <Label>Surah #</Label>
                <Input name="surahNumber" type="number" min={1} max={114} defaultValue={editing?.surahNumber ?? ""} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Verse number *</Label>
              <Input name="verseNumber" type="number" min={1} required defaultValue={editing?.verseNumber} />
            </div>
            <div className="space-y-1.5">
              <Label>Arabic text *</Label>
              <Textarea name="arabicText" required dir="rtl" className="arabic-text text-lg" defaultValue={editing?.arabicText} />
            </div>
            <div className="space-y-1.5">
              <Label>Tamil translation *</Label>
              <Textarea name="tamilText" required className="font-tamil" defaultValue={editing?.tamilText} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : editing ? "Update" : <><Plus className="h-4 w-4" /> Add</>}
              </Button>
              {editing && (
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="font-semibold">{verses.length} verses</h2>
        {verses.map((v) => (
          <Card key={v.id}>
            <CardContent className="flex items-start justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="text-xs font-medium text-primary">
                  {v.surahName} : {v.verseNumber}
                </p>
                <p className="arabic-text mt-1 truncate text-right text-lg">{v.arabicText}</p>
                <p className="font-tamil mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {v.tamilText}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(v)}>
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDelete(v.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
