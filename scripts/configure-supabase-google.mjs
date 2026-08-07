/**
 * Active le provider Google dans Supabase Auth.
 * Usage:
 *   node scripts/configure-supabase-google.mjs --client-id=XXX --client-secret=YYY
 * ou lit .local/google-oauth.json
 */
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const SUPABASE_REF = "jciwbpukqiivtivaksib";

function parseArgs(argv) {
  const out = {};
  for (const arg of argv.slice(2)) {
    const m = arg.match(/^--([^=]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function supabaseToken() {
  const candidates = [
    join(homedir(), ".supabase", "access-token"),
    join(homedir(), "AppData", "Roaming", "supabase", "access-token"),
    join(homedir(), ".config", "supabase", "access-token"),
  ];
  for (const p of candidates) {
    if (!existsSync(p)) continue;
    const raw = readFileSync(p, "utf8").trim();
    try {
      const j = JSON.parse(raw);
      return j.access_token || j.token || raw;
    } catch {
      return raw;
    }
  }
  throw new Error("Supabase access token missing — run: npx supabase login");
}

async function main() {
  const args = parseArgs(process.argv);
  let clientId = args["client-id"];
  let clientSecret = args["client-secret"];

  const localPath = join(process.cwd(), ".local", "google-oauth.json");
  if ((!clientId || !clientSecret) && existsSync(localPath)) {
    const j = JSON.parse(readFileSync(localPath, "utf8"));
    clientId = clientId || j.clientId;
    clientSecret = clientSecret || j.clientSecret;
  }

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing credentials. Pass --client-id= and --client-secret= (from Firebase Auth → Google, or Google Cloud Credentials).",
    );
  }

  const token = supabaseToken();
  const url = `https://api.supabase.com/v1/projects/${SUPABASE_REF}/config/auth`;
  const getRes = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!getRes.ok) {
    throw new Error(`GET auth config failed: ${getRes.status} ${await getRes.text()}`);
  }
  const current = await getRes.json();

  const redirects = new Set(
    String(current.URI_ALLOW_LIST || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  for (const u of [
    "http://localhost:3000/**",
    "http://localhost:3000/auth/callback",
    "https://www.awurabeauty.com/**",
    "https://www.awurabeauty.com/auth/callback",
    "https://awurabeauty.com/**",
    "https://awurabeauty.com/auth/callback",
  ]) {
    redirects.add(u);
  }

  const patchRes = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      EXTERNAL_GOOGLE_ENABLED: true,
      EXTERNAL_GOOGLE_CLIENT_ID: clientId,
      EXTERNAL_GOOGLE_SECRET: clientSecret,
      SITE_URL: "https://www.awurabeauty.com",
      URI_ALLOW_LIST: [...redirects].join(","),
    }),
  });

  if (!patchRes.ok) {
    throw new Error(
      `PATCH auth config failed: ${patchRes.status} ${await patchRes.text()}`,
    );
  }

  console.log("SUPABASE_GOOGLE_ENABLED");
  console.log(
    "Redirect URI à avoir côté Google:",
    `https://${SUPABASE_REF}.supabase.co/auth/v1/callback`,
  );
}

main().catch((error) => {
  console.error("FAILED", error.message);
  process.exit(1);
});
