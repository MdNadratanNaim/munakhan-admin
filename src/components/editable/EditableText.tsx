"use client";

import { useEffect, useRef, useState } from "react";
import { EditBadge } from "./EditBadge";
import { FormatBar, useTextFormatter } from "./FormatBar";
import { useAutoSize } from "./useAutoSize";
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
 * Click-to-edit rather than contentEditable: predictable cursor/state
 * behavior, and it commits to the store (one history entry) on blur/Enter
 * instead of per keystroke, so undo steps stay meaningful.
 *
 * The edit box is an auto-growing textarea (Enter still applies the change), so a long value
 * stays fully visible and keeps its height while you edit instead of collapsing
 * into a one-line input. A small bar above it adds bold, italic, links and line breaks.
 */
export function EditableText({ value, onCommit, as = "span", className = "", placeholder }: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const viewRef = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const cancelled = useRef(false);
  const [viewHeight, setViewHeight] = useState(0);
  const Tag = as as React.ElementType;
  const formatter = useTextFormatter(inputRef, draft, setDraft);

  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useAutoSize(inputRef, editing, draft, viewHeight);

  function startEditing() {
    cancelled.current = false;
    setViewHeight(viewRef.current?.getBoundingClientRect().height ?? 0);
    setEditing(true);
  }

  function commitAndClose() {
    setEditing(false);
    if (!cancelled.current && draft !== value) onCommit(draft);
  }

  if (editing) {
    return (
      <div className="edit-wrap" ref={wrapRef}>
        <FormatBar formatter={formatter} wrapRef={wrapRef} onLeave={commitAndClose} hint="Enter to apply · Esc to cancel" />
        <textarea
          ref={inputRef}
          rows={1}
          className={`editable-input editable-autosize ${className}`}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => {
            if (wrapRef.current?.contains(e.relatedTarget as Node | null)) return;
            commitAndClose();
          }}
          onKeyDown={(e) => {
            if (formatter.handleShortcut(e)) return;
            if (e.key === "Enter") {
              e.preventDefault();
              if (e.shiftKey) formatter.lineBreak();
              else (e.target as HTMLTextAreaElement).blur();
            }
            if (e.key === "Escape") {
              cancelled.current = true;
              setDraft(value);
              setEditing(false);
            }
          }}
        />
      </div>
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
