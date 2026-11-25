import { HomePage } from "@/features/home/components/home-page";
import { heroAvatarSources } from "@/features/home/lib/hero-avatars";
import { CATALOG, HOME_IMAGES } from "@/features/home/data/content";
import { resolveIngredientsImageUrl } from "@/features/shop/utils/map-product";
import { listPublicTestimonialFeed } from "@/lib/application/testimonials/list-public-testimonials";
import { catalogPort, container } from "@/lib/application/container";

/** Recalcule l'accueil à chaque visite pour afficher les photos du catalogue, pas les visuels de secours. */
export const dynamic = "force-dynamic";

/** Page d'accueil : sections CMS et photos produit déjà résolues dans le HTML. */
export default async function Page() {
  const ingredientSlugs = CATALOG.map((product) => product.id);
  const [layout, bestsellers, testimonials, ingredientRows] = await Promise.all([
    container.pages.getPageLayout("home", "fr"),
    catalogPort.listHomeBestsellers(),
    listPublicTestimonialFeed(12, ["site"]),
    catalogPort.getProductsBySlugs(ingredientSlugs),
  ]);

  const ingredientImages = CATALOG.map((product) => {
    const row = ingredientRows.find((item) => item.slug === product.id);
    const live = row ? resolveIngredientsImageUrl(row) : null;
    return { id: product.id, image: live || product.ingredientImage };
  });

  return (
    <HomePage
      initialSections={layout.sections}
      initialBestsellers={bestsellers}
      initialAvatars={heroAvatarSources(testimonials, HOME_IMAGES.avatars)}
      ingredientImages={ingredientImages}
      careProducts={ingredientRows}
    />
  );
}
