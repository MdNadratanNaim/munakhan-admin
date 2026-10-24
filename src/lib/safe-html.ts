/**
 * Shows text the way the website will: <b>, <i>, <br> and links come out formatted instead of as raw tags.
 * Only a short list of harmless tags survives; anything else is dropped (its text is kept), so a stray tag
 * or pasted markup can never run scripts inside the editor.
 */
const ALLOWED = new Set(["B", "STRONG", "I", "EM", "U", "BR", "A", "SUP", "SUB"]);
const SAFE_HREF = /^(https?:|mailto:|tel:|\/|#)/i;

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(text: string): string {
  return escapeHtml(text).replace(/"/g, "&quot;");
}

function walk(node: Node): string {
  if (node.nodeType === 3) return escapeHtml(node.textContent ?? "");
  if (node.nodeType !== 1) return "";
  const el = node as Element;
  const tag = el.tagName.toUpperCase();
  if (tag === "SCRIPT" || tag === "STYLE") return "";
  if (tag === "BR") return "<br>";
  const inner = Array.from(el.childNodes).map(walk).join("");
  if (!ALLOWED.has(tag)) return inner;
  if (tag === "A") {
    const href = el.getAttribute("href") ?? "";
    return SAFE_HREF.test(href.trim()) ? `<a href="${escapeAttr(href.trim())}">${inner}</a>` : inner;
  }
  const name = tag.toLowerCase();
  return `<${name}>${inner}</${name}>`;
}

export function toSafeHtml(input: string): string {
  if (typeof DOMParser === "undefined") return escapeHtml(input);
  const doc = new DOMParser().parseFromString(`<body>${input}</body>`, "text/html");
  return Array.from(doc.body.childNodes).map(walk).join("");
}
