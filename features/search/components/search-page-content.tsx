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
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 pb-6 pt-4 sm:gap-10 sm:py-10 md:px-6 md:py-14">
      <header className="space-y-3 sm:mx-auto sm:max-w-2xl sm:space-y-4 sm:text-center">
        <div className="space-y-1 sm:space-y-2">
          <h1 className="font-serif text-2xl text-primary sm:text-4xl md:text-5xl">
            {t("search.title")}
          </h1>
          <p className="text-sm text-muted sm:text-base">{t("search.subtitle")}</p>
        </div>
        <SearchForm initialQuery={query} autoFocus={!hasQuery} />
      </header>

      {!hasQuery ? (
        <p className="py-8 text-center text-sm text-muted sm:py-10 sm:text-base">
          {t("search.idle")}
        </p>
      ) : total === 0 ? (
        <p className="py-8 text-center text-sm text-muted sm:py-10 sm:text-base">
          {t("search.empty", { query })}
        </p>
      ) : (
        <div className="space-y-8 sm:space-y-12">
          <p className="text-sm text-muted">
            {t("search.resultsCount", { count: total })}
          </p>

          {products.length > 0 ? (
            <section className="space-y-4 sm:space-y-6" aria-labelledby="search-products">
              <h2
                id="search-products"
                className="font-serif text-2xl text-primary sm:text-3xl"
              >
                {t("search.productsHeading")}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          ) : null}

          {posts.length > 0 ? (
            <section className="space-y-4 sm:space-y-6" aria-labelledby="search-posts">
              <h2
                id="search-posts"
                className="font-serif text-2xl text-primary sm:text-3xl"
              >
                {t("search.postsHeading")}
              </h2>
              <ul className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                        <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
                          <h3 className="font-serif text-lg text-primary sm:text-xl">
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
