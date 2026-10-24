"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { PAGE_KEY_TO_SLUG, type PageKey } from "@/lib/types";
import { useContentStore } from "@/store/content-store";
import { HistoryControls } from "./HistoryControls";
import { SaveStatus } from "./SaveStatus";

function hrefForPageKey(key: PageKey): string {
  const slug = PAGE_KEY_TO_SLUG[key];
  return slug === "home" ? "/" : `/${slug}`;
}

/**
 * The sticky toolbar above every editing screen (the file keeps its old name so the page shells that mount it
 * did not need to change): where you are, whether anything is unsaved, undo/redo, the Edit | Preview switch
 * and the one Save button. Everything you need to finish a job is here and never scrolls out of sight.
 */
export function Sidebar({ pageKey, title }: { pageKey: PageKey; title?: string }) {
  const router = useRouter();
  const previewMode = useContentStore((s) => s.previewMode);
  const previewPageKey = useContentStore((s) => s.previewPageKey);
  const enterPreview = useContentStore((s) => s.enterPreview);
  const exitPreview = useContentStore((s) => s.exitPreview);
  const dirty = useContentStore((s) => s.isDirty());
  const status = useContentStore((s) => s.saveStatus);
  const save = useContentStore((s) => s.save);
  const resetAll = useContentStore((s) => s.resetAll);
  const saving = status === "saving";

  function showEditing() {
    if (!previewMode) return;
    // Return to whichever page preview actually ended up showing (you may have browsed elsewhere
    // using the simulated site's own menu), not wherever this admin route was when preview began.
    const targetKey = previewPageKey ?? pageKey;
    exitPreview();
    if (targetKey !== pageKey) router.push(hrefForPageKey(targetKey));
  }

  function showPreview() {
    if (!previewMode) enterPreview(pageKey);
  }

  return (
    <div className={`toolbar${dirty ? " toolbar-dirty" : ""}`}>
      <div className="toolbar-left">
        {title && <h1 className="toolbar-title">{title}</h1>}
        <SaveStatus />
      </div>

      <div className="toolbar-right">
        <div className="seg" role="group" aria-label="Editing or preview">
          <button type="button" className={`seg-btn${!previewMode ? " seg-btn-on" : ""}`} aria-pressed={!previewMode} onClick={showEditing}>
            <Icon name="pencil" size={16} />
            <span>Edit</span>
          </button>
          <button type="button" className={`seg-btn${previewMode ? " seg-btn-on" : ""}`} aria-pressed={previewMode} onClick={showPreview} title="Preview with your unsaved changes">
            <Icon name="eye" size={16} />
            <span>Preview</span>
          </button>
        </div>

        <HistoryControls />

        {dirty && !saving && (
          <button
            type="button"
            className="btn btn-quiet toolbar-discard"
            onClick={() => {
              if (window.confirm("Discard all unsaved changes?")) resetAll();
            }}
          >
            <Icon name="rotateCcw" size={16} />
            <span>Discard</span>
          </button>
        )}

        <button type="button" className="btn btn-primary toolbar-save" disabled={saving || !dirty} onClick={() => void save()} title="Save (Ctrl/⌘ + S)">
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
