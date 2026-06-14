"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Result = {
  id: string;
  slug: string;
  titleTa: string;
  titleEn: string | null;
  snippet: string;
};

export function SearchBar({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<Result[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(-1);
  const boxRef = React.useRef<HTMLDivElement>(null);

  // Debounced fetch.
  React.useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: ctrl.signal,
        });
        const data = await res.json();
        setResults(data.results ?? []);
        setOpen(true);
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  // Close on outside click.
  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(slug: string) {
    setOpen(false);
    setQ("");
    onNavigate?.();
    router.push(`/lectures/${slug}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      if (active >= 0 && results[active]) go(results[active].slug);
      else if (q.trim()) {
        onNavigate?.();
        router.push(`/search?q=${encodeURIComponent(q.trim())}`);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => results.length && setOpen(true)}
          placeholder="தேடல் / Search lectures…"
          className="pl-9"
          aria-label="Search lectures"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-2 max-h-96 w-full overflow-auto rounded-lg border bg-popover p-1 shadow-lg">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {loading ? "Searching…" : "No matches found"}
            </p>
          ) : (
            results.map((r, i) => (
              <button
                key={r.id}
                onClick={() => go(r.slug)}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "block w-full rounded-md px-3 py-2 text-left transition-colors",
                  active === i ? "bg-accent" : "hover:bg-accent/60"
                )}
              >
                <div className="font-tamil font-medium">{r.titleTa}</div>
                {r.titleEn && (
                  <div className="text-xs text-muted-foreground">{r.titleEn}</div>
                )}
                <div
                  className="mt-0.5 line-clamp-1 text-xs text-muted-foreground"
                  // ts_headline output is server-generated and safe (no user HTML).
                  dangerouslySetInnerHTML={{ __html: r.snippet }}
                />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
