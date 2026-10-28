import type { EditableTextTag } from "@/components/editable/EditableText";
import type { PageKey, PageSlug } from "./types";

/**
 * This is the "Data Mapping Layer" from the spec: Website Component -> JSON
 * Source -> Editable Field, expressed declaratively instead of as one-off
 * editor components per page. PageEditor (components/generic/PageEditor.tsx)
 * walks this schema tree to render every page, Home included, reusing the
 * same leaf field components and the same key/path convention throughout.
 *
 * `key` is always the object property name at that level — the store
 * resolves the full path by walking the schema tree alongside the data, so
 * there is never a hand-written "projects[0].title"-style string anywhere;
 * it's built structurally as ["projects", 0, "title"] as the UI recurses.
 */
export type FieldDef =
  | { kind: "text"; key: string; label: string; as?: EditableTextTag }
  | { kind: "textarea"; key: string; label: string }
  | { kind: "image"; key: string; label: string }
  | {
      kind: "select";
      key: string;
      label: string;
      options?: { value: string; label: string }[];
      /** Options read from the page's own current data instead of a fixed list, e.g. the Projects page's sections. */
      optionsFrom?: { path: string[]; valueKey: string; labelKey: string };
    }
  | { kind: "stringList"; key: string; label: string; itemLabel: string }
  | { kind: "group"; key: string; label: string; fields: FieldDef[] }
  /**
   * A titled block of the page, in the same order as on the website. It holds no data of its own (its fields
   * keep the page's keys), it only says which part of the website the fields below it change.
   * `anchor` is the id of that part on the website, so the preview can open right there.
   */
  | { kind: "section"; key: string; title: string; where: string; anchor?: string; fields: FieldDef[] }
  | {
      kind: "list";
      key: string;
      label: string;
      itemLabel: string;
      itemFields: FieldDef[];
      /** Field whose text titles each item's header ("3 · Paper title") instead of just "Publication 3". */
      headerKey?: string;
      addFrom?: PickSource;
      autoId?: boolean;
      /**
       * Show the list as a grid of cards (add / remove / reorder here) and edit each item's
       * `itemFields` on its own on-demand page, /<page-slug>/<item id> — see CardGrid and ItemEditor.
       */
      cards?: CardsConfig;
    }
  /** An ordered, article-style mix of paragraph and image blocks (and PDFs when `allowPdf`) — see BlockListEditor. */
  | { kind: "blockList"; key: string; label: string; allowPdf?: boolean }
  /** One uploaded PDF (stored as a path like the "image" field; can be replaced or removed). */
  | { kind: "pdf"; key: string; label: string; /** Small upload control (file name, open, replace, remove) instead of the full viewer. */ compact?: boolean };

/** How an item of a card-style list is summarised on its card (which of its fields to show). */
export interface CardsConfig {
  /** Title given to a freshly added item, e.g. "Untitled project". */
  newItemTitle: string;
  titleKey: string;
  imageKey?: string;
  metaKey?: string;
  summaryKey?: string;
  /** A "select" field whose chosen option's label is shown as a badge on the card. */
  badgeKey?: string;
  /**
   * A "select" field the website groups the cards by (the Projects page shows one block per section, in the
   * order of the section list). The editor then shows the same blocks in the same order.
   */
  groupKey?: string;
  /** Minimal one-card-per-row layout without a thumbnail (used for publications). */
  layout?: "rows";
  /** If this field holds a value, a small `flagLabel` chip is shown on the card (e.g. "PDF"). */
  flagKey?: string;
  flagLabel?: string;
}

/**
 * Lets a "list" field's "+ Add" action pick an existing item from another
 * page's master list (copied in as an independent, freely-editable copy)
 * instead of appending a blank item. Used by Home's pinned projects /
 * pinned publications so they can only ever reference something that
 * already exists in Projects / Research Publications.
 */
export interface PickSource {
  masterPageKey: Exclude<PageKey, "home">;
  masterPath: string[];
  itemTitle: (masterItem: Record<string, unknown>) => string;
  itemSubtitle?: (masterItem: Record<string, unknown>) => string | undefined;
  toItem: (masterItem: Record<string, unknown>) => Record<string, unknown>;
}

export interface PageSchema {
  key: PageKey;
  slug: PageSlug;
  title: string;
  fields: FieldDef[];
}

/** React `key` for a FieldDef in a list. */
export function fieldReactKey(field: FieldDef): string {
  return field.key;
}

const timelineItemFields: FieldDef[] = [
  { kind: "text", key: "period", label: "Period" },
  { kind: "text", key: "institution", label: "Institution" },
  { kind: "text", key: "role", label: "Role" },
  { kind: "textarea", key: "details", label: "Details" }
];

