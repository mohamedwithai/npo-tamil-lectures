"use client";

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading2,
  Heading3,
  Undo,
  Redo,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Tiptap-based rich text editor for lecture content. Emits HTML via onChange.
 * The parent form keeps the HTML in state and submits it (server re-derives the
 * plain-text projection + read time, so we don't trust the client for those).
 */
export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] } })],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose-lecture min-h-[320px] max-w-none rounded-b-lg border border-t-0 border-input bg-background px-4 py-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) {
    return <div className="h-96 animate-pulse rounded-lg border bg-muted" />;
  }

  const Btn = ({
    onClick,
    active,
    label,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    label: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "rounded p-2 text-sm transition-colors hover:bg-accent",
        active && "bg-accent text-accent-foreground"
      )}
    >
      {children}
    </button>
  );

  return (
    <div>
      <div className="flex flex-wrap gap-1 rounded-t-lg border border-input bg-muted/50 p-1">
        <Btn label="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>
          <Bold className="h-4 w-4" />
        </Btn>
        <Btn label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}>
          <Italic className="h-4 w-4" />
        </Btn>
        <Btn label="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}>
          <Heading2 className="h-4 w-4" />
        </Btn>
        <Btn label="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })}>
          <Heading3 className="h-4 w-4" />
        </Btn>
        <Btn label="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}>
          <List className="h-4 w-4" />
        </Btn>
        <Btn label="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}>
          <ListOrdered className="h-4 w-4" />
        </Btn>
        <Btn label="Quote" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")}>
          <Quote className="h-4 w-4" />
        </Btn>
        <div className="ml-auto flex gap-1">
          <Btn label="Undo" onClick={() => editor.chain().focus().undo().run()}>
            <Undo className="h-4 w-4" />
          </Btn>
          <Btn label="Redo" onClick={() => editor.chain().focus().redo().run()}>
            <Redo className="h-4 w-4" />
          </Btn>
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
