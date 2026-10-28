function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  return bytesToBase64(new Uint8Array(buf));
}

export function utf8ToBase64(text: string): string {
  return bytesToBase64(new TextEncoder().encode(text));
}

export function generateImageFilename(originalName: string): string {
  // Keep only a plain extension (letters and digits): names like "paper v2. final " or "scan.pdf (1)" must never leak into a repo path.
  const dot = originalName.lastIndexOf(".");
  const rawExt = dot === -1 ? "" : originalName.slice(dot + 1).trim().toLowerCase();
  const ext = /^[a-z0-9]{1,8}$/.test(rawExt) ? `.${rawExt}` : "";
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 8)
      : Math.random().toString(36).slice(2, 10).padEnd(8, "0");
  return `${Date.now()}-${random}${ext}`;
}
