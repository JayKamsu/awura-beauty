import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { PostArticle } from "@/features/blog/components/post-article";
import {
  getBlogPostBySlug,
  getProductBySlug,
  listBlogSlugs,
} from "@/lib/infrastructure/supabase";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";

type TutorialPageProps = {
  params: Promise<{ slug: string }>;
};

/** Pré-génère les slugs statiques de tous les tutoriels au build. */
export async function generateStaticParams() {
  const slugs = await listBlogSlugs("tutorial");
  return slugs.map((slug) => ({ slug }));
}

/** Construit les métadonnées SEO du tutoriel à partir de son slug, ou un fallback non indexé si introuvable. */
export async function generateMetadata({
  params,
}: TutorialPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post || post.kind !== "tutorial") {
    return buildPageMetadata({ path: "/tutoriels", noIndex: true });
  }
  return buildPageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/tutoriels/${post.slug}`,
    image: post.cover_image_url,
    type: "article",
  });
}

/** Page d'un tutoriel : affiche l'article et son produit associé, ou 404 si introuvable. */
export default async function TutorialPage({ params }: TutorialPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post || post.kind !== "tutorial") notFound();

  const relatedProduct = post.product_slug
    ? await getProductBySlug(post.product_slug)
    : null;

  return (
    <>
      <JsonLd data={articleJsonLd(post)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Accueil", path: "/" },
          { name: "Tutoriels", path: "/tutoriels" },
          { name: post.title, path: `/tutoriels/${post.slug}` },
        ])}
      />
      <PostArticle
        post={post}
        relatedProduct={relatedProduct}
        backHref="/tutoriels"
      />
    </>
  );
}
