"use client";

import { Icon } from "@/components/ui/Icon";
import { useContentStore } from "@/store/content-store";

/** The small "where do my changes stand?" label in the toolbar. */
export function SaveStatus() {
  const status = useContentStore((s) => s.saveStatus);
  const dirty = useContentStore((s) => s.isDirty());

  if (status === "saving") {
    return (
      <span className="status status-saving" role="status">
        <span className="status-dot" aria-hidden="true" /> Saving…
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="status status-error" role="status">
        <Icon name="alert" size={15} /> Couldn&apos;t save
      </span>
    );
  }
  if (dirty) {
    return (
      <span className="status status-dirty" role="status">
        <span className="status-dot" aria-hidden="true" /> Unsaved changes
      </span>
    );
  }
  return (
    <span className="status status-clean" role="status">
      <Icon name="check" size={15} /> All changes saved
    </span>
  );
}