/**
 * Shared by My Story's sections and each project's detail-page sections —
 * same "Add section" experience in both places. Paragraphs and images are
 * one ordered, article-style sequence — add either at the end, in whatever
 * order you want them to read.
 */
const contentSectionItemFields: FieldDef[] = [
  { kind: "text", key: "heading", label: "Section heading" },
  { kind: "blockList", key: "content", label: "Content" }
];

const publicationItemFields: FieldDef[] = [
  { kind: "text", key: "year", label: "Year" },
  { kind: "text", key: "title", label: "Title" },
  { kind: "text", key: "authors", label: "Authors" },
  { kind: "text", key: "status", label: "Status / venue" },
  { kind: "text", key: "link", label: "Link (optional)" }
];

export const homeSchema: PageSchema = {
  key: "home",
  slug: "home",
  title: "Home",
  // Same top-to-bottom order as the website's home page.
  fields: [
    {
      kind: "section",
      key: "header",
      title: "Header",
      where: "The bar at the very top of every page of the website",
      fields: [{ kind: "text", key: "site.title", label: "Site name (top left, links to the home page)" }]
    },
    {
      kind: "section",
      key: "hero",
      title: "Hero",
      where: "The large photo at the top of the home page, with your name and subtitle over it",
      anchor: "about",
      fields: [
        { kind: "text", key: "person.name", label: "Name (large heading on the photo)" },
        { kind: "textarea", key: "person.intro", label: "Subtitle (small text under the name)" },
        { kind: "image", key: "heroImage", label: "Background photo" }
      ]
    },
    {
      kind: "section",
      key: "news",
      title: "Recent news",
      where: "The dated list under the hero",
      anchor: "news",
      fields: [
        {
          kind: "list",
          key: "news",
          label: "News items (top of the list is shown first)",
          itemLabel: "News item",
          headerKey: "date",
          itemFields: [
            { kind: "text", key: "date", label: "Date (before the text)" },
            { kind: "textarea", key: "text", label: "Text" },
            { kind: "text", key: "link", label: "Link address (optional)" },
            { kind: "text", key: "label", label: "Link wording (optional, default “Read more”)" }
          ]
        }
      ]
    },
    {
      kind: "section",
      key: "gallery",
      title: "Photo gallery",
      where: "The big photo with thumbnails underneath, below the news",
      anchor: "gallery",
      fields: [
        {
          kind: "list",
          key: "gallery",
          label: "Photos (the first one is shown large when the page opens)",
          itemLabel: "Photo",
          headerKey: "alt",
          itemFields: [
            { kind: "image", key: "image", label: "Photo" },
            { kind: "text", key: "alt", label: "Caption (shown under the large photo)" }
          ]
        }
      ]
    },
    {
      kind: "section",
      key: "education",
      title: "Education & experience",
      where: "The two timelines in the section below the gallery",
      anchor: "education",
      fields: [
        { kind: "list", key: "education", label: "Education entries", itemLabel: "Entry", headerKey: "institution", itemFields: timelineItemFields },
        { kind: "list", key: "experience", label: "Experience entries (listed under the “Experience” sub-heading)", itemLabel: "Entry", headerKey: "institution", itemFields: timelineItemFields }
      ]
    },
    {
      kind: "section",
      key: "projects",
      title: "Projects",
      where: "The project cards on the home page",
      anchor: "projects",
      fields: [
        {
          kind: "list",
          key: "projects",
          label: "Project cards (choose from the Projects page; each card is a copy you can reword here)",
          itemLabel: "Pinned project",
          headerKey: "title",
          itemFields: [
            { kind: "image", key: "image", label: "Card photo" },
            { kind: "text", key: "title", label: "Title" },
            { kind: "textarea", key: "description", label: "Description (under the title)" },
            { kind: "text", key: "meta", label: "Small line at the bottom of the card" }
          ],
          addFrom: {
            masterPageKey: "gisProjects",
            masterPath: ["projects"],
            itemTitle: (p) => String(p.title ?? "Untitled project"),
            itemSubtitle: (p) => (p.meta ? String(p.meta) : undefined),
            toItem: (p) => ({
              id: p.id ?? "",
              title: p.title ?? "",
              image: p.image ?? "",
              description: p.summary ?? "",
              meta: p.meta ?? ""
            })
          }
        }
      ]
    },
    {
      kind: "section",
      key: "publications",
      title: "Research publications",
      where: "The publication list on the home page",
      anchor: "publications",
      fields: [
        {
          kind: "list",
          key: "publications",
          label: "Publications (choose from the Research Publications page; each entry is a copy you can reword here)",
          itemLabel: "Pinned publication",
          headerKey: "title",
          itemFields: publicationItemFields,
          addFrom: {
            masterPageKey: "researchPublications",
            masterPath: ["publications"],
            itemTitle: (p) => String(p.title ?? "Untitled publication"),
            itemSubtitle: (p) => (p.year ? String(p.year) : undefined),
            // The pinned copy keeps the card fields only; if the original has a PDF the entry links to its page.
            toItem: (p) => {
              const { pdf, ...card } = p as Record<string, unknown>;
              return pdf ? { ...card, hasPage: true } : { ...card };
            }
          }
        }
      ]
    },
    {
      kind: "section",
      key: "contact",
      title: "Contact",
      where: "The contact block near the bottom of the home page",
      anchor: "contact",
      fields: [
        { kind: "text", key: "contact.email", label: "Email address" },
        { kind: "text", key: "contact.phone", label: "Phone number" },
        { kind: "text", key: "contact.location", label: "Location" }
      ]
    },
    {
      kind: "section",
      key: "footer",
      title: "Footer",
      where: "The strip at the bottom of every page (the © line shows the name from the Hero)",
      anchor: "contact",
      fields: [
        {
          kind: "list",
          key: "person.socials",
          label: "Social icons",
          itemLabel: "Social link",
          headerKey: "label",
          itemFields: [
            { kind: "text", key: "label", label: "Name (e.g. LinkedIn)" },
            { kind: "text", key: "url", label: "Link address (phone number for WhatsApp)" },
            { kind: "text", key: "icon", label: "Icon (linkedin, whatsapp, facebook, instagram …)" }
          ]
        }
      ]
    }
  ]
};

