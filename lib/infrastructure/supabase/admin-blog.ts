import { createAdminSupabaseClient } from "@/lib/infrastructure/supabase/client";
import {
  getDemoPosts,
  setDemoPosts,
} from "@/lib/infrastructure/supabase/admin-store";
import type {
  BlogContentBlock,
  BlogPost,
  BlogPostKind,
} from "@/lib/infrastructure/supabase/blog-types";

function mapPost(row: Record<string, unknown>): BlogPost {
  return {
    id: String(row.id),
    slug: String(row.slug),
    kind: (row.kind as BlogPostKind) ?? "article",
    title: String(row.title ?? ""),
    excerpt: String(row.excerpt ?? ""),
    cover_image_url: String(row.cover_image_url ?? ""),
    published_at: String(row.published_at ?? ""),
    product_slug: row.product_slug ? String(row.product_slug) : null,
    content: (row.content as BlogContentBlock[]) ?? [],
  };
}

export type BlogPostInput = Omit<BlogPost, "id"> & { id?: string };

export async function adminListPosts(): Promise<BlogPost[]> {
  const supabase = createAdminSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("published_at", { ascending: false });
    if (!error && data) {
      return data.map((row) => mapPost(row as Record<string, unknown>));
    }
  }
  return getDemoPosts();
}

export async function adminUpsertPost(
  input: BlogPostInput,
): Promise<{ post: BlogPost | null; error: string | null }> {
  const supabase = createAdminSupabaseClient();
  const payload = {
    slug: input.slug,
    kind: input.kind,
    title: input.title,
    excerpt: input.excerpt,
    cover_image_url: input.cover_image_url,
    published_at: input.published_at,
    product_slug: input.product_slug,
    content: input.content,
  };

  if (supabase) {
    if (input.id) {
      const { data, error } = await supabase
        .from("blog_posts")
        .update(payload)
        .eq("id", input.id)
        .select("*")
        .maybeSingle();
      if (error || !data) {
        return { post: null, error: error?.message ?? "Update failed" };
      }
      return { post: mapPost(data as Record<string, unknown>), error: null };
    }

    const { data, error } = await supabase
      .from("blog_posts")
      .insert(payload)
      .select("*")
      .maybeSingle();
    if (error || !data) {
      return { post: null, error: error?.message ?? "Insert failed" };
    }
    return { post: mapPost(data as Record<string, unknown>), error: null };
  }

  const posts = [...getDemoPosts()];
  if (input.id) {
    const index = posts.findIndex((item) => item.id === input.id);
    if (index === -1) return { post: null, error: "Not found" };
    posts[index] = { ...posts[index], ...payload, id: input.id };
    setDemoPosts(posts);
    return { post: posts[index], error: null };
  }

  const created: BlogPost = { ...payload, id: crypto.randomUUID() };
  setDemoPosts([created, ...posts]);
  return { post: created, error: null };
}

export async function adminDeletePost(
  id: string,
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = createAdminSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    return { ok: !error, error: error?.message ?? null };
  }
  setDemoPosts(getDemoPosts().filter((post) => post.id !== id));
  return { ok: true, error: null };
}
