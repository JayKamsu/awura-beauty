/**
 * Setup one-shot : migration SQL (via DATABASE_URL) + user admin.
 * Usage : node supabase/setup.mjs
 * Nécessite dans .env.local :
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 *   DATABASE_URL (optionnel — connection string postgres pour le SQL)
 */

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv(path = ".env.local") {
  if (!existsSync(path)) throw new Error(`${path} missing`);
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
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const databaseUrl = env.DATABASE_URL || env.SUPABASE_DB_URL;

if (!url || !serviceKey || !anonKey) {
  console.error(
    "MISSING_KEYS: renseigne NEXT_PUBLIC_SUPABASE_ANON_KEY et SUPABASE_SERVICE_ROLE_KEY dans .env.local",
  );
  process.exit(1);
}

// ── SQL migration (si DATABASE_URL fourni) ────────────────
if (databaseUrl) {
  const { default: pg } = await import("pg").catch(() => ({ default: null }));
  if (!pg) {
    console.error("Installe pg: npm i -D pg");
    process.exit(1);
  }
  const sql = readFileSync("supabase/migrate.sql", "utf8");
  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  await client.query(sql);
  await client.end();
  console.log("MIGRATION_OK");
} else {
  console.log(
    "MIGRATION_SKIPPED: colle supabase/migrate.sql dans SQL Editor, ou ajoute DATABASE_URL",
  );
}

// ── Admin user ────────────────────────────────────────────
const email = env.ADMIN_EMAILS?.split(",")[0]?.trim() || "admin@awura.local";
const password = env.ADMIN_PASSWORD || "AwuraAdmin2026!";

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: listed, error: listErr } = await supabase.auth.admin.listUsers({
  perPage: 200,
});
if (listErr) {
  console.error("LIST_ERROR", listErr.message);
  process.exit(1);
}

const existing = listed.users.find(
  (u) => (u.email || "").toLowerCase() === email.toLowerCase(),
);

if (existing) {
  const { error } = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
    app_metadata: { ...(existing.app_metadata || {}), role: "admin" },
    user_metadata: { ...(existing.user_metadata || {}), role: "admin" },
  });
  if (error) {
    console.error("UPDATE_ERROR", error.message);
    process.exit(1);
  }
  console.log("ADMIN_UPDATED", email);
} else {
  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "admin" },
    user_metadata: { role: "admin" },
  });
  if (error) {
    console.error("CREATE_ERROR", error.message);
    process.exit(1);
  }
  console.log("ADMIN_CREATED", email);
}

console.log("DONE");
console.log("Login:", email);
console.log("Password:", password);