export const myStorySchema: PageSchema = {
  key: "myStory",
  slug: "my-story",
  title: "My Story",
  fields: [
    { kind: "text", key: "title", label: "Browser tab title (not shown on the page)" },
    { kind: "text", key: "heading", label: "Page heading", as: "h1" },
    { kind: "textarea", key: "intro", label: "Intro" },
    {
      kind: "list",
      key: "sections",
      label: "Sections",
      itemLabel: "Section",
      itemFields: contentSectionItemFields
    }
  ]
};

export const educationExperienceSchema: PageSchema = {
  key: "educationExperience",
  slug: "education-experience",
  title: "Education & Experience",
  fields: [
    { kind: "text", key: "title", label: "Browser tab title (not shown on the page)" },
    { kind: "text", key: "heading", label: "Page heading", as: "h1" },
    { kind: "list", key: "education", label: "Education", itemLabel: "Entry", itemFields: timelineItemFields },
    { kind: "list", key: "experience", label: "Experience", itemLabel: "Entry", itemFields: timelineItemFields },
    {
      kind: "list",
      key: "certificates",
      label: "Certificates (shown below Experience)",
      itemLabel: "Certificate",
      itemFields: [
        { kind: "image", key: "image", label: "Certificate image" },
        { kind: "text", key: "caption", label: "Caption" }
      ]
    }
  ]
};

export const gisProjectsSchema: PageSchema = {
  key: "gisProjects",
  slug: "gis-projects",
  title: "Projects",
  fields: [
    { kind: "text", key: "title", label: "Browser tab title (not shown on the page)" },
    { kind: "text", key: "heading", label: "Page heading", as: "h1" },
    { kind: "textarea", key: "intro", label: "Intro" },
    {
      kind: "list",
      key: "categories",
      label: "Project page sections (the groups the projects are listed under — add, rename, reorder or remove them)",
      itemLabel: "Section",
      autoId: true,
      itemFields: [{ kind: "text", key: "label", label: "Section name" }]
    },
    {
      kind: "list",
      key: "projects",
      label: "Projects",
      itemLabel: "Project",
      autoId: true,
      cards: { newItemTitle: "Untitled project", titleKey: "title", imageKey: "image", metaKey: "meta", summaryKey: "summary", badgeKey: "category", groupKey: "category" },
      // Same order as the project's own page on the website: small line, title, photo, summary, sections.
      itemFields: [
        { kind: "text", key: "meta", label: "Small line above the title (also at the bottom of the card)" },
        { kind: "text", key: "title", label: "Title" },
        { kind: "image", key: "image", label: "Photo (under the title; also the card photo — optional)" },
        { kind: "textarea", key: "summary", label: "Summary (under the photo; also the card text)" },
        {
          kind: "list",
          key: "sections",
          label: "Detail page sections",
          itemLabel: "Section",
          itemFields: contentSectionItemFields
        },
        { kind: "select", key: "category", label: "Section it is listed under (decides where its card appears on the Projects page)", optionsFrom: { path: ["categories"], valueKey: "id", labelKey: "label" } }
      ]
    }
  ]
};

