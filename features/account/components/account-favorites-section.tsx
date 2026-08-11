"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ui/product-card";
import {
  AccountSection,
  accountPanelClass,
} from "@/features/account/components/account-section";
import { useAuth } from "@/features/auth/context/auth-provider";
import { toProductCardData } from "@/features/shop/utils/map-product";
import type { ProductRow } from "@/lib/infrastructure/supabase/types";

/** Section Mon compte listant les produits que le client a mis en favoris. */
export function AccountFavoritesSection() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      if (!session?.access_token) {
        if (mounted) {
          setProducts([]);
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      const res = await fetch("/api/account/favorites/products", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!mounted) return;
      if (res.ok) {
        const json = (await res.json()) as { products?: ProductRow[] };
        setProducts(json.products ?? []);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [session?.access_token]);

  return (
    <AccountSection
      id="favoris"
      title={t("account.favoritesTitle")}
      action={
        <Button href="/boutique" variant="primary-outline" size="md">
          {t("account.favoritesBrowse")}
        </Button>
      }
    >
      {loading ? (
        <p className="text-muted">{t("account.favoritesLoading")}</p>
      ) : products.length === 0 ? (
        <div className={`${accountPanelClass} p-8 text-center`}>
          <p className="text-muted">{t("account.favoritesEmpty")}</p>
          <Button href="/boutique" className="mt-4">
            {t("account.favoritesBrowse")}
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={toProductCardData(product)} />
          ))}
        </div>
      )}
    </AccountSection>
  );
}
