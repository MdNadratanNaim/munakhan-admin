"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useContentStore } from "@/store/content-store";

/**
 * Messages about saving, shown at the bottom of every screen:
 *  - while saving → a calm "Saving…" note;
 *  - after a save → a confirmation that fades away on its own;
 *  - a failed save (including "storage limit reached") → a message that stays until dismissed or fixed.
 * The Save button itself lives in the toolbar at the top (Ctrl/⌘ + S also works anywhere).
 */
export function SaveBar() {
  const pathname = usePathname();
  const status = useContentStore((s) => s.saveStatus);
  const error = useContentStore((s) => s.saveError);
  const limitHit = useContentStore((s) => s.storageLimitHit);
  const save = useContentStore((s) => s.save);
  const [justSaved, setJustSaved] = useState(false);
  const [dismissedError, setDismissedError] = useState<string | null>(null);
  const [wasSaving, setWasSaving] = useState(false);

  useEffect(() => {
    if (status === "saving") setWasSaving(true);
    if (status === "saved" && wasSaving) {
      setWasSaving(false);
      setJustSaved(true);
      const t = setTimeout(() => setJustSaved(false), 7000);
      return () => clearTimeout(t);
    }
    if (status === "error") setWasSaving(false);
  }, [status, wasSaving]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        const s = useContentStore.getState();
        if (s.isDirty() && s.saveStatus !== "saving") void s.save();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (pathname === "/login") return null;

  const showError = status === "error" && error && error !== dismissedError;

  if (showError) {
    return (
      <div className="toast toast-error" role="alert">
        <Icon name="alert" size={20} className="toast-icon" />
        <div className="toast-text">
          <strong>{limitHit ? "Storage limit reached — not saved" : "Not saved"}</strong>
          <span>{error}</span>
        </div>
        <div className="toast-actions">
          <button type="button" className="btn btn-on-dark" onClick={() => setDismissedError(error)}>
            Dismiss
          </button>
          <button type="button" className="btn btn-light" onClick={() => void save()}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (status === "saving") {
    return (
      <div className="toast" role="status">
        <span className="spinner" aria-hidden="true" />
        <div className="toast-text">
          <strong>Saving…</strong>
        </div>
      </div>
    );
  }

  if (justSaved) {
    return (
      <div className="toast toast-ok" role="status">
        <Icon name="check" size={20} className="toast-icon" />
        <div className="toast-text">
          <strong>Saved</strong>
        </div>
        <div className="toast-actions">
          <button type="button" className="btn btn-on-dark" onClick={() => setJustSaved(false)}>
            Close
          </button>
        </div>
      </div>
    );
  }
  return null;
}
