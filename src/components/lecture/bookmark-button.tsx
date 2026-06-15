"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleBookmark } from "@/server/actions/bookmarks";

export function BookmarkButton({
  target,
  id,
  initialBookmarked,
  isMember,
  callbackUrl,
}: {
  target: "lecture" | "article";
  id: string;
  initialBookmarked: boolean;
  isMember: boolean;
  callbackUrl: string;
}) {
  const router = useRouter();
  const [saved, setSaved] = React.useState(initialBookmarked);
  const [pending, setPending] = React.useState(false);

  async function onClick() {
    if (!isMember) {
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }
    setPending(true);
    const next = !saved;
    setSaved(next); // optimistic
    const res = await toggleBookmark({ target, id });
    setPending(false);
    if (!res.ok) setSaved(!next); // revert on failure
    else setSaved(res.bookmarked ?? next);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={saved}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60",
        saved
          ? "border-primary bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
      {saved ? "Saved" : "Save"}
    </button>
  );
}
