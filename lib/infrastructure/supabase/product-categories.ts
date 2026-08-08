import {
  createAdminSupabaseClient,
  createSupabaseClient,
} from "@/lib/infrastructure/supabase/client";
import { PRODUCT_CATEGORIES } from "@/lib/infrastructure/supabase/fallback-products";
import { getDemoProducts } from "@/lib/infrastructure/supabase/admin-store";

export type ProductCategory = {
  slug: string;
  label: string;
  label_en: string;
  label_es: string;
  position: number;
};

const FALLBACK_LABELS: Record<string, { fr: string; en: string; es: string }> = {
  hydratation: { fr: "Hydratation", en: "Hydration", es: "Hidratación" },
  demelage: { fr: "Démêlage", en: "Detangling", es: "Desenredado" },
  soin: { fr: "Soin", en: "Care", es: "Cuidado" },
  pousse: { fr: "Pousse", en: "Growth", es: "Crecimiento" },
  nettoyage: { fr: "Nettoyage", en: "Cleansing", es: "Limpieza" },
};

let demoCategories: ProductCategory[] = PRODUCT_CATEGORIES.map((slug, index) => {
  const labels = FALLBACK_LABELS[slug] ?? {
    fr: slug,
    en: slug,
    es: slug,
  };
  return {
    slug,
    label: labels.fr,
    label_en: labels.en,
    label_es: labels.es,
    position: (index + 1) * 10,
  };
});

function mapRow(row: Record<string, unknown>): ProductCategory {
  return {
    slug: String(row.slug ?? ""),
    label: String(row.label ?? row.slug ?? ""),
    label_en: String(row.label_en ?? ""),
    label_es: String(row.label_es ?? ""),
    position: Number(row.position ?? 0),
  };
}

export function categoryDisplayLabel(
  category: ProductCategory,
  language?: string,
): string {
  const lang = (language ?? "fr").slice(0, 2).toLowerCase();
  if (lang === "en" && category.label_en.trim()) return category.label_en;
  if (lang === "es" && category.label_es.trim()) return category.label_es;
  return category.label;
}

export async function listProductCategories(): Promise<ProductCategory[]> {
  const supabase = createSupabaseClient() ?? createAdminSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("product_categories")
      .select("slug,label,label_en,label_es,position")
      .order("position", { ascending: true });
    if (!error && data && data.length > 0) {
      return data.map((row) => mapRow(row as Record<string, unknown>));
    }
  }
  return [...demoCategories].sort((a, b) => a.position - b.position);
}

function slugify(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function adminCreateCategory(input: {
  label: string;
  slug?: string;
  label_en?: string;
  label_es?: string;
}): Promise<{ category?: ProductCategory; error?: string }> {
  const label = input.label.trim();
  if (!label) return { error: "label required" };
  const slug = (input.slug?.trim() ? slugify(input.slug) : slugify(label)) || "";
  if (!slug) return { error: "slug required" };

  const supabase = createAdminSupabaseClient();
  if (supabase) {
    const existing = await listProductCategories();
    const position =
      existing.reduce((max, item) => Math.max(max, item.position), 0) + 10;
    const payload = {
      slug,
      label,
      label_en: (input.label_en ?? label).trim(),
      label_es: (input.label_es ?? label).trim(),
      position,
    };
    const { data, error } = await supabase
      .from("product_categories")
      .insert(payload)
      .select("slug,label,label_en,label_es,position")
      .single();
    if (error || !data) {
      return { error: error?.message ?? "insert failed" };
    }
    return { category: mapRow(data as Record<string, unknown>) };
  }

  if (demoCategories.some((item) => item.slug === slug)) {
    return { error: "slug already exists" };
  }
  const position =
    demoCategories.reduce((max, item) => Math.max(max, item.position), 0) + 10;
  const category: ProductCategory = {
    slug,
    label,
    label_en: (input.label_en ?? label).trim(),
    label_es: (input.label_es ?? label).trim(),
    position,
  };
  demoCategories = [...demoCategories, category];
  return { category };
}

export async function adminDeleteCategory(
  slug: string,
): Promise<{ ok: boolean; error?: string }> {
  const cleaned = slug.trim();
  if (!cleaned) return { ok: false, error: "slug required" };

  const supabase = createAdminSupabaseClient();
  if (supabase) {
    const { count, error: countError } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category", cleaned);
    if (countError) return { ok: false, error: countError.message };
    if ((count ?? 0) > 0) {
      return { ok: false, error: "category_in_use" };
    }
    const { error } = await supabase
      .from("product_categories")
      .delete()
      .eq("slug", cleaned);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  if (getDemoProducts().some((product) => product.category === cleaned)) {
    return { ok: false, error: "category_in_use" };
  }
  const next = demoCategories.filter((item) => item.slug !== cleaned);
  if (next.length === demoCategories.length) {
    return { ok: false, error: "not found" };
  }
  demoCategories = next;
  return { ok: true };
}
