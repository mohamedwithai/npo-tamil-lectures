"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CATEGORIES } from "@/lib/categories";
import { saveBook, type ActionState } from "@/server/actions/books";

export type BookFormData = {
  id?: string;
  title: string;
  titleEn: string;
  author: string;
  description: string;
  coverImage: string;
  pdfUrl: string;
  category: string;
  pages: string;
  featured: boolean;
  published: boolean;
};

export function BookForm({ initial }: { initial: BookFormData }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState | undefined, formData: FormData): Promise<ActionState> => {
      const res = await saveBook(prev, formData);
      if (res.ok) router.push("/admin/books");
      return res;
    },
    undefined
  );

  return (
    <form action={formAction} className="space-y-6">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title (Tamil) *">
          <Input name="title" required defaultValue={initial.title} className="font-tamil" />
        </Field>
        <Field label="English title">
          <Input name="titleEn" defaultValue={initial.titleEn} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Author">
          <Input name="author" defaultValue={initial.author} className="font-tamil" />
        </Field>
        <Field label="Pages">
          <Input name="pages" type="number" min={0} defaultValue={initial.pages} />
        </Field>
      </div>

      <Field label="Description">
        <Textarea name="description" defaultValue={initial.description} className="font-tamil" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cover image URL">
          <Input name="coverImage" defaultValue={initial.coverImage} placeholder="https://…" />
        </Field>
        <Field label="PDF URL" hint="Link readers use to read / download.">
          <Input name="pdfUrl" defaultValue={initial.pdfUrl} placeholder="https://…" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
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
        <Field label="Published">
          <label className="flex h-10 items-center gap-2 text-sm">
            <input type="checkbox" name="published" defaultChecked={initial.published} className="h-4 w-4" />
            Visible in the library
          </label>
        </Field>
        <Field label="Featured">
          <label className="flex h-10 items-center gap-2 text-sm">
            <input type="checkbox" name="featured" defaultChecked={initial.featured} className="h-4 w-4" />
            Highlight this book
          </label>
        </Field>
      </div>

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save book"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/books")}>
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
