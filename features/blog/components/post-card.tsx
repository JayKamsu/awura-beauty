"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { toIntlLocale } from "@/lib/i18n/intl-locale";
import type { BlogPost } from "@/lib/infrastructure/supabase/blog-types";

type PostCardProps = {
  post: BlogPost;
  basePath?: "/blog" | "/tutoriels";
};

/** Carte cliquable présentant un aperçu d'un article ou tutoriel dans une liste. */
export function PostCard({ post, basePath }: PostCardProps) {
  const { t, i18n } = useTranslation();
  const hrefBase =
    basePath ?? (post.kind === "tutorial" ? "/tutoriels" : "/blog");
  const dateLabel = new Intl.DateTimeFormat(toIntlLocale(i18n.language), {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(post.published_at));

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl bg-background-alt/70">
      <Link
        href={`${hrefBase}/${post.slug}`}
        className="relative aspect-[16/10] overflow-hidden bg-background-alt"
      >
        <Image
          src={post.cover_image_url}
          alt={post.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted">
          <span>
            {post.kind === "tutorial"
              ? t("blog.badgeTutorial")
              : t("blog.badgeArticle")}
          </span>
          <time dateTime={post.published_at}>{dateLabel}</time>
        </div>
        <h2 className="font-serif text-2xl text-primary">
          <Link
            href={`${hrefBase}/${post.slug}`}
            className="transition hover:text-accent"
          >
            {post.title}
          </Link>
        </h2>
        <p className="text-sm leading-relaxed text-muted">{post.excerpt}</p>
        <Link
          href={`${hrefBase}/${post.slug}`}
          className="mt-auto pt-2 text-sm font-medium uppercase tracking-wide text-accent transition hover:text-accent-light"
        >
          {t("blog.readMore")}
        </Link>
      </div>
    </article>
  );
}
