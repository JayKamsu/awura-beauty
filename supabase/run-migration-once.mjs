/**
 * Exécute un fichier SQL via DATABASE_URL (prod).
 * Usage : node supabase/run-migration-once.mjs <fichier.sql>
 */
import { readFileSync, existsSync } from "node:fs";

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
const databaseUrl = env.DATABASE_URL || env.SUPABASE_DB_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL missing in .env.local");
  process.exit(1);
}

const { default: pg } = await import("pg");
const sqlPath = process.argv[2];
if (!sqlPath) {
  console.error("Usage: node supabase/run-migration-once.mjs <fichier.sql>");
  process.exit(1);
}
if (!existsSync(sqlPath)) {
  console.error("SQL file missing:", sqlPath);
  process.exit(1);
}

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
try {
  await client.query(readFileSync(sqlPath, "utf8"));
  await client.query("notify pgrst, 'reload schema'");
  console.log("MIGRATION_OK:", sqlPath);
} catch (error) {
  console.error("MIGRATION_ERROR:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
