"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateSuggestionStatus } from "@/server/actions/suggestions";
import type { SuggestionStatus } from "@prisma/client";

export function SuggestionActions({
  id,
  status,
}: {
  id: string;
  status: SuggestionStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const set = (s: SuggestionStatus) =>
    startTransition(async () => {
      await updateSuggestionStatus(id, s);
      router.refresh();
    });

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "REVIEWED" && (
        <Button size="sm" onClick={() => set("REVIEWED")} disabled={pending}>
          <Check className="h-4 w-4" /> Mark reviewed
        </Button>
      )}
      {status !== "DISMISSED" && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => set("DISMISSED")}
          disabled={pending}
        >
          <X className="h-4 w-4" /> Dismiss
        </Button>
      )}
      {status !== "NEW" && (
        <Button size="sm" variant="ghost" onClick={() => set("NEW")} disabled={pending}>
          <RotateCcw className="h-4 w-4" /> Reopen
        </Button>
      )}
    </div>
  );
}
