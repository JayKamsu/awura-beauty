"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { PostCard } from "@/features/blog/components/post-card";
import type { BlogPost } from "@/lib/infrastructure/supabase/blog-types";

type PostListProps = {
  posts: BlogPost[];
  basePath: "/blog" | "/tutoriels";
  emptyKey: string;
};

export function PostList({ posts, basePath, emptyKey }: PostListProps) {
  const { t } = useTranslation();

  if (posts.length === 0) {
    return <p className="py-16 text-center text-muted">{t(emptyKey)}</p>;
  }

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} basePath={basePath} />
      ))}
    </div>
  );
}

type BlogNavTabsProps = {
  active: "articles" | "tutorials";
};

export function BlogNavTabs({ active }: BlogNavTabsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/blog"
        className={`rounded-full px-4 py-2 text-sm transition ${
          active === "articles"
            ? "bg-primary text-background"
            : "border border-border text-muted hover:border-accent hover:text-foreground"
        }`}
      >
        {t("blog.tabs.articles")}
      </Link>
      <Link
        href="/tutoriels"
        className={`rounded-full px-4 py-2 text-sm transition ${
          active === "tutorials"
            ? "bg-primary text-background"
            : "border border-border text-muted hover:border-accent hover:text-foreground"
        }`}
      >
        {t("blog.tabs.tutorials")}
      </Link>
    </div>
  );
}
