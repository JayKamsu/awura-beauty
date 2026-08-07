/**
 * Suite config Google Auth → Supabase.
 * Usage: node scripts/setup-google-auth.mjs
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const GCP_PROJECT = "awura-beauty-44943";
const GCP_NUMBER = "48578002800";
const SUPABASE_REF = "jciwbpukqiivtivaksib";
const SUPPORT_EMAIL = "contact.awurabeauty@gmail.com";
const CALLBACK = `https://${SUPABASE_REF}.supabase.co/auth/v1/callback`;

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: "utf8", shell: true });
  if (r.status !== 0) {
    throw new Error(`${cmd} failed: ${(r.stderr || r.stdout || "").slice(0, 800)}`);
  }
  return (r.stdout || "").trim();
}

function token() {
  return run("gcloud", ["auth", "print-access-token"]);
}

function supabaseToken() {
  for (const p of [
    join(homedir(), ".supabase", "access-token"),
    join(homedir(), "AppData", "Roaming", "supabase", "access-token"),
    join(homedir(), ".config", "supabase", "access-token"),
  ]) {
    if (!existsSync(p)) continue;
    const raw = readFileSync(p, "utf8").trim();
    try {
      const j = JSON.parse(raw);
      return j.access_token || j.token || raw;
    } catch {
      return raw;
    }
  }
  throw new Error("Run: npx supabase login");
}

async function api(url, t, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${t}`,
      "Content-Type": "application/json",
      "x-goog-user-project": GCP_PROJECT,
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  return { ok: res.ok, status: res.status, body, text };
}

async function tryInitAuth(t) {
  const attempts = [
    {
      method: "POST",
      url: `https://identitytoolkit.googleapis.com/v2/projects/${GCP_PROJECT}/identityPlatform:initializeAuth`,
      body: {},
    },
    {
      method: "POST",
      url: `https://firebase.googleapis.com/v1beta1/projects/${GCP_PROJECT}/identityPlatform:initializeAuth`,
      body: {},
    },
    {
      method: "PATCH",
      url: `https://identitytoolkit.googleapis.com/admin/v2/projects/${GCP_PROJECT}/config?updateMask=signIn.email`,
      body: { signIn: { email: { enabled: true, passwordRequired: true } } },
    },
    {
      method: "POST",
      url: `https://identitytoolkit.googleapis.com/admin/v2/projects/${GCP_PROJECT}/config`,
      body: { signIn: { email: { enabled: true, passwordRequired: true } } },
    },
  ];
  for (const a of attempts) {
    const r = await api(a.url, t, {
      method: a.method,
      body: JSON.stringify(a.body),
    });
    console.log("INIT", a.method, a.url.split("/").slice(-2).join("/"), r.status, r.text.slice(0, 180));
    if (r.ok) return r.body;
  }
  return null;
}

async function createWebOauthClient(t) {
  const parents = [
    `projects/${GCP_PROJECT}`,
    `projects/${GCP_NUMBER}`,
    GCP_PROJECT,
  ];

  // Brands (Google Auth Platform / oauthconfig)
  for (const parent of [`projects/${GCP_PROJECT}`, `projects/${GCP_NUMBER}`]) {
    for (const base of [
      "https://oauthconfig.googleapis.com/v1",
      "https://oauth2.googleapis.com/v1",
    ]) {
      const list = await api(`${base}/${parent}/brands`, t);
      console.log("BRANDS", base, parent, list.status);
      if (list.ok && list.body?.brands?.[0]) {
        console.log("BRAND_OK", list.body.brands[0].name);
      }
      if (list.status === 404 || list.status === 400) {
        const created = await api(`${base}/${parent}/brands`, t, {
          method: "POST",
          body: JSON.stringify({
            displayName: "Awura Beauty",
            supportEmail: SUPPORT_EMAIL,
            applicationTitle: "Awura Beauty",
          }),
        });
        console.log("BRAND_CREATE", created.status, created.text.slice(0, 200));
      }
    }
  }

  // Client creation attempts
  const payloads = [
    {
      url: `https://clientauthconfig.googleapis.com/v1/clients?parent=projects%2F${GCP_PROJECT}`,
      body: {
        client_type: 1,
        display_name: "Awura Beauty Supabase",
        redirect_uris: [CALLBACK],
        javascript_origins: [
          "http://localhost:3000",
          "https://www.awurabeauty.com",
          "https://awurabeauty.com",
        ],
      },
    },
    {
      url: `https://clientauthconfig.googleapis.com/v1/clients?parent=projects%2F${GCP_NUMBER}`,
      body: {
        clientType: "CLIENT_TYPE_WEB_APPLICATION",
        displayName: "Awura Beauty Supabase",
        web: {
          redirectUris: [CALLBACK],
          javascriptOrigins: [
            "http://localhost:3000",
            "https://www.awurabeauty.com",
            "https://awurabeauty.com",
          ],
        },
      },
    },
    {
      url: `https://oauthconfig.googleapis.com/v1/projects/${GCP_PROJECT}/oauthClients`,
      body: {
        displayName: "Awura Beauty Supabase",
        clientType: "CONFIDENTIAL_CLIENT",
        redirectUris: [CALLBACK],
      },
    },
    {
      url: `https://oauthconfig.googleapis.com/v1/projects/${GCP_NUMBER}/oauthClients`,
      body: {
        displayName: "Awura Beauty Supabase",
        clientType: "WEB_APPLICATION",
        redirectUris: [CALLBACK],
      },
    },
  ];

  for (const p of payloads) {
    const r = await api(p.url, t, {
      method: "POST",
      body: JSON.stringify(p.body),
    });
    console.log("CLIENT_CREATE", r.status, r.text.slice(0, 240));
    const id = r.body?.client_id || r.body?.clientId || r.body?.name;
    const secret = r.body?.client_secret || r.body?.clientSecret || r.body?.secret;
    if (r.ok && id && secret) {
      return { clientId: String(id).split("/").pop(), clientSecret: secret };
    }
    // sometimes secret nested
    if (r.ok && r.body) {
      const nestedSecret =
        r.body.clientSecret ||
        r.body.secretValue ||
        r.body?.credentials?.clientSecret;
      const nestedId = r.body.clientId || r.body.client_id;
      if (nestedId && nestedSecret) {
        return { clientId: nestedId, clientSecret: nestedSecret };
      }
    }
  }

  // List existing clients
  for (const parent of parents) {
    const urls = [
      `https://clientauthconfig.googleapis.com/v1/clients?parent=${encodeURIComponent(parent)}`,
      `https://oauthconfig.googleapis.com/v1/${parent}/oauthClients`,
    ];
    for (const url of urls) {
      const r = await api(url, t);
      console.log("CLIENT_LIST", url.slice(-40), r.status, r.text.slice(0, 200));
    }
  }

  return null;
}

async function configureSupabase(clientId, clientSecret) {
  const t = supabaseToken();
  const url = `https://api.supabase.com/v1/projects/${SUPABASE_REF}/config/auth`;
  const currentRes = await api(url, t);
  if (!currentRes.ok) {
    throw new Error(`Supabase GET failed: ${currentRes.status} ${currentRes.text}`);
  }
  const current = currentRes.body;
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

  const patch = await api(url, t, {
    method: "PATCH",
    body: JSON.stringify({
      EXTERNAL_GOOGLE_ENABLED: true,
      EXTERNAL_GOOGLE_CLIENT_ID: clientId,
      EXTERNAL_GOOGLE_SECRET: clientSecret,
      SITE_URL: "https://www.awurabeauty.com",
      URI_ALLOW_LIST: [...redirects].join(","),
    }),
  });
  if (!patch.ok) {
    throw new Error(`Supabase PATCH failed: ${patch.status} ${patch.text}`);
  }
  console.log("SUPABASE_GOOGLE_ENABLED");
}

async function main() {
  run("gcloud", ["config", "set", "project", GCP_PROJECT]);
  run("gcloud", [
    "services",
    "enable",
    "identitytoolkit.googleapis.com",
    "iap.googleapis.com",
    "people.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "--project",
    GCP_PROJECT,
  ]);

  const t = token();
  await tryInitAuth(t);
  const creds = await createWebOauthClient(t);
  if (!creds) {
    console.log("OPEN_CONSOLE");
    console.log(
      "https://console.cloud.google.com/auth/clients/create?project=" + GCP_PROJECT,
    );
    console.log("Redirect URI:", CALLBACK);
    throw new Error(
      "Création OAuth auto impossible. Crée un client Web dans la console (lien ci-dessus), puis: node scripts/configure-supabase-google.mjs --client-id=... --client-secret=...",
    );
  }

  const outDir = join(process.cwd(), ".local");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "google-oauth.json"), JSON.stringify({ ...creds, redirectUri: CALLBACK }, null, 2));
  await configureSupabase(creds.clientId, creds.clientSecret);
  console.log("DONE", creds.clientId);
}

main().catch((e) => {
  console.error("SETUP_FAILED", e.message);
  process.exit(1);
});
