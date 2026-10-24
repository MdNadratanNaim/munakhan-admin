"use client";

import { Icon } from "@/components/ui/Icon";
import { useContentStore } from "@/store/content-store";

export function HistoryControls() {
  const undo = useContentStore((s) => s.undo);
  const redo = useContentStore((s) => s.redo);
  const canUndo = useContentStore((s) => s.canUndo());
  const canRedo = useContentStore((s) => s.canRedo());

  return (
    <div className="history-controls" role="group" aria-label="Undo and redo">
      <button type="button" className="icon-btn" disabled={!canUndo} onClick={undo} title="Undo the last change" aria-label="Undo the last change">
        <Icon name="undo" />
      </button>
      <button type="button" className="icon-btn" disabled={!canRedo} onClick={redo} title="Redo" aria-label="Redo">
        <Icon name="redo" />
      </button>
    </div>
  );
}
