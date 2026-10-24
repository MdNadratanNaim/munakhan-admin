"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";
import { formatMB } from "@/lib/storage-limit";
import { useContentStore } from "@/store/content-store";
import { GuardedLink } from "./GuardedLink";

const WEBSITE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL || "https://munakhan.pages.dev";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

const PAGES: NavItem[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/my-story", label: "My Story", icon: "user" },
  { href: "/education-experience", label: "Education & Experience", icon: "book" },
  { href: "/gis-projects", label: "Projects", icon: "pin" },
  { href: "/research-publications", label: "Publications", icon: "paper" },
  { href: "/conferences", label: "Seminars & Conferences", icon: "mic" },
  { href: "/posters", label: "Poster presentations", icon: "presentation" }
];

const WEBSITE: NavItem[] = [{ href: "/site-text", label: "Site text", icon: "type" }];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function StorageMeter() {
  const storage = useContentStore((s) => s.storage);
  if (!storage) return null;
  const pct = Math.min(100, Math.round((storage.usedBytes / storage.limitBytes) * 100));
  const level = pct >= 90 ? "high" : pct >= 70 ? "mid" : "ok";
  return (
    <div className={`storage-meter storage-meter-${level}`}>
      <div className="storage-meter-head">
        <Icon name="database" size={15} />
        <span>Photo storage</span>
        <strong>{pct}% used</strong>
      </div>
      <div className="storage-meter-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Photo storage used">
        <span style={{ width: `${pct}%` }} />
      </div>
      <span className="storage-meter-text">
        {formatMB(storage.usedBytes)} of {formatMB(storage.limitBytes)}
      </span>
    </div>
  );
}

export function AppNav() {
  const pathname = usePathname();
  const previewMode = useContentStore((s) => s.previewMode);
  const [open, setOpen] = useState(false);

  // Close the mobile menu whenever the page changes.
  useEffect(() => setOpen(false), [pathname]);

  if (previewMode || pathname === "/login") return null;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/login");
  }

  function renderGroup(title: string, items: NavItem[]) {
    return (
      <div className="nav-group">
        <p className="nav-group-title">{title}</p>
        <ul>
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <GuardedLink href={item.href} className={`nav-link${active ? " nav-link-active" : ""}`} aria-current={active ? "page" : undefined}>
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                </GuardedLink>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <>
      <header className="mobile-bar">
        <button type="button" className="icon-btn" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}>
          <Icon name="menu" size={20} />
        </button>
        <span className="mobile-bar-title">Website editor</span>
      </header>
      {open && <div className="nav-scrim" onClick={() => setOpen(false)} aria-hidden="true" />}
      <nav className={`app-nav${open ? " app-nav-open" : ""}`} aria-label="Website pages">
        <div className="app-nav-top">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              <Icon name="pencil" size={16} />
            </span>
            <span className="brand-text">Website editor</span>
          </div>
          <button type="button" className="icon-btn nav-close" onClick={() => setOpen(false)} aria-label="Close menu">
            <Icon name="x" size={20} />
          </button>
        </div>
        <div className="app-nav-scroll">
          {renderGroup("Pages", PAGES)}
          {renderGroup("Whole website", WEBSITE)}
        </div>
        <div className="app-nav-foot">
          <StorageMeter />
          <a className="nav-link" href={WEBSITE_URL} target="_blank" rel="noreferrer">
            <Icon name="external" />
            <span>View live site</span>
          </a>
          <button type="button" className="nav-link nav-link-button" onClick={logout}>
            <Icon name="logout" />
            <span>Log out</span>
          </button>
        </div>
      </nav>
    </>
  );
}
