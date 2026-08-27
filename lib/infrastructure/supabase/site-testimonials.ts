import { createHash, randomBytes } from "crypto";
import {
  TESTIMONIAL_INVITE_TTL_DAYS,
  type SiteTestimonialRow,
  type TestimonialInviteRow,
} from "@/lib/domain/testimonial";
import {
  createAdminSupabaseClient,
  createSupabaseClient,
} from "@/lib/infrastructure/supabase/client";

/** Génère un jeton d'invitation et son hash de stockage. */
export function createInviteToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashInviteToken(token) };
}

/** Hash SHA-256 d'un jeton d'invitation (stocké en base, jamais le jeton brut). */
export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token.trim()).digest("hex");
}

function inviteExpiresAt(now = new Date()): Date {
  const expires = new Date(now);
  expires.setUTCDate(expires.getUTCDate() + TESTIMONIAL_INVITE_TTL_DAYS);
  return expires;
}

function mapSite(row: Record<string, unknown>): SiteTestimonialRow {
  return {
    id: String(row.id),
    authorName: String(row.author_name ?? ""),
    quote: String(row.quote ?? ""),
    rating: Number(row.rating ?? 0),
    imageUrl: String(row.image_url ?? ""),
    published: Boolean(row.published),
    source: row.source === "admin" ? "admin" : "invite",
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapInvite(row: Record<string, unknown>): TestimonialInviteRow {
  return {
    id: String(row.id),
    note: String(row.note ?? ""),
    expiresAt: String(row.expires_at ?? ""),
    usedAt: row.used_at ? String(row.used_at) : null,
    testimonialId: row.testimonial_id ? String(row.testimonial_id) : null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

/** Témoignages site publiés, les plus récents d'abord. */
export async function listPublishedSiteTestimonials(
  limit = 100,
): Promise<SiteTestimonialRow[]> {
  const supabase = createSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("site_testimonials")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((row) => mapSite(row as Record<string, unknown>));
}

/** Tous les témoignages site (admin, service_role). */
export async function adminListSiteTestimonials(): Promise<SiteTestimonialRow[]> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("site_testimonials")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => mapSite(row as Record<string, unknown>));
}

/** Crée un témoignage site (admin ou invitation validée). */
export async function insertSiteTestimonial(input: {
  authorName: string;
  quote: string;
  rating: number;
  imageUrl?: string;
  published?: boolean;
  source: "invite" | "admin";
}): Promise<SiteTestimonialRow | null> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("site_testimonials")
    .insert({
      author_name: input.authorName,
      quote: input.quote,
      rating: input.rating,
      image_url: input.imageUrl ?? "",
      published: input.published ?? true,
      source: input.source,
    })
    .select("*")
    .maybeSingle();
  if (error || !data) return null;
  return mapSite(data as Record<string, unknown>);
}

/** Met à jour un témoignage site (texte, image, publication). */
export async function updateSiteTestimonial(
  id: string,
  patch: Partial<{
    authorName: string;
    quote: string;
    rating: number;
    imageUrl: string;
    published: boolean;
  }>,
): Promise<SiteTestimonialRow | null> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return null;
  const payload: Record<string, unknown> = {};
  if (patch.authorName !== undefined) payload.author_name = patch.authorName;
  if (patch.quote !== undefined) payload.quote = patch.quote;
  if (patch.rating !== undefined) payload.rating = patch.rating;
  if (patch.imageUrl !== undefined) payload.image_url = patch.imageUrl;
  if (patch.published !== undefined) payload.published = patch.published;
  const { data, error } = await supabase
    .from("site_testimonials")
    .update(payload)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error || !data) return null;
  return mapSite(data as Record<string, unknown>);
}

/** Supprime un témoignage site. */
export async function deleteSiteTestimonial(id: string): Promise<boolean> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return false;
  const { error } = await supabase.from("site_testimonials").delete().eq("id", id);
  return !error;
}

/** Liste les invitations (admin). */
export async function adminListInvites(): Promise<TestimonialInviteRow[]> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("testimonial_invites")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return data.map((row) => mapInvite(row as Record<string, unknown>));
}

/** Enregistre une invitation (hash du jeton uniquement). */
export async function insertTestimonialInvite(input: {
  tokenHash: string;
  note: string;
}): Promise<TestimonialInviteRow | null> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("testimonial_invites")
    .insert({
      token_hash: input.tokenHash,
      note: input.note,
      expires_at: inviteExpiresAt().toISOString(),
    })
    .select("*")
    .maybeSingle();
  if (error || !data) return null;
  return mapInvite(data as Record<string, unknown>);
}

/** Invitation encore utilisable pour ce jeton, ou null. */
export async function findValidInvite(
  token: string,
): Promise<TestimonialInviteRow | null> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return null;
  const tokenHash = hashInviteToken(token);
  const { data, error } = await supabase
    .from("testimonial_invites")
    .select("*")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (error || !data) return null;
  const invite = mapInvite(data as Record<string, unknown>);
  if (invite.usedAt) return null;
  if (new Date(invite.expiresAt).getTime() < Date.now()) return null;
  return invite;
}

/** Marque l'invitation comme utilisée et lie le témoignage créé. */
export async function consumeInvite(
  inviteId: string,
  testimonialId: string,
): Promise<boolean> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) return false;
  const { data, error } = await supabase
    .from("testimonial_invites")
    .update({
      used_at: new Date().toISOString(),
      testimonial_id: testimonialId,
    })
    .eq("id", inviteId)
    .is("used_at", null)
    .select("id")
    .maybeSingle();
  return Boolean(!error && data);
}
