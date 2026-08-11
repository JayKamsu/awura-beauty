import { createAdminSupabaseClient } from "@/lib/infrastructure/supabase/client";

const BUCKET = "media";
const LABEL_BUCKET = "shipping-labels";
const MAX_BYTES = 5 * 1024 * 1024;
/** Durée de vie d'une URL signée d'étiquette (secondes) — assez pour ouvrir/imprimer, jamais permanent. */
const LABEL_SIGNED_URL_TTL_SECONDS = 5 * 60;

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const LABEL_MIME: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/png": ".png",
  "image/jpeg": ".jpg",
};

/** Dossiers autorisés dans le bucket media public. */
export type StorageFolder =
  | "products"
  | "blog"
  | "pages"
  | "uploads"
  | "labels"
  | "brand";

function publicObjectUrl(path: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return null;
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`;
}

/** Assure l’existence du bucket public `media` (idempotent). */
export async function ensureMediaBucket(): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return { ok: false, error: "Supabase admin client unavailable" };
  }

  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) return { ok: false, error: listError.message };

  const exists = buckets?.some((b) => b.name === BUCKET);
  if (exists) return { ok: true };

  const { error: createError } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: [
      ...Object.keys(ALLOWED_MIME),
      ...Object.keys(LABEL_MIME),
    ],
  });

  if (createError && !/already exists/i.test(createError.message)) {
    return { ok: false, error: createError.message };
  }

  return { ok: true };
}

/** Upload une image publique (JPEG/PNG/WebP/GIF, max 5 Mo) dans le bucket media, sous un nom aléatoire. */
export async function uploadPublicImage(
  file: File,
  folder: StorageFolder = "uploads",
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return {
      url: null,
      error:
        process.env.NODE_ENV === "production"
          ? "SUPABASE_SERVICE_ROLE_KEY is required in production"
          : "Supabase is not configured",
    };
  }

  if (file.size <= 0 || file.size > MAX_BYTES) {
    return { url: null, error: "File must be between 1 byte and 5 MB" };
  }

  const mime = file.type.toLowerCase();
  const ext = ALLOWED_MIME[mime];
  if (!ext) {
    return { url: null, error: "Only JPEG, PNG, WebP and GIF images are allowed" };
  }

  const ensured = await ensureMediaBucket();
  if (!ensured.ok) {
    return { url: null, error: ensured.error ?? "Unable to ensure media bucket" };
  }

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const path = `${folder}/${filename}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: mime,
    upsert: false,
  });

  if (error) {
    return { url: null, error: error.message };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const url = data.publicUrl || publicObjectUrl(path);
  if (!url) return { url: null, error: "Unable to build public URL" };

  return { url, error: null };
}

/** Assure l’existence du bucket privé `shipping-labels` (idempotent) — jamais public, accès uniquement via URL signée. */
export async function ensureLabelBucket(): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return { ok: false, error: "Supabase admin client unavailable" };
  }

  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) return { ok: false, error: listError.message };

  const exists = buckets?.some((b) => b.name === LABEL_BUCKET);
  if (exists) return { ok: true };

  const { error: createError } = await supabase.storage.createBucket(LABEL_BUCKET, {
    public: false,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: Object.keys(LABEL_MIME),
  });

  if (createError && !/already exists/i.test(createError.message)) {
    return { ok: false, error: createError.message };
  }

  return { ok: true };
}

/**
 * Upload une étiquette d'expédition (PDF/PNG) dans le bucket privé.
 * Retourne le chemin de stockage — jamais d'URL publique ; utiliser
 * `getSignedLabelUrl` pour un accès temporaire (aperçu/impression).
 */
export async function uploadShippingLabel(input: {
  orderId: string;
  bytes: Buffer;
  contentType: "application/pdf" | "image/png" | "image/jpeg";
}): Promise<{ path: string | null; error: string | null }> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return { path: null, error: "Supabase is not configured" };
  }

  const ext = LABEL_MIME[input.contentType];
  if (!ext) {
    return { path: null, error: "Unsupported label type" };
  }

  if (input.bytes.length <= 0 || input.bytes.length > MAX_BYTES) {
    return { path: null, error: "Label file too large" };
  }

  const ensured = await ensureLabelBucket();
  if (!ensured.ok) {
    return { path: null, error: ensured.error ?? "Unable to ensure label bucket" };
  }

  const safeId = input.orderId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 36);
  const path = `${safeId}-${Date.now()}${ext}`;

  const { error } = await supabase.storage
    .from(LABEL_BUCKET)
    .upload(path, input.bytes, {
      contentType: input.contentType,
      upsert: true,
    });

  if (error) {
    return { path: null, error: error.message };
  }

  return { path, error: null };
}

/**
 * URL signée temporaire (5 min) vers une étiquette privée — à générer à la
 * demande (ouverture/impression), jamais stockée telle quelle en base.
 */
export async function getSignedLabelUrl(
  path: string,
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return { url: null, error: "Supabase is not configured" };
  }

  const { data, error } = await supabase.storage
    .from(LABEL_BUCKET)
    .createSignedUrl(path, LABEL_SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    return { url: null, error: error?.message ?? "Unable to sign label URL" };
  }

  return { url: data.signedUrl, error: null };
}
