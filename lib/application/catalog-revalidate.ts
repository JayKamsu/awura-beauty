import { revalidatePath } from "next/cache";

/** Invalide le cache des pages catalogue (boutique, fiche, recherche). */
export function revalidateCatalog(slug?: string | null) {
  revalidatePath("/boutique", "layout");
  revalidatePath("/recherche");
  revalidatePath("/");
  if (slug) revalidatePath(`/boutique/${slug}`);
}
