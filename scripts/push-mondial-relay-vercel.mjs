/**
 * Pousse les variables Mondial Relay (API 1) depuis .env.local → Vercel.
 * Usage : node scripts/push-mondial-relay-vercel.mjs
 *
 * Prérequis : `npx vercel login` + projet lié (`npx vercel link`).
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

const KEYS = [
  "MONDIAL_RELAY_ENSEIGNE",
  "MONDIAL_RELAY_PRIVATE_KEY",
  "MONDIAL_RELAY_BRAND_CODE",
  "MONDIAL_RELAY_MODE",
  "MONDIAL_RELAY_WSDL_URL",
  "SHIPPING_AUTO_LABEL_ON_PAID",
];

const env = loadEnv();
const missing = KEYS.filter(
  (key) =>
    key !== "SHIPPING_AUTO_LABEL_ON_PAID" &&
    key !== "MONDIAL_RELAY_WSDL_URL" &&
    !env[key],
);

if (missing.length) {
  console.error("Variables manquantes dans .env.local:", missing.join(", "));
  process.exit(1);
}

function push(name, value, environment) {
  if (value === undefined || value === "") {
    console.log(`SKIP ${name}@${environment} (vide)`);
    return;
  }

  // --force écrase si déjà présent ; --yes mode non interactif
  const result = spawnSync(
    "npx",
    [
      "vercel",
      "env",
      "add",
      name,
      environment,
      "--value",
      value,
      "--yes",
      "--force",
      "--sensitive",
    ],
    {
      encoding: "utf8",
      shell: true,
    },
  );

  const out = `${result.stdout || ""}\n${result.stderr || ""}`;
  if (result.status !== 0) {
    // Fallback sans --value (CLI plus ancienne) : stdin
    const fallback = spawnSync(
      "npx",
      ["vercel", "env", "add", name, environment, "--force", "--yes"],
      {
        input: value,
        encoding: "utf8",
        shell: true,
      },
    );
    const out2 = `${fallback.stdout || ""}\n${fallback.stderr || ""}`;
    if (fallback.status !== 0) {
      console.error(`FAIL ${name}@${environment}`);
      console.error(out.slice(0, 500));
      console.error(out2.slice(0, 500));
      process.exitCode = 1;
      return;
    }
  }
  console.log(`OK ${name}@${environment}`);
}

const targets = ["production", "preview"];

for (const environment of targets) {
  for (const key of KEYS) {
    const value =
      key === "SHIPPING_AUTO_LABEL_ON_PAID"
        ? env[key] || "true"
        : env[key];
    push(key, value, environment);
  }
}

console.log(
  "\nTerminé. Redéploie production si besoin : npx vercel --prod",
);
