/**
 * Pousse Stripe / PayPal depuis .env.local → Vercel.
 * Les NEXT_PUBLIC_* doivent être --no-sensitive (sinon absents du bundle client).
 *
 * Usage : node scripts/push-payments-vercel.mjs
 */
import { readFileSync } from "node:fs";
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

const PUBLIC_KEYS = [
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_PAYPAL_CLIENT_ID",
];

const SECRET_KEYS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "PAYPAL_CLIENT_SECRET",
  "PAYPAL_API_BASE",
];

const env = loadEnv();
const missing = [...PUBLIC_KEYS, ...SECRET_KEYS].filter((k) => !env[k]?.trim());
if (missing.length) {
  console.error("Variables manquantes dans .env.local:", missing.join(", "));
  process.exit(1);
}

function push(name, value, environment, { sensitive }) {
  const args = [
    "vercel",
    "env",
    "add",
    name,
    environment,
    "--force",
    "--yes",
    "--value",
    value,
  ];
  if (sensitive) args.push("--sensitive");
  else args.push("--no-sensitive");

  const result = spawnSync("npx", args, {
    encoding: "utf8",
    shell: true,
  });
  if (result.status !== 0) {
    console.error(`FAIL ${name}@${environment}`);
    console.error((result.stderr || result.stdout || "").slice(0, 400));
    process.exitCode = 1;
    return;
  }
  console.log(
    `OK ${name}@${environment} (${sensitive ? "sensitive" : "public"})`,
  );
}

for (const environment of ["production", "preview"]) {
  for (const key of PUBLIC_KEYS) {
    push(key, env[key], environment, { sensitive: false });
  }
  for (const key of SECRET_KEYS) {
    push(key, env[key], environment, { sensitive: true });
  }
}
