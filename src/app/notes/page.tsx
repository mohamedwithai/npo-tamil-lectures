import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getUserNotes } from "@/lib/queries";
import { DeleteNoteButton } from "@/components/lecture/delete-note-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "My Notes" };

export default async function NotesPage() {
  const user = await requireUser("/notes");
  const notes = await getUserNotes(user.id);

  return (
    <div className="container max-w-3xl py-12">
      <header className="mb-8">
        <h1 className="font-tamil text-3xl font-bold">எனது குறிப்புகள்</h1>
        <p className="mt-1 text-muted-foreground">My Notes — passages you’ve annotated</p>
      </header>

      {notes.length === 0 ? (
        <p className="rounded-lg border border-dashed p-10 text-center font-tamil text-muted-foreground">
          இன்னும் குறிப்புகள் இல்லை. ஒரு சொற்பொழிவு/கட்டுரையில் உரையைத்
          தேர்ந்தெடுத்து “Note” ஐ அழுத்தவும்.
        </p>
      ) : (
        <ul className="space-y-4">
          {notes.map((n) => {
            const href = n.lecture
              ? `/lectures/${n.lecture.slug}`
              : n.article
                ? `/articles/${n.article.slug}`
                : "#";
            const title = n.lecture?.titleTa ?? n.article?.titleTa ?? "";
            return (
              <li key={n.id} className="rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={href}
                    className="font-tamil text-sm font-semibold text-primary hover:underline"
                  >
                    {title}
                  </Link>
                  <DeleteNoteButton id={n.id} />
                </div>
                <p className="mt-2 font-tamil text-sm text-muted-foreground">
                  <mark className={`hl hl-${n.color}`}>{n.quote}</mark>
                </p>
                <p className="mt-2 whitespace-pre-wrap font-tamil">{n.note}</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
