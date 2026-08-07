/**
 * Pousse FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY vers Vercel (prod + preview).
 * Usage: node scripts/push-firebase-sa-vercel.mjs
 */
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

function loadEnv(path = ".env.local") {
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    env[line.slice(0, i).trim()] = v;
  }
  return env;
}

const env = loadEnv();
const email = env.FIREBASE_CLIENT_EMAIL;
const pk = env.FIREBASE_PRIVATE_KEY;
if (!email || !pk) {
  console.error("Missing FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY in .env.local");
  process.exit(1);
}

function push(name, value, environment) {
  const file = join(tmpdir(), `awura-vercel-${name}-${environment}.txt`);
  writeFileSync(file, value, "utf8");
  const result = spawnSync(
    "npx",
    ["vercel", "env", "add", name, environment, "--force"],
    {
      input: value,
      encoding: "utf8",
      shell: true,
    },
  );
  try {
    unlinkSync(file);
  } catch {
    /* ignore */
  }
  const out = `${result.stdout || ""}\n${result.stderr || ""}`;
  if (result.status !== 0) {
    console.error(`FAIL ${name}@${environment}`, out.slice(0, 400));
    process.exitCode = 1;
    return;
  }
  console.log(`OK ${name}@${environment}`);
}

for (const environment of ["production", "preview"]) {
  push("FIREBASE_CLIENT_EMAIL", email, environment);
  push("FIREBASE_PRIVATE_KEY", pk, environment);
}
