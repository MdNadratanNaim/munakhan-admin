"use client";

import { useRef, useState } from "react";
import { EditBadge } from "./EditBadge";
import { RichTextBox } from "./RichTextBox";
import { toSafeHtml } from "@/lib/safe-html";

export type EditableTextTag = "span" | "h1" | "h2" | "h3" | "p" | "div";

interface EditableTextProps {
  value: string;
  onCommit: (next: string) => void;
  as?: EditableTextTag;
  className?: string;
  placeholder?: string;
}

/**
 * Click-to-edit: the text turns into a small word-processor box (bold, italic, underline, links …) that shows
 * the text as it will look on the website. Changes reach the store once, when editing ends, so undo steps stay meaningful.
 */
export function EditableText({ value, onCommit, as = "span", className = "", placeholder }: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const viewRef = useRef<HTMLElement>(null);
  const [viewHeight, setViewHeight] = useState(0);
  const Tag = as as React.ElementType;

  function startEditing() {
    setViewHeight(viewRef.current?.getBoundingClientRect().height ?? 0);
    setEditing(true);
  }

  if (editing) {
    return (
      <RichTextBox
        value={value}
        className={className}
        placeholder={placeholder}
        minHeight={viewHeight}
        onDone={(next) => {
          setEditing(false);
          if (next !== null) onCommit(next);
        }}
      />
    );
  }

  return (
    <Tag
      ref={viewRef}
      className={`editable-field ${className}`}
      onClick={(e: React.MouseEvent) => {
        e.preventDefault();
        startEditing();
      }}
      role="button"
      tabIndex={0}
      title="Click to edit"
      onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && startEditing()}
    >
      {value ? <span dangerouslySetInnerHTML={{ __html: toSafeHtml(value) }} /> : <span className="editable-placeholder">{placeholder ?? "Click to edit"}</span>}
      <EditBadge />
    </Tag>
  );
}
