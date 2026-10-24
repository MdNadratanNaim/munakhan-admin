"use client";

import Link from "next/link";
import { FieldRenderer } from "@/components/editable/FieldRenderer";
import { Icon } from "@/components/ui/Icon";
import { cardListField, fieldReactKey, type PageSchema } from "@/lib/page-schemas";
import { PAGE_KEY_TO_SLUG } from "@/lib/types";
import { getAtPath } from "@/lib/object-path";
import { useContentStore } from "@/store/content-store";

function plain(value: unknown): string {
  return String(value ?? "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The on-demand edit page of one card (a project, a poster…): every field of the item, edited the same
 * way it used to be inline on the list. The list page itself only shows cards.
 */
export function ItemEditor({ schema, id }: { schema: PageSchema; id: string }) {
  const list = cardListField(schema);
  const page = useContentStore((s) => s.draft[schema.key]);
  if (!list || !page) return null;

  const items = (getAtPath(page, [list.key]) as Array<Record<string, unknown>> | undefined) ?? [];
  const index = items.findIndex((item) => item.id === id);
  const backHref = `/${PAGE_KEY_TO_SLUG[schema.key]}`;
  const noun = list.itemLabel.toLowerCase();
  const pageTitle = plain(getAtPath(page, ["heading"])) || schema.title;

  if (index === -1) {
    return (
      <article className="site-page item-page" data-page={schema.slug}>
        <div className="empty-state">
          <Icon name="search" size={28} />
          <h2>This {noun} was not found</h2>
          <Link href={backHref} className="btn btn-primary">
            <Icon name="arrowLeft" size={16} />
            <span>Back to {pageTitle}</span>
          </Link>
        </div>
      </article>
    );
  }

  const itemTitle = plain(items[index]?.[list.cards?.titleKey ?? "title"]) || list.cards?.newItemTitle || `Untitled ${noun}`;

  return (
    <article className="site-page item-page" data-page={schema.slug}>
      <header className="item-page-header">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href={backHref} className="breadcrumb-link">
            <Icon name="arrowLeft" size={16} />
            <span>{pageTitle}</span>
          </Link>
          <Icon name="chevronRight" size={14} className="breadcrumb-sep" />
          <span className="breadcrumb-current" aria-current="page">
            {itemTitle}
          </span>
        </nav>
      </header>
      <div className="page-content item-page-content">
        {list.itemFields.map((f) => (
          <FieldRenderer key={fieldReactKey(f)} pageKey={schema.key} field={f} basePath={[list.key, index]} />
        ))}
      </div>
    </article>
  );
}
