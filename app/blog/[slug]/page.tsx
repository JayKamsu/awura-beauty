import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { PostArticle } from "@/features/blog/components/post-article";
import {
  getBlogPostBySlug,
  listBlogSlugs,
} from "@/lib/infrastructure/supabase";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

/** Génère statiquement les slugs de tous les articles de blog pour le pré-rendu. */
export async function generateStaticParams() {
  const slugs = await listBlogSlugs("article");
  return slugs.map((slug) => ({ slug }));
}

/** Construit les métadonnées SEO de l'article à partir de son slug, avec fallback si introuvable. */
export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post || post.kind !== "article") {
    return buildPageMetadata({ path: "/blog", noIndex: true });
  }
  return buildPageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    image: post.cover_image_url,
    type: "article",
  });
}

/** Page d'un article de blog : affiche l'article avec son JSON-LD (article + fil d'Ariane) ou 404 si introuvable. */
export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post || post.kind !== "article") notFound();

  return (
    <>
      <JsonLd data={articleJsonLd(post)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Accueil", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ])}
      />
      <PostArticle post={post} backHref="/blog" />
    </>
  );
}
