"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { FieldDef, PickSource } from "@/lib/page-schemas";
import { fieldReactKey } from "@/lib/page-schemas";
import type { PageKey } from "@/lib/types";
import type { FieldPath } from "@/store/content-store";
import { useContentStore } from "@/store/content-store";
import { generateId } from "@/lib/auto-id";
import { FieldRenderer } from "./FieldRenderer";
import { ListPicker } from "./ListPicker";

interface ListEditorProps {
  pageKey: PageKey;
  path: FieldPath;
  items: unknown[];
  itemFields: FieldDef[];
  itemLabel: string;
  addFrom?: PickSource;
  /** Items get an automatically generated unique id (used by ?view= detail links). */
  autoId?: boolean;
  /** Field whose text titles each item's header. */
  headerKey?: string;
}

function plain(value: unknown): string {
  return String(value ?? "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function ListEditor({ pageKey, path, items, itemFields, itemLabel, addFrom, autoId, headerKey }: ListEditorProps) {
  const addListItem = useContentStore((s) => s.addListItem);
  const removeListItemAt = useContentStore((s) => s.removeListItemAt);
  const moveListItem = useContentStore((s) => s.moveListItem);
  const [pickerOpen, setPickerOpen] = useState(false);
  const newItem = () => (autoId ? { id: generateId(itemLabel, items.map((x) => (x as { id?: string })?.id ?? "")) } : {});
  const noun = itemLabel.toLowerCase();

  return (
    <div className="list-editor">
      {items.map((item, index) => (
        // Index as key is fine here: identity comes from position in an
        // ordered, reorderable list with no stable external id to rely on.
        // eslint-disable-next-line react/no-array-index-key
        <div className="list-item-card" key={index}>
          <div className="list-item-header">
            <span className="list-item-title">
              <b>{index + 1}</b>
              {(headerKey && plain((item as Record<string, unknown> | null)?.[headerKey])) || itemLabel}
            </span>
            <div className="row-tools">
              <button type="button" className="icon-btn icon-btn-sm" disabled={index === 0} onClick={() => moveListItem(pageKey, path, index, index - 1)} aria-label={`Move ${noun} ${index + 1} up`} title="Move up">
                <Icon name="arrowUp" size={16} />
              </button>
              <button
                type="button"
                className="icon-btn icon-btn-sm"
                disabled={index === items.length - 1}
                onClick={() => moveListItem(pageKey, path, index, index + 1)}
                aria-label={`Move ${noun} ${index + 1} down`}
                title="Move down"
              >
                <Icon name="arrowDown" size={16} />
              </button>
              <button type="button" className="icon-btn icon-btn-sm icon-btn-danger" onClick={() => removeListItemAt(pageKey, path, index)} aria-label={`Delete ${noun} ${index + 1}`} title="Delete">
                <Icon name="trash" size={16} />
              </button>
            </div>
          </div>
          {itemFields.map((f) => (
            <FieldRenderer key={fieldReactKey(f)} pageKey={pageKey} field={f} basePath={[...path, index]} />
          ))}
        </div>
      ))}
      {addFrom ? (
        <button type="button" className="add-btn" onClick={() => setPickerOpen(true)}>
          <Icon name="plus" size={16} />
          <span>Choose {noun} to add</span>
        </button>
      ) : (
        <button type="button" className="add-btn" onClick={() => addListItem(pageKey, path, newItem())}>
          <Icon name="plus" size={16} />
          <span>Add {noun}</span>
        </button>
      )}
      {pickerOpen && addFrom && (
        <ListPicker pageKey={pageKey} path={path} itemLabel={itemLabel} source={addFrom} onClose={() => setPickerOpen(false)} />
      )}
    </div>
  );
}
