import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppDataProvider } from "@/components/AppDataProvider";
import { AppNav } from "@/components/nav/AppNav";
import { UnsavedChangesGuard } from "@/components/nav/UnsavedChangesGuard";
import { SaveBar } from "@/components/nav/SaveBar";

export const metadata: Metadata = {
  title: { default: "Website editor", template: "%s · Website editor" },
  description: "Private editor.",
  // Not for search engines, archives or link previews.
  robots: { index: false, follow: false, nocache: true, noarchive: true, nosnippet: true, noimageindex: true, googleBot: { index: false, follow: false, noarchive: true, nosnippet: true, noimageindex: true } },
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/favicon.ico", sizes: "any" }], apple: "/apple-icon.png" },
  formatDetection: { telephone: false, email: false, address: false }
};

export const viewport: Viewport = {
  themeColor: "#b8304a"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* The live site's own stylesheet, fetched on request — the editor mirrors it instead of reimplementing it. */}
        <link rel="stylesheet" href="/api/live/asset/styles.css" />
        {/* Type for the editor's own controls (menus, buttons, labels); the website's content keeps the site's fonts. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AppDataProvider>
          <UnsavedChangesGuard />
          <div className="app-frame">
            <AppNav />
            <main className="admin-main">{children}</main>
          </div>
          <SaveBar />
        </AppDataProvider>
      </body>
    </html>
  );
}
