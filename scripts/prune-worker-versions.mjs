// Keeps only the newest KEEP_VERSIONS (default 3) uploaded versions of this Worker.
// Run after `wrangler deploy`. Versions that are currently deployed are never deleted (Cloudflare refuses to as well).
// Needs CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID in the environment (the deploy job already has them).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const KEEP = Number(process.env.KEEP_VERSIONS || 3);
const name = /^name\s*=\s*"([^"]+)"/m.exec(readFileSync("wrangler.toml", "utf8"))?.[1];
if (!name) throw new Error("Worker name not found in wrangler.toml");

const wr = (args) => execFileSync("npx", ["wrangler", ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

const raw = wr(["versions", "list", "--name", name, "--json"]);
const versions = JSON.parse(raw.slice(raw.indexOf("[")));
const created = (v) => Date.parse(v.metadata?.created_on ?? v.created_on ?? 0);
versions.sort((a, b) => created(b) - created(a));
console.log(`${name}: ${versions.length} versions, keeping the newest ${KEEP}`);

for (const v of versions.slice(KEEP)) {
  try {
    wr(["versions", "delete", v.id, "--name", name, "--yes"]);
    console.log("deleted", v.id);
  } catch (e) {
    console.log("kept", v.id, "-", String(e.stderr || e.message).split("\n")[0]);
  }
}
