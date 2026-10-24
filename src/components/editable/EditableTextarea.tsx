"use client";

import { useEffect, useRef, useState } from "react";
import { EditBadge } from "./EditBadge";
import { FormatBar, useTextFormatter } from "./FormatBar";
import { useAutoSize } from "./useAutoSize";
import { toSafeHtml } from "@/lib/safe-html";

interface EditableTextareaProps {
  value: string;
  onCommit: (next: string) => void;
  className?: string;
  placeholder?: string;
}

export function EditableTextarea({ value, onCommit, className = "", placeholder }: EditableTextareaProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [viewHeight, setViewHeight] = useState(0);
  const ref = useRef<HTMLTextAreaElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const cancelled = useRef(false);
  const formatter = useTextFormatter(ref, draft, setDraft);

  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);
  useAutoSize(ref, editing, draft, viewHeight);

  function startEditing() {
    cancelled.current = false;
    // Remember how tall the text is displayed, so the edit box starts at least that tall.
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
        <FormatBar formatter={formatter} wrapRef={wrapRef} onLeave={commitAndClose} hint="Click outside to apply · Esc to cancel" />
        <textarea
          ref={ref}
          className={`editable-input editable-textarea ${className}`}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => {
            if (wrapRef.current?.contains(e.relatedTarget as Node | null)) return;
            commitAndClose();
          }}
          onKeyDown={(e) => {
            if (formatter.handleShortcut(e)) return;
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
