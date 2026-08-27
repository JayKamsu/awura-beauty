import { revalidatePath } from "next/cache";

/** Invalide le cache des pages catalogue (accueil, boutique, fiche, recherche). */
export function revalidateCatalog(slug?: string | null) {
  revalidatePath("/", "layout");
  revalidatePath("/boutique", "layout");
  revalidatePath("/boutique", "page");
  revalidatePath("/recherche", "layout");
  if (slug) {
    revalidatePath(`/boutique/${slug}`, "layout");
    revalidatePath(`/boutique/${slug}`, "page");
  }
}
