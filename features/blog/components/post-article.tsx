"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { RichContent } from "@/features/blog/components/rich-content";
import { RelatedProductCta } from "@/features/blog/components/related-product-cta";
import { toIntlLocale } from "@/lib/i18n/intl-locale";
import type { BlogPost } from "@/lib/infrastructure/supabase/blog-types";
import type { ProductRow } from "@/lib/infrastructure/supabase/types";
import Image from "next/image";

type PostArticleProps = {
  post: BlogPost;
  relatedProduct?: ProductRow | null;
  backHref: "/blog" | "/tutoriels";
};

/** Affiche un article de blog ou tutoriel complet, avec image de couverture et produit associé optionnel. */
export function PostArticle({
  post,
  relatedProduct,
  backHref,
}: PostArticleProps) {
  const { t, i18n } = useTranslation();
  const dateLabel = new Intl.DateTimeFormat(toIntlLocale(i18n.language), {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(post.published_at));

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-14 md:px-6">
      <div className="space-y-4">
        <Link
          href={backHref}
          className="text-sm text-accent transition hover:text-accent-light"
        >
          ← {t(backHref === "/tutoriels" ? "blog.backTutorials" : "blog.backBlog")}
        </Link>
        <p className="text-sm uppercase tracking-wide text-muted">
          {post.kind === "tutorial"
            ? t("blog.badgeTutorial")
            : t("blog.badgeArticle")}{" "}
          · <time dateTime={post.published_at}>{dateLabel}</time>
        </p>
        <h1 className="font-serif text-4xl text-primary sm:text-5xl">
          {post.title}
        </h1>
        <p className="text-lg leading-relaxed text-muted">{post.excerpt}</p>
      </div>

      <div className="relative aspect-[16/10] overflow-hidden rounded-[2rem] bg-background-alt">
        <Image
          src={post.cover_image_url}
          alt={post.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 768px"
          priority
        />
      </div>

      <RichContent blocks={post.content} />

      {relatedProduct ? <RelatedProductCta product={relatedProduct} /> : null}
    </article>
  );
}