export const researchPublicationsSchema: PageSchema = {
  key: "researchPublications",
  slug: "research-publications",
  title: "Research Publications",
  fields: [
    { kind: "text", key: "title", label: "Browser tab title (not shown on the page)" },
    { kind: "text", key: "heading", label: "Page heading", as: "h1" },
    {
      kind: "list",
      key: "publications",
      label: "Publications (shown in this order on the website)",
      itemLabel: "Publication",
      headerKey: "title",
      autoId: true,
      itemFields: [
        ...publicationItemFields,
        { kind: "pdf", key: "pdf", label: "PDF (optional)", compact: true }
      ]
    }
  ]
};

export const conferencesSchema: PageSchema = {
  key: "conferences",
  slug: "conferences",
  title: "Conferences, Seminars and Training",
  fields: [
    { kind: "text", key: "title", label: "Browser tab title (not shown on the page)" },
    { kind: "text", key: "heading", label: "Page heading", as: "h1" },
    { kind: "textarea", key: "intro", label: "Intro" },
    {
      kind: "list",
      key: "sections",
      label: "Sections",
      itemLabel: "Section",
      itemFields: contentSectionItemFields
    }
  ]
};

/** Posters' detail-page sections: like a project's, but each section can also hold uploaded PDFs. */
const posterSectionItemFields: FieldDef[] = [
  { kind: "text", key: "heading", label: "Section heading" },
  { kind: "blockList", key: "content", label: "Content", allowPdf: true }
];

export const postersSchema: PageSchema = {
  key: "posters",
  slug: "posters",
  title: "Poster presentations",
  fields: [
    { kind: "text", key: "title", label: "Browser tab title (not shown on the page)" },
    { kind: "text", key: "heading", label: "Page heading", as: "h1" },
    { kind: "textarea", key: "intro", label: "Intro" },
    {
      kind: "list",
      key: "posters",
      label: "Posters & presentations",
      itemLabel: "Poster",
      autoId: true,
      cards: { newItemTitle: "Untitled poster", titleKey: "title", imageKey: "image", metaKey: "meta", summaryKey: "summary" },
      itemFields: [
        { kind: "text", key: "meta", label: "Small line above the title (event / date; also on the card)" },
        { kind: "text", key: "title", label: "Title" },
        { kind: "image", key: "image", label: "Photo (under the title; also the card photo — optional)" },
        { kind: "textarea", key: "summary", label: "Summary (under the photo; also the card text)" },
        {
          kind: "list",
          key: "sections",
          label: "Detail page sections",
          itemLabel: "Section",
          itemFields: posterSectionItemFields
        }
      ]
    }
  ]
};

/** The six dedicated pages the generic PageEditor drives. Home is handled separately. */
export const dedicatedPageSchemas: Record<Exclude<PageKey, "home">, PageSchema> = {
  myStory: myStorySchema,
  educationExperience: educationExperienceSchema,
  gisProjects: gisProjectsSchema,
  researchPublications: researchPublicationsSchema,
  conferences: conferencesSchema,
  posters: postersSchema
};

export function schemaForSlug(slug: PageSlug): PageSchema | undefined {
  return Object.values(dedicatedPageSchemas).find((s) => s.slug === slug);
}

export function schemaForKey(key: PageKey): PageSchema {
  return key === "home" ? homeSchema : dedicatedPageSchemas[key];
}

/** The list on a page that is shown as cards with per-item edit pages (Projects, Poster presentations), if any. */
export function cardListField(schema: PageSchema): Extract<FieldDef, { kind: "list" }> | undefined {
  return schema.fields.find((f): f is Extract<FieldDef, { kind: "list" }> => f.kind === "list" && !!f.cards);
}

/** The choices of a "select" field: its fixed list, or the values currently present in the page's data. */
export function selectOptions(
  field: Extract<FieldDef, { kind: "select" }>,
  pageData: unknown
): { value: string; label: string }[] {
  if (field.options) return field.options;
  const from = field.optionsFrom;
  if (!from) return [];
  let node: unknown = pageData;
  for (const seg of from.path) node = (node as Record<string, unknown> | undefined)?.[seg];
  if (!Array.isArray(node)) return [];
  return node
    .map((item) => item as Record<string, unknown>)
    .filter((item) => item && item[from.valueKey])
    .map((item) => ({ value: String(item[from.valueKey]), label: String(item[from.labelKey] || "Untitled section") }));
}
