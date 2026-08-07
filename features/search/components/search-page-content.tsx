"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ProductCard, type ProductCardData } from "@/components/ui/product-card";
import type { BlogPost } from "@/lib/infrastructure/supabase/blog-types";
import { SearchForm } from "@/features/search/components/search-form";

type SearchPageContentProps = {
  query: string;
  products: ProductCardData[];
  posts: BlogPost[];
};

export function SearchPageContent({
  query,
  products,
  posts,
}: SearchPageContentProps) {
  const { t } = useTranslation();
  const hasQuery = query.trim().length > 0;
  const total = products.length + posts.length;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-4 py-14 md:px-6">
      <header className="mx-auto max-w-2xl space-y-4 text-center">
        <h1 className="font-serif text-4xl text-primary md:text-5xl">
          {t("search.title")}
        </h1>
        <p className="text-muted">{t("search.subtitle")}</p>
        <SearchForm initialQuery={query} />
      </header>

      {!hasQuery ? (
        <p className="py-10 text-center text-muted">{t("search.idle")}</p>
      ) : total === 0 ? (
        <p className="py-10 text-center text-muted">
          {t("search.empty", { query })}
        </p>
      ) : (
        <div className="space-y-12">
          <p className="text-sm text-muted">
            {t("search.resultsCount", { count: total })}
          </p>

          {products.length > 0 ? (
            <section className="space-y-6" aria-labelledby="search-products">
              <h2
                id="search-products"
                className="font-serif text-3xl text-primary"
              >
                {t("search.productsHeading")}
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          ) : null}

          {posts.length > 0 ? (
            <section className="space-y-6" aria-labelledby="search-posts">
              <h2 id="search-posts" className="font-serif text-3xl text-primary">
                {t("search.postsHeading")}
              </h2>
              <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => {
                  const href =
                    post.kind === "tutorial"
                      ? `/tutoriels/${post.slug}`
                      : `/blog/${post.slug}`;
                  return (
                    <li key={post.id}>
                      <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-background-alt/70">
                        <Link
                          href={href}
                          className="relative aspect-[16/10] overflow-hidden bg-background-alt"
                        >
                          <Image
                            src={post.cover_image_url}
                            alt={post.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                        </Link>
                        <div className="flex flex-1 flex-col gap-2 p-5">
                          <h3 className="font-serif text-xl text-primary">
                            <Link href={href} className="hover:text-accent">
                              {post.title}
                            </Link>
                          </h3>
                          <p className="line-clamp-2 text-sm text-muted">
                            {post.excerpt}
                          </p>
                          <Link
                            href={href}
                            className="mt-auto pt-2 text-sm font-medium uppercase tracking-wide text-accent hover:text-accent-light"
                          >
                            {t("search.viewPost")}
                          </Link>
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </main>
  );
}
