"use client";

import type { FieldDef, PageSchema } from "@/lib/page-schemas";
import { fieldReactKey } from "@/lib/page-schemas";
import { FieldRenderer } from "@/components/editable/FieldRenderer";
import { PageOutline } from "./PageOutline";

function isChrome(f: FieldDef): boolean {
  return f.key === "title" || f.key === "heading";
}

/** "Project page sections (the groups …)" → "Project page sections": a short name for the outline. */
function shortLabel(label: string): string {
  return label.split(/\s[(—]/)[0] ?? label;
}

/**
 * Renders one page purely from its PageSchema — this is what makes
 * "reusable editing components instead of custom editors for every field"
 * true in practice: adding a field to a page means editing page-schemas.ts,
 * not writing a new component.
 */
export function PageEditor({ schema }: { schema: PageSchema }) {
  // The heading is what visitors see, so it comes first; the browser-tab title sits quietly beneath it.
  const chrome = schema.fields.filter(isChrome).sort((a, b) => (a.key === "heading" ? -1 : b.key === "heading" ? 1 : 0));
  const rest = schema.fields.filter((f) => !isChrome(f));
  const outline = rest.map((f) => ({ id: `field-${fieldReactKey(f)}`, label: shortLabel(f.label) }));

  return (
    <div className="editor-body">
      <article className="site-page" data-page={schema.slug}>
        {chrome.length > 0 && (
          <header className="page-heading page-banner">
            {chrome.map((f) => (
              <FieldRenderer key={fieldReactKey(f)} pageKey={schema.key} field={f} basePath={[]} />
            ))}
          </header>
        )}
        <div className="page-content">
          {rest.map((f, i) => (
            <div className="outline-target" id={outline[i]?.id} key={fieldReactKey(f)}>
              <FieldRenderer pageKey={schema.key} field={f} basePath={[]} />
            </div>
          ))}
        </div>
      </article>
      <PageOutline items={outline} />
    </div>
  );
}
