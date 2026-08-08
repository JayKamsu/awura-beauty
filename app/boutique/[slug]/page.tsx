import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { ProductDetails } from "@/features/shop/components/product-details";
import { ProductGallery } from "@/features/shop/components/product-gallery";
import { ProductPurchasePanel } from "@/features/shop/components/product-purchase-panel";
import { RelatedProducts } from "@/features/shop/components/related-products";
import {
  getProductBySlug,
  getRelatedProducts,
  listAllProductSlugs,
} from "@/lib/infrastructure/supabase";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await listAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

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

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const related = await getRelatedProducts(product, 4);

  const gallery = [
    {
      src: product.image_url,
      alt: product.name,
      labelKey: "shop.galleryProduct" as const,
    },
    product.ingredients_image_url
      ? {
          src: product.ingredients_image_url,
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
  ].filter(Boolean) as Array<{
    src: string;
    alt: string;
    labelKey: "shop.galleryProduct" | "shop.galleryIngredients" | "shop.galleryLifestyle";
  }>;

  return (
    <main
      className="flex w-full flex-1 flex-col"
      data-awura-universe={product.universe === "child" ? "child" : undefined}
    >
      <JsonLd data={productJsonLd(product)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Accueil", path: "/" },
          { name: "Boutique", path: "/boutique" },
          { name: product.name, path: `/boutique/${product.slug}` },
        ])}
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
          <ProductGallery images={gallery} />
          <ProductPurchasePanel product={product} />
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 pb-10 md:px-6 md:pb-14">
        <ProductDetails product={product} />
      </div>

      <div className="border-t border-border bg-background">
        <div className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-16">
          <RelatedProducts products={related} />
        </div>
      </div>
    </main>
  );
}
