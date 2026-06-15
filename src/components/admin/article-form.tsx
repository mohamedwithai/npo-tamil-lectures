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
import { CATEGORIES } from "@/lib/categories";
import { saveArticle, type ActionState } from "@/server/actions/articles";
import { slugify } from "@/lib/utils";

export type ArticleFormData = {
  id?: string;
  titleTa: string;
  titleEn: string;
  slug: string;
  summary: string;
  content: string;
  coverImage: string;
  category: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  featured: boolean;
};

export function ArticleForm({ initial }: { initial: ArticleFormData }) {
  const router = useRouter();
  const [content, setContent] = React.useState(initial.content);
  const [slug, setSlug] = React.useState(initial.slug);
  const [slugTouched, setSlugTouched] = React.useState(!!initial.slug);

  const [state, formAction, pending] = useActionState(
    async (prev: ActionState | undefined, formData: FormData): Promise<ActionState> => {
      formData.set("content", content);
      const res = await saveArticle(prev, formData);
      if (res.ok) router.push("/admin/articles");
      return res;
    },
    undefined
  );

  return (
    <form action={formAction} className="space-y-6">
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

      <Field label="Slug *" hint="Used in the URL: /articles/<slug>">
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

      <Field label="Summary *" hint="Shown on cards and at the top of the article.">
        <Textarea name="summary" required defaultValue={initial.summary} className="font-tamil" />
      </Field>

      <Field label="Content *">
        <RichTextEditor value={content} onChange={setContent} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Cover image URL">
          <Input name="coverImage" defaultValue={initial.coverImage} placeholder="https://…" />
        </Field>
        <Field label="Category">
          <Select name="category" defaultValue={initial.category}>
            <option value="">— None —</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.nameTa} ({c.nameEn})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select name="status" defaultValue={initial.status}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
        </Field>
      </div>

      <Field label="Featured">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="featured" defaultChecked={initial.featured} className="h-4 w-4" />
          Highlight this article
        </label>
      </Field>

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save article"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/articles")}>
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
