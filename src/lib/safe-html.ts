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

/**
 * The reverse of toSafeHtml: turns what is on screen in the rich text box back into the plain, tidy HTML the
 * website stores (<b>, <i>, <u>, <sup>, <sub>, <a>, <br>). Browsers differ in what they leave behind after
 * formatting (<strong>, styled <span>, <div> per line); all of that is normalised here, so nobody ever sees or types a tag.
 */
export function fromEditable(root: HTMLElement): string {
  function styled(el: Element): string[] {
    const style = (el as HTMLElement).style;
    const tags: string[] = [];
    const weight = style?.fontWeight ?? "";
    if (weight === "bold" || weight === "bolder" || Number(weight) >= 600) tags.push("b");
    if (style?.fontStyle === "italic") tags.push("i");
    if ((style?.textDecorationLine ?? style?.textDecoration ?? "").includes("underline")) tags.push("u");
    return tags;
  }

  function inline(node: Node): string {
    if (node.nodeType === 3) return escapeHtml((node.textContent ?? "").replace(/\u00a0/g, " "));
    if (node.nodeType !== 1) return "";
    const el = node as Element;
    const tag = el.tagName.toUpperCase();
    if (tag === "BR") return "<br>";
    if (tag === "SCRIPT" || tag === "STYLE") return "";
    const children = Array.from(el.childNodes).map(inline).join("");
    if (children === "") return "";
    let wrapped = children;
    if (tag === "A") {
      const href = (el.getAttribute("href") ?? "").trim();
      wrapped = SAFE_HREF.test(href) ? `<a href="${escapeAttr(href)}">${children}</a>` : children;
    } else if (tag === "B" || tag === "STRONG") wrapped = `<b>${children}</b>`;
    else if (tag === "I" || tag === "EM") wrapped = `<i>${children}</i>`;
    else if (tag === "U") wrapped = `<u>${children}</u>`;
    else if (tag === "SUP") wrapped = `<sup>${children}</sup>`;
    else if (tag === "SUB") wrapped = `<sub>${children}</sub>`;
    for (const t of styled(el)) {
      if (!wrapped.startsWith(`<${t}>`)) wrapped = `<${t}>${wrapped}</${t}>`;
    }
    return wrapped;
  }

  // A browser starts a new <div>/<p> for each Enter; the website only knows <br>.
  const parts: string[] = [];
  let line = "";
  const flush = () => {
    parts.push(line === "<br>" ? "" : line); // a lone <br> is the placeholder a browser keeps in an empty line
    line = "";
  };
  function visit(node: Node) {
    if (node.nodeType === 1 && ["DIV", "P"].includes((node as Element).tagName.toUpperCase())) {
      if (line !== "") flush();
      Array.from(node.childNodes).forEach(visit);
      flush();
    } else {
      line += inline(node);
    }
  }
  Array.from(root.childNodes).forEach(visit);
  if (line !== "") flush();

  return parts
    .join("<br>")
    .replace(/(?:<br>)+$/g, "")
    .replace(/<(b|i|u|sup|sub)><\/\1>/g, "");
}
