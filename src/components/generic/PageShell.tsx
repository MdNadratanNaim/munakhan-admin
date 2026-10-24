"use client";

import { PageEditor } from "./PageEditor";
import { SimulatedSitePage } from "@/components/preview/SimulatedSitePage";
import { Sidebar } from "@/components/sidebar/Sidebar";
import type { PageSchema } from "@/lib/page-schemas";
import { useContentStore } from "@/store/content-store";

export function PageShell({ schema }: { schema: PageSchema }) {
  const previewMode = useContentStore((s) => s.previewMode);

  return (
    <div className="page-layout">
      <Sidebar pageKey={schema.key} title={schema.title} />
      {previewMode ? <SimulatedSitePage schema={schema} /> : <PageEditor schema={schema} />}
    </div>
  );
}
