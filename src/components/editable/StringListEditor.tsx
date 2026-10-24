"use client";

import { Icon } from "@/components/ui/Icon";
import { EditableTextarea } from "./EditableTextarea";

interface StringListEditorProps {
  values: string[];
  itemLabel: string;
  onAdd: () => void;
  onChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  onMove: (from: number, to: number) => void;
}

export function StringListEditor({ values, itemLabel, onAdd, onChange, onRemove, onMove }: StringListEditorProps) {
  return (
    <div className="string-list-editor">
      {values.map((v, index) => (
        <div className="string-list-item" key={index}>
          <EditableTextarea value={v} onCommit={(next) => onChange(index, next)} placeholder={itemLabel} />
          <div className="row-tools">
            <button type="button" className="icon-btn icon-btn-sm" disabled={index === 0} onClick={() => onMove(index, index - 1)} aria-label="Move up" title="Move up">
              <Icon name="arrowUp" size={16} />
            </button>
            <button type="button" className="icon-btn icon-btn-sm" disabled={index === values.length - 1} onClick={() => onMove(index, index + 1)} aria-label="Move down" title="Move down">
              <Icon name="arrowDown" size={16} />
            </button>
            <button type="button" className="icon-btn icon-btn-sm icon-btn-danger" onClick={() => onRemove(index)} aria-label={`Delete ${itemLabel.toLowerCase()}`} title="Delete">
              <Icon name="trash" size={16} />
            </button>
          </div>
        </div>
      ))}
      <button type="button" className="add-btn" onClick={onAdd}>
        <Icon name="plus" size={16} />
        <span>Add {itemLabel.toLowerCase()}</span>
      </button>
    </div>
  );
}
