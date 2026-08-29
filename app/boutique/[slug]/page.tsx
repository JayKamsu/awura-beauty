import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { ProductDetails } from "@/features/shop/components/product-details";
import { ProductShowcase } from "@/features/shop/components/product-purchase-panel";
import { type GalleryImage } from "@/features/shop/components/product-gallery";
import { RelatedProducts } from "@/features/shop/components/related-products";
import { ProductReviewsSection } from "@/features/reviews/components/product-reviews";
import { resolveIngredientsImageUrl } from "@/features/shop/utils/map-product";
import {
  getBundleComponents,
  getProductBySlug,
  getRelatedProducts,
  getTutorialForProduct,
} from "@/lib/infrastructure/supabase";
import { getProductReviewSummary } from "@/lib/infrastructure/supabase/order-reviews";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";

/** Recalcule la fiche à chaque requête pour afficher les modifications admin tout de suite. */
export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ couleur?: string | string[] }>;
};

/** Construit les métadonnées SEO du produit à partir de son slug, avec fallback si introuvable. */
export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return buildPageMetadata({ path: "/boutique", noIndex: true });

  return buildPageMetadata({
    title: product.name,
    description: product.short_description || product.description,
    path: `/boutique/${product.slug}`,
    image: product.image_url,
  });
}

/**
 * Page produit : galerie, panneau d'achat (note + avis), détails, avis clientes
 * et produits liés, avec JSON-LD produit et fil d'Ariane.
 */
export default async function ProductPage({
  params,
  searchParams,
}: ProductPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const [related, tutorial, bundleComponents, reviewSummary] = await Promise.all([
    getRelatedProducts(product, 4),
    getTutorialForProduct(product.slug),
    product.is_bundle ? getBundleComponents(product.id) : Promise.resolve([]),
    getProductReviewSummary(product.id),
  ]);

  const ingredientsImage = resolveIngredientsImageUrl(product);
  const gallery = [
    {
      src: product.image_url,
      alt: product.name,
      labelKey: "shop.galleryProduct" as const,
    },
    ingredientsImage
      ? {
          src: ingredientsImage,
          alt: `${product.name} — ingredients`,
          labelKey: "shop.galleryIngredients" as const,
        }
      : null,
    product.lifestyle_image_url
      ? {
          src: product.lifestyle_image_url,
          alt: `${product.name} — lifestyle`,
          labelKey: "shop.galleryLifestyle" as const,
        }
      : null,
  ].filter(Boolean) as GalleryImage[];

  return (
    <main
      className="flex w-full flex-1 flex-col"
      data-awura-universe={product.universe === "child" ? "child" : undefined}
    >
      <JsonLd data={productJsonLd(product, reviewSummary)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Accueil", path: "/" },
          { name: "Boutique", path: "/boutique" },
          { name: product.name, path: `/boutique/${product.slug}` },
        ])}
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <ProductShowcase
          product={product}
          images={gallery}
          initialColor={
            Array.isArray(query.couleur) ? query.couleur[0] : query.couleur
          }
          reviewSummary={reviewSummary}
        />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 pb-10 md:px-6 md:pb-14">
        <ProductDetails
          product={product}
          tutorialSlug={tutorial?.slug ?? null}
          bundleComponents={bundleComponents}
        />
        {reviewSummary.count > 0 ? (
          <div className="mt-12 border-t border-border pt-12">
            <ProductReviewsSection summary={reviewSummary} />
          </div>
        ) : null}
      </div>

      <div className="border-t border-border bg-background">
        <div className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-16">
          <RelatedProducts products={related} />
        </div>
      </div>
    </main>
  );
}
