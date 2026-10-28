import type { FieldDef } from "./page-schemas";
import { getAtPath, setAtPath, type PathSegment } from "./object-path";

/** A saved media path such as "home/gallery-2.jpg" or "posters/1791-ab12.pdf". */
const MEDIA_PATH = /^[\w-]+(?:\/[\w.-]+)+\.(?:jpe?g|png|gif|webp|avif|svg|pdf)$/i;

/**
 * Returns a deep copy of `data` in which every image / PDF value is a complete, directly usable URL:
 * a saved path such as photos/... becomes imageBase + path, and a staged (not yet saved) upload becomes
 * its in-memory blob: URL. The preview frame is a separate document with no access to the admin's own
 * image-resolution logic, and the website's `img()` helper only passes full URLs through untouched.
 *
 * Fields named in the schema are resolved first; a final sweep then resolves any other value that looks like
 * a media path, so a field the schema does not know about can never leave the preview with a broken image.
 */
export function resolveImagesForPreview<T>(fields: FieldDef[], data: T, resolve: (value: string | undefined) => string | undefined): T {
  let result: T = data;

  function resolveAt(path: PathSegment[]) {
    const current = getAtPath(result, path) as string | undefined;
    if (typeof current !== "string" || !current) return;
    const resolved = resolve(current);
    if (resolved !== current) result = setAtPath(result, path, resolved ?? "");
  }

  function walk(fieldList: FieldDef[], basePath: PathSegment[]) {
    for (const field of fieldList) {
      if (field.kind === "section") {
        walk(field.fields, basePath);
        continue;
      }
      const path = [...basePath, ...field.key.split(".")];
      if (field.kind === "image" || field.kind === "pdf") {
        resolveAt(path);
      } else if (field.kind === "group") {
        walk(field.fields, path);
      } else if (field.kind === "list") {
        const arr = (getAtPath(result, path) as unknown[]) ?? [];
        arr.forEach((_, idx) => walk(field.itemFields, [...path, idx]));
      } else if (field.kind === "blockList") {
        const blocks = (getAtPath(result, path) as Array<{ type: string }>) ?? [];
        blocks.forEach((block, idx) => {
          if (block.type === "image") resolveAt([...path, idx, "image"]);
          else if (block.type === "pdf") resolveAt([...path, idx, "pdf"]);
        });
      }
      // "text" | "textarea" | "select" | "stringList" carry no media paths.
    }
  }

  walk(fields, []);

  function sweep(node: unknown, path: PathSegment[]) {
    if (typeof node === "string") {
      if (MEDIA_PATH.test(node)) resolveAt(path);
    } else if (Array.isArray(node)) {
      node.forEach((child, idx) => sweep(child, [...path, idx]));
    } else if (node && typeof node === "object") {
      for (const [key, child] of Object.entries(node)) sweep(child, [...path, key]);
    }
  }
  sweep(result, []);

  return result;
}
