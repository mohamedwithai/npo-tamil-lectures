"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import {
  saveLecture,
  previewMindMap,
  type ActionState,
} from "@/server/actions/lectures";
import { MindMap } from "@/components/lecture/mind-map";
import type { MindMapNode } from "@/lib/mindmap";
import { slugify } from "@/lib/utils";

export type VerseOption = {
  id: string;
  surahName: string;
  verseNumber: number;
};

export type LectureFormData = {
  id?: string;
  titleTa: string;
  titleEn: string;
  slug: string;
  summary: string;
  content: string;
  featuredImage: string;
  youtubeUrl: string;
  mindMapImage: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  featured: boolean;
  verseIds: string[];
};

export function LectureForm({
  initial,
  verses,
}: {
  initial: LectureFormData;
  verses: VerseOption[];
}) {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [content, setContent] = React.useState(initial.content);
  const [slug, setSlug] = React.useState(initial.slug);
  const [slugTouched, setSlugTouched] = React.useState(!!initial.slug);

  const [mindMap, setMindMap] = React.useState<MindMapNode | null>(null);
  const [mmPending, setMmPending] = React.useState(false);
  const [mmError, setMmError] = React.useState<string | null>(null);

  async function handlePreviewMindMap() {
    setMmError(null);
    setMmPending(true);
    try {
      const fd = new FormData(formRef.current!);
      const res = await previewMindMap(
        String(fd.get("titleTa") ?? ""),
        content,
        String(fd.get("titleEn") ?? "")
      );
      if (res.ok && res.mindMap) setMindMap(res.mindMap);
      else setMmError(res.error ?? "Could not generate a mind map.");
    } catch {
      setMmError("Could not generate a mind map.");
    } finally {
      setMmPending(false);
    }
  }

  const [state, formAction, pending] = useActionState(
    async (prev: ActionState | undefined, formData: FormData): Promise<ActionState> => {
      formData.set("content", content);
      const res = await saveLecture(prev, formData);
      if (res.ok) router.push("/admin/lectures");
      return res;
    },
    undefined
  );

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tamil title *">
          <Input
            name="titleTa"
            required
            defaultValue={initial.titleTa}
            className="font-tamil"
            onChange={(e) => {
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
          />
        </Field>
        <Field label="English title">
          <Input name="titleEn" defaultValue={initial.titleEn} />
        </Field>
      </div>

      <Field label="Slug *" hint="Used in the URL: /lectures/<slug>">
        <Input
          name="slug"
          required
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
        />
      </Field>

      <Field label="Summary *" hint="Shown on cards and at the top of the lecture.">
        <Textarea name="summary" required defaultValue={initial.summary} className="font-tamil" />
      </Field>

      <Field label="Content *">
        <RichTextEditor value={content} onChange={setContent} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Featured image URL">
          <Input name="featuredImage" defaultValue={initial.featuredImage} placeholder="https://…" />
        </Field>
        <Field label="YouTube URL">
          <Input name="youtubeUrl" defaultValue={initial.youtubeUrl} placeholder="https://youtu.be/…" />
        </Field>
        <Field label="Mind map image URL" hint="Optional manual override. Leave empty to use the auto-generated mind map.">
          <Input name="mindMapImage" defaultValue={initial.mindMapImage} placeholder="https://…" />
        </Field>
      </div>

      <div className="rounded-lg border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Mind map (auto-generated)</p>
            <p className="text-xs text-muted-foreground">
              Built from your content on save (Gemini, with a heading-based
              fallback). Preview it here first.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={handlePreviewMindMap} disabled={mmPending}>
            {mmPending ? "Generating…" : "Preview mind map"}
          </Button>
        </div>
        {mmError && <p className="mt-3 text-sm text-destructive">{mmError}</p>}
        {mindMap && <MindMap data={mindMap} alt="Preview" />}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Status">
          <Select name="status" defaultValue={initial.status}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
        </Field>
        <Field label="Featured">
          <label className="flex h-10 items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={initial.featured}
              className="h-4 w-4"
            />
            Show as the featured lecture
          </label>
        </Field>
      </div>

      <Field label="Linked Quran verses" hint="Displayed for members below the content.">
        {verses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No verses yet. Add some under Quran Verses.
          </p>
        ) : (
          <div className="grid max-h-48 gap-1 overflow-auto rounded-lg border p-3 sm:grid-cols-2">
            {verses.map((v) => (
              <label key={v.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="verseIds"
                  value={v.id}
                  defaultChecked={initial.verseIds.includes(v.id)}
                  className="h-4 w-4"
                />
                {v.surahName} : {v.verseNumber}
              </label>
            ))}
          </div>
        )}
      </Field>

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save lecture"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/lectures")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
