"use client";

import { ItemEditor } from "./ItemEditor";
import { SimulatedSitePage } from "@/components/preview/SimulatedSitePage";
import { Sidebar } from "@/components/sidebar/Sidebar";
import type { PageSchema } from "@/lib/page-schemas";
import { useContentStore } from "@/store/content-store";

export function ItemShell({ schema, id }: { schema: PageSchema; id: string }) {
  const previewMode = useContentStore((s) => s.previewMode);

  return (
    <div className="page-layout">
      <Sidebar pageKey={schema.key} title={schema.title} />
      {previewMode ? <SimulatedSitePage schema={schema} viewId={id} /> : <ItemEditor schema={schema} id={id} />}
    </div>
  );
}
