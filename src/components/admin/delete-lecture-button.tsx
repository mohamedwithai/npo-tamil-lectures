"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { deleteLecture } from "@/server/actions/lectures";

export function DeleteLectureButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function onDelete() {
    setPending(true);
    const res = await deleteLecture(id);
    setPending(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete lecture?</DialogTitle>
          <DialogDescription>
            “{title}” and its quiz & analytics links will be permanently removed. This
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={onDelete} disabled={pending}>
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
