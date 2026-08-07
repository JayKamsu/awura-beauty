/**
 * Injecte FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY dans .env.local
 * depuis un JSON compte de service (ne pas committer la clé).
 */
import { readFileSync, writeFileSync, unlinkSync, existsSync } from "node:fs";

const keyPath = process.argv[2];
const envPath = process.argv[3] || ".env.local";

if (!keyPath || !existsSync(keyPath)) {
  console.error("Usage: node scripts/inject-firebase-sa.mjs <sa.json> [.env.local]");
  process.exit(1);
}

const sa = JSON.parse(readFileSync(keyPath, "utf8"));
const email = sa.client_email;
const privateKeyEscaped = String(sa.private_key).replace(/\n/g, "\\n");

let env = readFileSync(envPath, "utf8");

function upsert(name, value) {
  const line = `${name}=${value}`;
  const re = new RegExp(`^${name}=.*$`, "m");
  if (re.test(env)) env = env.replace(re, line);
  else env = `${env.trimEnd()}\n${line}\n`;
}

upsert("FIREBASE_PROJECT_ID", sa.project_id || "awura-beauty-44943");
upsert("FIREBASE_CLIENT_EMAIL", email);
upsert("FIREBASE_PRIVATE_KEY", `"${privateKeyEscaped}"`);

writeFileSync(envPath, env.endsWith("\n") ? env : `${env}\n`);
console.log("ENV_UPDATED", email);

try {
  unlinkSync(keyPath);
  console.log("KEY_FILE_DELETED");
} catch {
  console.log("KEY_FILE_KEEP", keyPath);
}
