import { createSupabaseClient } from "@/lib/infrastructure/supabase/client";
import { FALLBACK_POSTS } from "@/lib/infrastructure/supabase/fallback-posts";
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

function sortByDateDesc(posts: BlogPost[]) {
  return [...posts].sort(
    (a, b) =>
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
  );
}

/** Liste les articles publics (filtrables par type) ; retombe sur les posts de secours si Supabase est vide/indisponible. */
export async function listBlogPosts(
  kind?: BlogPostKind,
): Promise<{ posts: BlogPost[]; source: "supabase" | "fallback" }> {
  const supabase = createSupabaseClient();

  if (supabase) {
    let query = supabase
      .from("blog_posts")
      .select("*")
      .order("published_at", { ascending: false });

    if (kind) query = query.eq("kind", kind);

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      return {
        posts: data.map((row) => mapPost(row as Record<string, unknown>)),
        source: "supabase",
      };
    }
  }

  const posts = kind
    ? FALLBACK_POSTS.filter((post) => post.kind === kind)
    : FALLBACK_POSTS;

  return { posts: sortByDateDesc(posts), source: "fallback" };
}

/** Récupère un article public par son slug, avec repli sur les posts de secours si absent de Supabase. */
export async function getBlogPostBySlug(
  slug: string,
): Promise<BlogPost | null> {
  const supabase = createSupabaseClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (!error && data) {
      return mapPost(data as Record<string, unknown>);
    }
  }

  return FALLBACK_POSTS.find((post) => post.slug === slug) ?? null;
}

/** Slugs de tous les articles publics (ex. pour generateStaticParams). */
export async function listBlogSlugs(kind?: BlogPostKind): Promise<string[]> {
  const { posts } = await listBlogPosts(kind);
  return posts.map((post) => post.slug);
}
