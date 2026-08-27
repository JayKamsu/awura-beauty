"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ProductRail } from "@/components/ui/product-rail";
import {
  cmsOr,
  usePageCmsFields,
} from "@/features/cms/context/page-cms-context";
import { toProductCardData } from "@/features/shop/utils/map-product";
import { CATALOG_SYNC_CHANNEL } from "@/lib/application/catalog-sync";
import type { ProductRow } from "@/lib/infrastructure/supabase/types";

const HOME_PRODUCT_COUNT = 5;

/** Charge les produits du catalogue public pour la grille d'accueil. */
async function fetchHomeProducts(): Promise<ProductRow[]> {
  const res = await fetch(`/api/catalog/products?pageSize=24`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { products?: ProductRow[] };
  const products = json.products ?? [];
  const featured = [
    ...products.filter((product) => product.is_new),
    ...products.filter((product) => !product.is_new),
  ];
  return featured.slice(0, HOME_PRODUCT_COUNT);
}

/** Section « meilleures ventes » de la page d'accueil : grille des produits du catalogue (admin). */
export function BestsellersSection() {
  const { t } = useTranslation();
  const cms = usePageCmsFields("bestsellers");
  const [products, setProducts] = useState<ProductRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      void fetchHomeProducts().then((rows) => {
        if (!cancelled) setProducts(rows);
      });
    };

    load();

    const broadcast =
      typeof BroadcastChannel === "undefined"
        ? null
        : new BroadcastChannel(CATALOG_SYNC_CHANNEL);
    if (broadcast) broadcast.onmessage = load;

    return () => {
      cancelled = true;
      broadcast?.close();
    };
  }, []);

  return (
    <section className="bg-background">
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-16 md:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl space-y-3">
            <h2 className="font-serif text-3xl text-primary sm:text-4xl">
              {cmsOr(cms, "title", t("home.bestsellers.title"))}
            </h2>
            <p className="text-muted">
              {cmsOr(cms, "subtitle", t("home.bestsellers.subtitle"))}
            </p>
          </div>
          <Button href="/boutique" variant="primary-outline" size="md">
            {cmsOr(cms, "cta_label", t("home.bestsellers.seeAll"))}
          </Button>
        </div>

        {products.length === 0 ? (
          <p className="text-muted">{t("home.bestsellers.empty")}</p>
        ) : (
          <ProductRail
            products={products.map(toProductCardData)}
            label={t("shop.productsRail")}
          />
        )}
      </div>
    </section>
  );
}
