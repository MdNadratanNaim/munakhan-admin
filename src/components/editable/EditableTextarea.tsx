"use client";

import { useRef, useState } from "react";
import { EditBadge } from "./EditBadge";
import { RichTextBox } from "./RichTextBox";
import { toSafeHtml } from "@/lib/safe-html";

interface EditableTextareaProps {
  value: string;
  onCommit: (next: string) => void;
  className?: string;
  placeholder?: string;
}

/** Same as EditableText, for longer text: Enter starts a new line and editing ends when you click elsewhere. */
export function EditableTextarea({ value, onCommit, className = "", placeholder }: EditableTextareaProps) {
  const [editing, setEditing] = useState(false);
  const [viewHeight, setViewHeight] = useState(0);
  const viewRef = useRef<HTMLDivElement>(null);

  function startEditing() {
    // The edit box starts at least as tall as the text was displayed, so all of it stays visible.
    setViewHeight(viewRef.current?.getBoundingClientRect().height ?? 0);
    setEditing(true);
  }

  if (editing) {
    return (
      <RichTextBox
        multiline
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
    <div
      ref={viewRef}
      className={`editable-field editable-multiline ${className}`}
      onClick={(e) => {
        e.preventDefault();
        startEditing();
      }}
      role="button"
      tabIndex={0}
      title="Click to edit"
      onKeyDown={(e) => e.key === "Enter" && startEditing()}
    >
      {value ? <span dangerouslySetInnerHTML={{ __html: toSafeHtml(value) }} /> : <span className="editable-placeholder">{placeholder ?? "Click to edit"}</span>}
      <EditBadge />
    </div>
  );
}
