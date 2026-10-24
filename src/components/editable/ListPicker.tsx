"use client";

import { Icon } from "@/components/ui/Icon";
import { getAtPath } from "@/lib/object-path";
import type { PickSource } from "@/lib/page-schemas";
import type { PageKey } from "@/lib/types";
import { type FieldPath, useContentStore } from "@/store/content-store";

interface ListPickerProps {
  pageKey: PageKey;
  path: FieldPath;
  itemLabel: string;
  source: PickSource;
  onClose: () => void;
}

export function ListPicker({ pageKey, path, itemLabel, source, onClose }: ListPickerProps) {
  const currentItems = useContentStore(
    (s) => (getAtPath(s.draft[pageKey], path) as Array<{ id?: string }> | undefined) ?? []
  );
  const masterItems = useContentStore(
    (s) =>
      (getAtPath(s.draft[source.masterPageKey], source.masterPath) as Array<Record<string, unknown>> | undefined) ?? []
  );
  const addListItem = useContentStore((s) => s.addListItem);
  const removeListItemById = useContentStore((s) => s.removeListItemById);

  const pickedIds = new Set(currentItems.map((i) => i.id));

  function toggle(item: Record<string, unknown>) {
    const id = String(item.id ?? "");
    if (!id) return;
    if (pickedIds.has(id)) {
      removeListItemById(pageKey, path, id);
    } else {
      addListItem(pageKey, path, source.toItem(item));
    }
  }

  return (
    <div className="list-picker-overlay" role="dialog" aria-modal="true" aria-labelledby="picker-title" onClick={onClose}>
      <div className="list-picker" onClick={(e) => e.stopPropagation()}>
        <header>
          <h3 id="picker-title">Choose {itemLabel.toLowerCase()} to show here</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </header>
        <p className="list-picker-hint">
          Ticking copies the entry here. Changing the original later does not update the copy.
        </p>
        {masterItems.length === 0 ? (
          <p className="list-picker-empty">Nothing to choose from yet.</p>
        ) : (
          <ul className="list-picker-list">
            {masterItems.map((item, idx) => {
              const id = String(item.id ?? idx);
              const subtitle = source.itemSubtitle?.(item);
              return (
                <li key={id}>
                  <label>
                    <input type="checkbox" checked={pickedIds.has(id)} onChange={() => toggle(item)} />
                    <span className="list-picker-name">
                      {source.itemTitle(item)}
                      {subtitle ? <span className="list-picker-id">{subtitle}</span> : null}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
        <footer>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}
