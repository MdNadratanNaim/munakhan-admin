"use client";

import { Icon, type IconName } from "@/components/ui/Icon";
import type { ContentBlock } from "@/lib/types";
import type { PageKey } from "@/lib/types";
import { type FieldPath, useContentStore } from "@/store/content-store";
import { EditableImage } from "./EditableImage";
import { EditablePdf } from "./EditablePdf";
import { EditableText } from "./EditableText";
import { EditableTextarea } from "./EditableTextarea";

interface BlockListEditorProps {
  pageKey: PageKey;
  path: FieldPath;
  blocks: ContentBlock[];
  /** Offer "Add PDF" next to "Add paragraph" / "Add photo" (Poster presentations). */
  allowPdf?: boolean;
}

/**
 * One ordered sequence mixing paragraph and image blocks — like an article,
 * not two separate zones. "+ Add paragraph" and "+ Add image" both append to
 * the end of the same array, in whichever order you click them.
 */
const BLOCK_LABEL = { paragraph: "Paragraph", image: "Photo", pdf: "PDF" } as const;
const BLOCK_ICON: Record<keyof typeof BLOCK_LABEL, IconName> = { paragraph: "type", image: "image", pdf: "file" };

export function BlockListEditor({ pageKey, path, blocks, allowPdf }: BlockListEditorProps) {
  const setField = useContentStore((s) => s.setField);
  const addListItem = useContentStore((s) => s.addListItem);
  const removeListItemAt = useContentStore((s) => s.removeListItemAt);
  const moveListItem = useContentStore((s) => s.moveListItem);
  const stageFile = useContentStore((s) => s.stageFile);
  const imagePreviewUrl = useContentStore((s) => s.imagePreviewUrl);

  return (
    <div className="block-list-editor">
      {blocks.map((block, index) => (
        // Index as key: identity comes from position in an ordered, reorderable sequence.
        // eslint-disable-next-line react/no-array-index-key
        <div className="block-item" key={index}>
          <div className="block-item-controls">
            <span className="block-item-type">
              <Icon name={BLOCK_ICON[block.type]} size={15} />
              {BLOCK_LABEL[block.type]}
            </span>
            <div className="row-tools">
              <button type="button" className="icon-btn icon-btn-sm" disabled={index === 0} onClick={() => moveListItem(pageKey, path, index, index - 1)} aria-label="Move up" title="Move up">
                <Icon name="arrowUp" size={16} />
              </button>
              <button
                type="button"
                className="icon-btn icon-btn-sm"
                disabled={index === blocks.length - 1}
                onClick={() => moveListItem(pageKey, path, index, index + 1)}
                aria-label="Move down"
                title="Move down"
              >
                <Icon name="arrowDown" size={16} />
              </button>
              <button type="button" className="icon-btn icon-btn-sm icon-btn-danger" onClick={() => removeListItemAt(pageKey, path, index)} aria-label={`Delete this ${BLOCK_LABEL[block.type].toLowerCase()}`} title="Delete">
                <Icon name="trash" size={16} />
              </button>
            </div>
          </div>
          {block.type === "paragraph" ? (
            <EditableTextarea value={block.text} onCommit={(v) => setField(pageKey, [...path, index, "text"], v)} placeholder="Paragraph text" />
          ) : block.type === "pdf" ? (
            <div className="block-pdf">
              <EditablePdf src={imagePreviewUrl(block.pdf)} onFile={(file) => stageFile(pageKey, [...path, index, "pdf"], file)} />
              <EditableText
                value={block.caption ?? ""}
                onCommit={(v) => setField(pageKey, [...path, index, "caption"], v)}
                placeholder="Caption (shown under the PDF)"
                className="block-pdf-caption"
              />
            </div>
          ) : (
            <div className="block-image">
              <EditableImage src={imagePreviewUrl(block.image)} onFile={(file) => stageFile(pageKey, [...path, index, "image"], file)} />
              <EditableText
                value={block.alt ?? ""}
                onCommit={(v) => setField(pageKey, [...path, index, "alt"], v)}
                placeholder="Caption"
                className="block-image-alt"
              />
            </div>
          )}
        </div>
      ))}
      <div className="block-add-row">
        <button type="button" className="add-btn" onClick={() => addListItem(pageKey, path, { type: "paragraph", text: "" })}>
          <Icon name="plus" size={16} />
          <span>Add paragraph</span>
        </button>
        <button type="button" className="add-btn" onClick={() => addListItem(pageKey, path, { type: "image", image: "", alt: "" })}>
          <Icon name="plus" size={16} />
          <span>Add photo</span>
        </button>
        {allowPdf && (
          <button type="button" className="add-btn" onClick={() => addListItem(pageKey, path, { type: "pdf", pdf: "", caption: "" })}>
            <Icon name="plus" size={16} />
            <span>Add PDF</span>
          </button>
        )}
      </div>
    </div>
  );
}
