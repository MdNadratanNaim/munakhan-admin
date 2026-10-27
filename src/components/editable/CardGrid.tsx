"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { generateId } from "@/lib/auto-id";
import { selectOptions, type FieldDef } from "@/lib/page-schemas";
import { PAGE_KEY_TO_SLUG, type PageKey } from "@/lib/types";
import { type FieldPath, useContentStore } from "@/store/content-store";

type ListField = Extract<FieldDef, { kind: "list" }>;

interface CardGridProps {
  pageKey: PageKey;
  path: FieldPath;
  items: unknown[];
  field: ListField;
}

/** Card text is site text and may contain HTML (<br>, <b>…); the card shows it as plain text. */
function plain(value: unknown): string {
  return String(value ?? "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The list page for Projects and Poster presentations: one card per item, with add / remove / reorder
 * here and an "Edit" button that opens the item's own on-demand edit page (/<page>/<id>),
 * so a long list stays a tidy overview instead of one endless inline form.
 */
export function CardGrid({ pageKey, path, items, field }: CardGridProps) {
  const cards = field.cards;
  const addListItem = useContentStore((s) => s.addListItem);
  const removeListItemAt = useContentStore((s) => s.removeListItemAt);
  const moveListItem = useContentStore((s) => s.moveListItem);
  const imagePreviewUrl = useContentStore((s) => s.imagePreviewUrl);
  const pageData = useContentStore((s) => s.draft[pageKey]);
  const [filter, setFilter] = useState("");
  const optionLabel = (key: string | undefined, value: unknown) => {
    if (!key || !value) return "";
    const def = field.itemFields.find((f) => f.key === key);
    return def && def.kind === "select" ? (selectOptions(def, pageData).find((o) => o.value === value)?.label ?? "") : "";
  };
  if (!cards) return null;
  const noun = field.itemLabel.toLowerCase();
  const rowsLayout = cards.layout === "rows";
  const needle = filter.trim().toLowerCase();
  const filtering = needle.length > 0;

  function add() {
    const taken = items.map((x) => (x as { id?: string })?.id ?? "");
    // The title starts empty (the card shows "Untitled …" as a placeholder) so typing a title never has to delete a default.
    addListItem(pageKey, path, { id: generateId(field.itemLabel, taken) });
  }

  function remove(index: number, title: string) {
    if (window.confirm(`Delete the ${noun} "${title}"? It is removed from the website when you save.`)) {
      removeListItemAt(pageKey, path, index);
    }
  }

  const rows = items.map((raw, index) => {
    const item = raw as Record<string, unknown>;
    const id = String(item.id ?? "");
    const title = plain(item[cards.titleKey]) || cards.newItemTitle;
    const meta = plain(cards.metaKey ? item[cards.metaKey] : "");
    const summary = plain(cards.summaryKey ? item[cards.summaryKey] : "");
    const badge = optionLabel(cards.badgeKey, cards.badgeKey ? item[cards.badgeKey] : "");
    const image = cards.imageKey ? imagePreviewUrl(item[cards.imageKey] as string | undefined) : undefined;
    const flag = cards.flagKey && item[cards.flagKey] ? (cards.flagLabel ?? "") : "";
    return { index, id, title, meta, summary, badge, image, flag };
  });
  const shown = filtering ? rows.filter((r) => `${r.title} ${r.meta} ${r.summary} ${r.badge}`.toLowerCase().includes(needle)) : rows;

  return (
    <div className="card-section">
      <div className="card-section-bar">
        <span className="card-count">
          {items.length} {items.length === 1 ? noun : `${noun}s`}
        </span>
        {items.length > 6 && (
          <label className="search-box">
            <Icon name="search" size={16} />
            <input type="search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={`Find a ${noun}…`} aria-label={`Find a ${noun}`} />
          </label>
        )}
        <button type="button" className="btn btn-primary" onClick={add}>
          <Icon name="plus" size={16} />
          <span>Add {noun}</span>
        </button>
      </div>

      <div className={rowsLayout ? "card-grid card-grid-rows" : "card-grid"}>
        {shown.map(({ index, id, title, meta, summary, badge, image, flag }) => {
          const href = `/${PAGE_KEY_TO_SLUG[pageKey]}/${encodeURIComponent(id)}`;
          return (
            <article className="card-grid-item" key={id || index}>
              {!rowsLayout && (
                <Link className="card-grid-thumb" href={href} aria-label={`Edit ${title}`} tabIndex={-1}>
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- static/staged files, no Next Image optimizer on Cloudflare
                    <img src={image} alt="" />
                  ) : (
                    <div className="card-grid-noimg">
                      <Icon name="image" size={26} />
                      <span>No photo yet</span>
                    </div>
                  )}
                </Link>
              )}
              <div className="card-grid-body">
                {badge && <span className="pill">{badge}</span>}
                {flag && <span className="pill">{flag}</span>}
                <h3>{title}</h3>
                {meta && <small>{meta}</small>}
                {summary && <p>{summary}</p>}
              </div>
              <div className="card-grid-actions">
                <Link className="btn btn-primary btn-small card-grid-edit" href={href}>
                  <Icon name="pencil" size={15} />
                  <span>Edit</span>
                </Link>
                <div className="card-grid-tools">
                  {!filtering && (
                    <>
                      <button type="button" className="icon-btn icon-btn-sm" disabled={index === 0} onClick={() => moveListItem(pageKey, path, index, index - 1)} aria-label={`Move ${title} earlier`} title="Move earlier">
                        <Icon name="arrowLeft" size={16} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn icon-btn-sm"
                        disabled={index === items.length - 1}
                        onClick={() => moveListItem(pageKey, path, index, index + 1)}
                        aria-label={`Move ${title} later`}
                        title="Move later"
                      >
                        <Icon name="arrowRight" size={16} />
                      </button>
                    </>
                  )}
                  <button type="button" className="icon-btn icon-btn-sm icon-btn-danger" onClick={() => remove(index, title)} aria-label={`Delete ${title}`} title={`Delete this ${noun}`}>
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
        {shown.length === 0 && (
          <div className="empty-state empty-state-inline">
            <Icon name="search" size={26} />
            <h3>{filtering ? `No matches for “${filter}”` : `No ${noun}s yet`}</h3>
          </div>
        )}
      </div>
    </div>
  );
}
