// Makes a salted password hash for ADMIN_PASSWORD_HASH:
//   node scripts/hash-password.mjs "your password"
// then store the printed value as the ADMIN_PASSWORD_HASH secret (wrangler secret put ADMIN_PASSWORD_HASH).
// Changing the secret signs out every open session.
import { pbkdf2Sync, randomBytes } from "node:crypto";

const password = process.argv[2];
if (!password || password.length < 12) {
  console.error('Usage: node scripts/hash-password.mjs "a password of at least 12 characters"');
  process.exit(1);
}
const iterations = 100000; // the most Cloudflare Workers allow for PBKDF2
const salt = randomBytes(16);
const hash = pbkdf2Sync(password, salt, iterations, 32, "sha256");
console.log(`pbkdf2$${iterations}$${salt.toString("hex")}$${hash.toString("hex")}`);
