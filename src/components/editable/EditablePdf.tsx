"use client";

import { useRef } from "react";
import { Icon } from "@/components/ui/Icon";
import { PdfPreview } from "./PdfPreview";

interface EditablePdfProps {
  /** Directly usable URL of the current PDF (a saved path resolved against imageBase, or a staged blob: URL). */
  src?: string;
  onFile: (file: File) => void;
  /** When given, a "Remove PDF" button is shown while a PDF is present. */
  onRemove?: () => void;
  /** A small control (file name, open, replace, remove) instead of the full document viewer. */
  compact?: boolean;
}

/** A short, readable name for a PDF address: its file name, or the site it is hosted on. */
function pdfLabel(src: string): string {
  if (src.startsWith("blob:")) return "New PDF (saved when you save changes)";
  try {
    const url = new URL(src);
    const file = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() ?? "");
    return /\.pdf$/i.test(file) ? file : `${url.hostname}${file ? ` · ${file}` : ""}`;
  } catch {
    return src;
  }
}

const MAX_BYTES = 50 * 1024 * 1024;

export function EditablePdf({ src, onFile, onRemove, compact }: EditablePdfProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handle(file: File | undefined) {
    if (!file) return;
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      window.alert("Please choose a PDF file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      window.alert("That PDF is larger than 50 MB. Please compress it first (the site loads it for every visitor).");
      return;
    }
    onFile(file);
  }

  if (compact) {
    return (
      <div className="pdf-chip">
        <Icon name="file" size={18} />
        {src ? (
          <>
            <span className="pdf-chip-name" title={src.startsWith("blob:") ? undefined : src}>
              {pdfLabel(src)}
            </span>
            <a className="btn btn-small" href={src} target="_blank" rel="noreferrer">
              Open
            </a>
          </>
        ) : (
          <span className="pdf-chip-name pdf-chip-empty">No PDF attached</span>
        )}
        <button type="button" className="btn btn-small" onClick={() => inputRef.current?.click()}>
          {src ? "Replace" : "Upload PDF"}
        </button>
        {src && onRemove && (
          <button type="button" className="btn btn-small" onClick={onRemove}>
            Remove
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          style={{ display: "none" }}
          onChange={(e) => {
            handle(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
    );
  }

  return (
    <div className="editable-pdf">
      {src ? <PdfPreview url={src} /> : <div className="editable-pdf-placeholder">No PDF uploaded</div>}
      <div className="editable-pdf-actions">
        <button type="button" className="btn btn-small" onClick={() => inputRef.current?.click()}>
          {src ? "Replace PDF" : "Upload a PDF"}
        </button>
        {src && onRemove && (
          <button type="button" className="btn btn-small" onClick={onRemove}>
            Remove PDF
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          style={{ display: "none" }}
          onChange={(e) => {
            handle(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
