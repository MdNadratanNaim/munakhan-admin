"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { fromEditable, toSafeHtml } from "@/lib/safe-html";

interface RichTextBoxProps {
  /** The stored text, as the website renders it (it may contain <b>, <i>, <br> …; the person never sees those). */
  value: string;
  /** Called once when editing ends. `null` means nothing was changed (or Esc was pressed). */
  onDone: (next: string | null) => void;
  /** Several lines: Enter starts a new line. Otherwise Enter finishes and Shift + Enter starts a new line. */
  multiline?: boolean;
  className?: string;
  placeholder?: string;
  /** Height the text had on screen before the click, so the box never starts smaller than it. */
  minHeight?: number;
}

type Marks = { bold: boolean; italic: boolean; underline: boolean; sup: boolean; sub: boolean; link: boolean };
const NO_MARKS: Marks = { bold: false, italic: false, underline: false, sup: false, sub: false, link: false };

function exec(command: string, value?: string) {
  document.execCommand(command, false, value);
}

/**
 * A word-processor style editing box: the text shows exactly as it will on the website, with Bold, Italic,
 * Underline, superscript, subscript, link and clear-formatting buttons above it. The HTML the website needs
 * is produced when editing ends — nobody types or sees a tag.
 */
export function RichTextBox({ value, onDone, multiline = false, className = "", placeholder, minHeight = 0 }: RichTextBoxProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const touched = useRef(false);
  const finished = useRef(false);
  const savedRange = useRef<Range | null>(null);
  const [marks, setMarks] = useState<Marks>(NO_MARKS);
  const [empty, setEmpty] = useState(!value);
  const [linking, setLinking] = useState(false);
  const [url, setUrl] = useState("");

  // Fill the box once, with the formatted text, and put the cursor at the end.
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    el.innerHTML = toSafeHtml(value);
    try {
      exec("styleWithCSS", "false"); // bold/italic as <b>/<i>, not as inline styles
    } catch {
      /* not supported: fromEditable also understands styles */
    }
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the starting text is read once
  }, []);

  const readMarks = useCallback(() => {
    const el = editorRef.current;
    const sel = window.getSelection();
    if (!el || !sel || sel.rangeCount === 0 || !el.contains(sel.anchorNode)) return;
    const node = sel.anchorNode;
    const element = node?.nodeType === 1 ? (node as Element) : node?.parentElement;
    setMarks({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      sup: document.queryCommandState("superscript"),
      sub: document.queryCommandState("subscript"),
      link: !!element?.closest("a")
    });
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", readMarks);
    return () => document.removeEventListener("selectionchange", readMarks);
  }, [readMarks]);

  function finish(commit: boolean) {
    if (finished.current) return;
    finished.current = true;
    const el = editorRef.current;
    if (!commit || !touched.current || !el) return onDone(null);
    const html = fromEditable(el);
    onDone(html === toSafeHtml(value) ? null : html);
  }

  function changed() {
    touched.current = true;
    setEmpty((editorRef.current?.textContent ?? "") === "" && !editorRef.current?.querySelector("br"));
    readMarks();
  }

  function command(name: string) {
    editorRef.current?.focus();
    exec(name);
    changed();
  }

  function lineBreak() {
    editorRef.current?.focus();
    exec("insertLineBreak");
    changed();
  }

  function clearFormatting() {
    editorRef.current?.focus();
    exec("removeFormat");
    exec("unlink");
    changed();
  }

  function openLink() {
    const sel = window.getSelection();
    savedRange.current = sel && sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null;
    setUrl("");
    setLinking(true);
  }

  function applyLink() {
    const clean = url.trim();
    setLinking(false);
    const el = editorRef.current;
    if (!clean || !el) return;
    const href = /^(https?:|mailto:|tel:|\/|#)/i.test(clean) ? clean : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean) ? `mailto:${clean}` : `https://${clean}`;
    el.focus();
    const sel = window.getSelection();
    if (savedRange.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
    if (sel && sel.isCollapsed) {
      const safe = href.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
      const label = href.replace(/^(https?:\/\/|mailto:|tel:)/i, "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
      exec("insertHTML", `<a href="${safe}">${label}</a>`);
    } else {
      exec("createLink", href);
    }
    changed();
  }

  // Keeps the text selected while a toolbar button is pressed.
  const keepSelection = (e: React.MouseEvent) => e.preventDefault();

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && !e.altKey) {
      const key = e.key.toLowerCase();
      const map: Record<string, string> = { b: "bold", i: "italic", u: "underline" };
      if (map[key]) {
        e.preventDefault();
        command(map[key]);
        return;
      }
      if (key === "k") {
        e.preventDefault();
        openLink();
        return;
      }
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (multiline || e.shiftKey) lineBreak();
      else finish(true);
    } else if (e.key === "Escape") {
      e.preventDefault();
      finish(false);
    }
  }

  function onPaste(e: React.ClipboardEvent<HTMLDivElement>) {
    // Paste as plain text: formatting copied from Word or a web page would otherwise bring its own fonts and colours.
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain").replace(/\r\n?/g, "\n");
    const lines = multiline ? text.split("\n") : [text.replace(/\n+/g, " ")];
    lines.forEach((line, i) => {
      if (i > 0) exec("insertLineBreak");
      if (line) exec("insertText", line);
    });
    changed();
  }

  const leaveIfOutside = (e: React.FocusEvent) => {
    if (wrapRef.current?.contains(e.relatedTarget as Node | null)) return;
    setLinking(false);
    finish(true);
  };

  return (
    <div className="edit-wrap" ref={wrapRef} onBlur={leaveIfOutside}>
      <div className="format-bar">
        <div className="format-tools" role="toolbar" aria-label="Text formatting">
          <button type="button" className={`fmt-btn${marks.bold ? " fmt-on" : ""}`} onMouseDown={keepSelection} onClick={() => command("bold")} title="Bold (Ctrl/⌘ + B)" aria-label="Bold" aria-pressed={marks.bold}>
            <b>B</b>
          </button>
          <button type="button" className={`fmt-btn${marks.italic ? " fmt-on" : ""}`} onMouseDown={keepSelection} onClick={() => command("italic")} title="Italic (Ctrl/⌘ + I)" aria-label="Italic" aria-pressed={marks.italic}>
            <i>I</i>
          </button>
          <button type="button" className={`fmt-btn${marks.underline ? " fmt-on" : ""}`} onMouseDown={keepSelection} onClick={() => command("underline")} title="Underline (Ctrl/⌘ + U)" aria-label="Underline" aria-pressed={marks.underline}>
            <u>U</u>
          </button>
          <span className="fmt-sep" aria-hidden="true" />
          <button type="button" className={`fmt-btn${marks.sup ? " fmt-on" : ""}`} onMouseDown={keepSelection} onClick={() => command("superscript")} title="Superscript" aria-label="Superscript" aria-pressed={marks.sup}>
            x<sup>2</sup>
          </button>
          <button type="button" className={`fmt-btn${marks.sub ? " fmt-on" : ""}`} onMouseDown={keepSelection} onClick={() => command("subscript")} title="Subscript" aria-label="Subscript" aria-pressed={marks.sub}>
            x<sub>2</sub>
          </button>
          <span className="fmt-sep" aria-hidden="true" />
          <button type="button" className="fmt-btn" onMouseDown={keepSelection} onClick={openLink} title="Add link (Ctrl/⌘ + K)" aria-label="Add link">
            <Icon name="link" size={16} />
          </button>
          <button type="button" className="fmt-btn" onMouseDown={keepSelection} onClick={() => command("unlink")} disabled={!marks.link} title="Remove link" aria-label="Remove link">
            <Icon name="unlink" size={16} />
          </button>
          <span className="fmt-sep" aria-hidden="true" />
          <button type="button" className="fmt-btn" onMouseDown={keepSelection} onClick={lineBreak} title="New line (Shift + Enter)" aria-label="New line">
            <Icon name="lineBreak" size={16} />
          </button>
          <button type="button" className="fmt-btn" onMouseDown={keepSelection} onClick={clearFormatting} title="Clear formatting" aria-label="Clear formatting">
            <Icon name="eraser" size={16} />
          </button>
        </div>
        {!linking && <span className="format-hint">{multiline ? "Click outside to apply · Esc to cancel" : "Enter to apply · Esc to cancel"}</span>}
      </div>
      {linking && (
        <div className="format-link">
          <input
            autoFocus
            type="text"
            inputMode="url"
            value={url}
            placeholder="Paste or type the web address"
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
                editorRef.current?.focus();
              }
            }}
          />
          <button type="button" className="btn btn-small btn-primary" onMouseDown={keepSelection} onClick={applyLink} disabled={!url.trim()}>
            Apply
          </button>
          <button
            type="button"
            className="btn btn-small"
            onMouseDown={keepSelection}
            onClick={() => {
              setLinking(false);
              editorRef.current?.focus();
            }}
          >
            Cancel
          </button>
        </div>
      )}
      <div
        ref={editorRef}
        className={`editable-input rich-editor ${empty ? "rich-empty" : ""} ${className}`}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline={multiline}
        data-placeholder={placeholder}
        style={{ minHeight: minHeight || undefined }}
        spellCheck
        onInput={changed}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onDrop={(e) => e.preventDefault()}
      />
    </div>
  );
}
