"use client";

import { useEffect, useState } from "react";

export interface OutlineItem {
  id: string;
  label: string;
}

/** The "On this page" list on the right: jump to any part of a long page, and see where you are. */
export function PageOutline({ items }: { items: OutlineItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const targets = items.map((i) => document.getElementById(i.id)).filter((el): el is HTMLElement => !!el);
    if (targets.length === 0) return;
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.boundingClientRect.top);
          else visible.delete(entry.target.id);
        }
        if (visible.size > 0) {
          const first = [...visible.entries()].sort((a, b) => a[1] - b[1])[0];
          if (first) setActive(first[0]);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [items]);

  if (items.length < 4) return null;

  return (
    <nav className="outline" aria-label="On this page">
      <p className="outline-title">On this page</p>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={active === item.id ? "outline-active" : undefined}
              aria-current={active === item.id ? "location" : undefined}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                setActive(item.id);
              }}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
