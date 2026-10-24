"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { SimulatedSitePage } from "@/components/preview/SimulatedSitePage";
import { Icon } from "@/components/ui/Icon";
import { GROUP_LABELS, type SiteTextItem } from "@/lib/site-text";
import { homeSchema } from "@/lib/page-schemas";
import { useContentStore } from "@/store/content-store";

/** "nav.projects" → "Nav projects": a readable name for a wording key. */
function readable(key: string): string {
  const text = key.replace(/[._-]+/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** The live site lists its wording HTML-escaped ("Education &amp; Experience"); show it as people read it. */
function decodeEntities(text: string): string {
  if (typeof document === "undefined") return text;
  const el = document.createElement("textarea");
  el.innerHTML = text;
  return el.value;
}

/**
 * Every fixed piece of wording on the website — menu labels, section headings, button captions, footer links …
 * The list is read from the live site, so it is always what the site really contains. Leave a box empty to keep the
 * site's own wording; type to replace it. Like every other text, HTML tags such as <br> and <b> are allowed.
 */
export function SiteTextEditor() {
  const previewMode = useContentStore((s) => s.previewMode);
  const overrides = useContentStore((s) => s.siteTextDraft);
  const setSiteText = useContentStore((s) => s.setSiteText);
  const [items, setItems] = useState<SiteTextItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [changedOnly, setChangedOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/live/manifest")
      .then(async (res) => {
        const json = (await res.json()) as { items?: SiteTextItem[]; error?: string };
        if (!res.ok) throw new Error(json.error || `Failed (${res.status})`);
        if (!cancelled) setItems(json.items ?? []);
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : String(err)));
    return () => {
      cancelled = true;
    };
  }, []);

  const changedCount = useMemo(() => (items ?? []).filter((i) => (overrides[i.key] ?? "") !== "").length, [items, overrides]);

  const groups = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    const map = new Map<string, SiteTextItem[]>();
    for (const item of items ?? []) {
      const value = overrides[item.key] ?? "";
      if (changedOnly && value === "") continue;
      if (needle && !(item.defaultText + " " + value + " " + item.key).toLowerCase().includes(needle)) continue;
      map.set(item.group, [...(map.get(item.group) ?? []), item]);
    }
    return [...map.entries()];
  }, [items, filter, overrides, changedOnly]);

  return (
    <div className="page-layout">
      <Sidebar pageKey="home" title="Site text" />
      {previewMode ? (
        <SimulatedSitePage schema={homeSchema} />
      ) : (
        <article className="site-page">
          <header className="plain-header">
            <p>Menu names, headings and button captions. Leave a box empty to keep the default.</p>
          </header>
          <div className="page-content">
            <div className="filter-row">
              <label className="search-box search-box-wide">
                <Icon name="search" size={16} />
                <input type="search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search" aria-label="Search the site text" />
              </label>
              <label className="check">
                <input type="checkbox" checked={changedOnly} onChange={(e) => setChangedOnly(e.target.checked)} />
                <span>Changed only{changedCount > 0 ? ` (${changedCount})` : ""}</span>
              </label>
            </div>
            {error && (
              <div className="notice notice-error" role="alert">
                <Icon name="alert" size={18} />
                <span>Couldn&apos;t load the site text: {error}</span>
              </div>
            )}
            {!items && !error && <p className="list-empty">Loading…</p>}
            {items && items.length === 0 && <p className="list-empty">No editable wording was found on the live website yet.</p>}
            {items && items.length > 0 && groups.length === 0 && (
              <div className="empty-state empty-state-inline">
                <Icon name="search" size={26} />
                <h3>No matches</h3>
              </div>
            )}
            {groups.map(([group, list]) => (
              <fieldset className="field-group" key={group}>
                <legend>{GROUP_LABELS[group] ?? group}</legend>
                {list.map((item) => {
                  const value = overrides[item.key] ?? "";
                  const inputId = `site-text-${item.key}`;
                  return (
                    <div className="site-text-row" key={item.key}>
                      <div className="site-text-head">
                        <label htmlFor={inputId} className="site-text-label">
                          {readable(item.key)}
                        </label>
                        {value !== "" && (
                          <button type="button" className="btn btn-quiet btn-small" onClick={() => setSiteText(item.key, "")}>
                            <Icon name="rotateCcw" size={14} />
                            <span>Reset</span>
                          </button>
                        )}
                      </div>
                      <textarea
                        id={inputId}
                        className={`editable-input site-text-input${value !== "" ? " site-text-changed" : ""}`}
                        rows={1}
                        value={value}
                        placeholder={decodeEntities(item.defaultText)}
                        onChange={(e) => setSiteText(item.key, e.target.value)}
                      />
                    </div>
                  );
                })}
              </fieldset>
            ))}
          </div>
        </article>
      )}
    </div>
  );
}
