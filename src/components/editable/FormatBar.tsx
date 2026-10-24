"use client";

import { useRef, useState, type RefObject } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * Formatting helpers for a text box that holds HTML (the website renders <b>, <i>, <br> and <a> from the text).
 * Instead of asking people to type tags by hand, the bar wraps the selected words for them.
 */
export function useTextFormatter(areaRef: RefObject<HTMLTextAreaElement | null>, value: string, setValue: (next: string) => void) {
  const savedSelection = useRef<{ start: number; end: number } | null>(null);

  function selection() {
    const el = areaRef.current;
    return { start: el?.selectionStart ?? value.length, end: el?.selectionEnd ?? value.length };
  }

  function apply(next: string, selectFrom: number, selectTo: number) {
    setValue(next);
    requestAnimationFrame(() => {
      const el = areaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(selectFrom, selectTo);
    });
  }

  function wrap(before: string, after: string, fallback: string, range?: { start: number; end: number }) {
    const { start, end } = range ?? selection();
    const chosen = value.slice(start, end) || fallback;
    const next = value.slice(0, start) + before + chosen + after + value.slice(end);
    apply(next, start + before.length, start + before.length + chosen.length);
  }

  function lineBreak() {
    const { start, end } = selection();
    apply(value.slice(0, start) + "<br>" + value.slice(end), start + 4, start + 4);
  }

  function rememberSelection() {
    savedSelection.current = selection();
  }

  function link(url: string) {
    const clean = url.trim();
    if (!clean) return;
    const href = /^(https?:|mailto:|tel:|\/|#)/i.test(clean) ? clean : `https://${clean}`;
    wrap(`<a href="${href.replace(/"/g, "&quot;")}">`, "</a>", "link text", savedSelection.current ?? undefined);
  }

  /** Ctrl/⌘ + B and I, as in any word processor. Returns true when the key was handled. */
  function handleShortcut(e: React.KeyboardEvent): boolean {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return false;
    const key = e.key.toLowerCase();
    if (key === "b") {
      e.preventDefault();
      wrap("<b>", "</b>", "bold text");
      return true;
    }
    if (key === "i") {
      e.preventDefault();
      wrap("<i>", "</i>", "italic text");
      return true;
    }
    return false;
  }

  return { wrap, lineBreak, link, rememberSelection, handleShortcut };
}

interface FormatBarProps {
  formatter: ReturnType<typeof useTextFormatter>;
  wrapRef: RefObject<HTMLElement | null>;
  /** Called when focus leaves the whole editor (the text box and this bar), so the edit can be applied. */
  onLeave: () => void;
  hint: string;
}

export function FormatBar({ formatter, wrapRef, onLeave, hint }: FormatBarProps) {
  const [linking, setLinking] = useState(false);
  const [url, setUrl] = useState("");
  // Keep the text box focused while a bar button is pressed, so the edit is not applied by accident.
  const keepFocus = (e: React.MouseEvent) => e.preventDefault();

  function openLink() {
    formatter.rememberSelection();
    setUrl("");
    setLinking(true);
  }

  function applyLink() {
    formatter.link(url);
    setLinking(false);
  }

  return (
    <div className="format-bar">
      <div className="format-tools" role="toolbar" aria-label="Text formatting">
        <button type="button" className="icon-btn icon-btn-sm" onMouseDown={keepFocus} onClick={() => formatter.wrap("<b>", "</b>", "bold text")} title="Bold (Ctrl/⌘ + B)" aria-label="Bold">
          <Icon name="bold" size={16} />
        </button>
        <button type="button" className="icon-btn icon-btn-sm" onMouseDown={keepFocus} onClick={() => formatter.wrap("<i>", "</i>", "italic text")} title="Italic (Ctrl/⌘ + I)" aria-label="Italic">
          <Icon name="italic" size={16} />
        </button>
        <button type="button" className="icon-btn icon-btn-sm" onMouseDown={keepFocus} onClick={openLink} title="Link" aria-label="Add link">
          <Icon name="link" size={16} />
        </button>
        <button type="button" className="icon-btn icon-btn-sm" onMouseDown={keepFocus} onClick={formatter.lineBreak} title="New line" aria-label="New line">
          <Icon name="lineBreak" size={16} />
        </button>
      </div>
      {linking ? (
        <div className="format-link">
          <input
            autoFocus
            type="url"
            value={url}
            placeholder="Web address, then Enter"
            aria-label="Link address"
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                setLinking(false);
                const area = wrapRef.current?.querySelector("textarea");
                area?.focus();
              }
            }}
            onBlur={(e) => {
              if (wrapRef.current?.contains(e.relatedTarget as Node | null)) return;
              setLinking(false);
              onLeave();
            }}
          />
          <button type="button" className="btn btn-small btn-primary" onMouseDown={keepFocus} onClick={applyLink} disabled={!url.trim()}>
            Add link
          </button>
        </div>
      ) : (
        <span className="format-hint">{hint}</span>
      )}
    </div>
  );
}
