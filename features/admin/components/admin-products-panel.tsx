"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/components/providers/preferences-provider";
import { AdminEmptyState } from "@/features/admin/components/admin-empty-state";
import { AdminFeedback } from "@/features/admin/components/admin-feedback";
import { AdminModal } from "@/features/admin/components/admin-modal";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { AdminSearchField } from "@/features/admin/components/admin-search-field";
import { ConfirmDeleteButton } from "@/features/admin/components/confirm-delete-button";
import { useAdminFetch } from "@/features/admin/lib/admin-fetch";
import {
  clearAdminDraft,
  readAdminDraft,
  writeAdminDraft,
} from "@/features/admin/lib/admin-form-draft";
import { formatPrice } from "@/lib/format/price";
import { useActionLock } from "@/lib/hooks/use-action-lock";
import { notifyCatalogChanged } from "@/lib/application/catalog-sync";
import {
  initialColorStock,
  PRODUCT_COLOR_KEYS,
  sumColorStock,
  type ProductColorImageMap,
  type ProductColorKey,
  type ProductColorStockMap,
} from "@/lib/domain/product-color";
import type { ProductCategory } from "@/lib/infrastructure/supabase/product-categories";
import type { ProductRow } from "@/lib/infrastructure/supabase/types";

type BundleComponentDraft = { productId: string; quantity: number };

const emptyForm = {
  id: "",
  slug: "",
  name: "",
  price: 0,
  compare_at_price: "",
  short_description: "",
  description: "",
  ingredients: "",
  usage: "",
  image_url: "",
  ingredients_image_url: "",
  lifestyle_image_url: "",
  category: "soin",
  product_type: "hair_care" as "hair_care" | "accessory",
  is_bundle: false,
  is_new: false,
  is_active: true,
  stock: 10,
  shipping_fee: 0,
  qr_url: "",
  universe: "adult" as "adult" | "child",
  color_variants: [] as ProductColorKey[],
  color_images: {} as ProductColorImageMap,
  color_stock: {} as ProductColorStockMap,
  bundleComponents: [] as BundleComponentDraft[],
};

type ProductForm = typeof emptyForm;

type ProductFormDraft = {
  form: ProductForm;
  slugTouched: boolean;
  modalOpen: boolean;
};

const PRODUCT_FORM_DRAFT_KEY = "product-form";

const LOW_STOCK_THRESHOLD = 5;
const PRODUCT_FILTERS = ["all", "active", "hidden", "low"] as const;
type ProductFilter = (typeof PRODUCT_FILTERS)[number];

/** True si le formulaire produit a du contenu à conserver en changeant de page. */
function isProductFormDirty(form: ProductForm): boolean {
  return Boolean(
    form.id ||
      form.name.trim() ||
      form.slug.trim() ||
      form.short_description.trim() ||
      form.description.trim() ||
      form.ingredients.trim() ||
      form.usage.trim() ||
      form.image_url.trim() ||
      form.qr_url.trim() ||
      form.bundleComponents.length > 0,
  );
}

const fieldClass =
  "min-h-12 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base outline-none focus:border-accent sm:min-h-11 sm:text-sm";

function slugify(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

/** Panneau admin des produits : création, édition, gestion des catégories et upload d'images. */
export function AdminProductsPanel() {
  const { t, i18n } = useTranslation();
  const { currency } = usePreferences();
  const adminFetch = useAdminFetch();
  const { locked: pending, run } = useActionLock();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<"hair_care" | "accessory">(
    "hair_care",
  );
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ProductFilter>("all");
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const [productsRes, categoriesRes] = await Promise.all([
      adminFetch("/api/admin/products"),
      adminFetch("/api/admin/categories"),
    ]);
    const productsJson = (await productsRes.json()) as {
      products?: ProductRow[];
    };
    const categoriesJson = (await categoriesRes.json()) as {
      categories?: ProductCategory[];
    };
    setProducts(productsJson.products ?? []);
    setCategories(categoriesJson.categories ?? []);
    setLoaded(true);
  }, [adminFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get("filter");
    if (initial && (PRODUCT_FILTERS as readonly string[]).includes(initial)) {
      setFilter(initial as ProductFilter);
    }
  }, []);

  useEffect(() => {
    const saved = readAdminDraft<ProductFormDraft>(PRODUCT_FORM_DRAFT_KEY);
    if (saved?.form && isProductFormDirty(saved.form)) {
      setForm({ ...emptyForm, ...saved.form });
      setSlugTouched(Boolean(saved.slugTouched));
      setModalOpen(Boolean(saved.modalOpen));
    }
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    if (!isProductFormDirty(form)) {
      clearAdminDraft(PRODUCT_FORM_DRAFT_KEY);
      return;
    }
    const timer = window.setTimeout(() => {
      writeAdminDraft(PRODUCT_FORM_DRAFT_KEY, {
        form,
        slugTouched,
        modalOpen,
      } satisfies ProductFormDraft);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [draftReady, form, slugTouched, modalOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((product) => {
      if (filter === "active" && product.is_active === false) return false;
      if (filter === "hidden" && product.is_active !== false) return false;
      if (filter === "low" && product.stock > LOW_STOCK_THRESHOLD) return false;
      if (!q) return true;
      return (
        product.name.toLowerCase().includes(q) ||
        product.slug.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q)
      );
    });
  }, [products, query, filter]);

  const categoryOptions = useMemo(() => {
    const slugs = new Set(categories.map((item) => item.slug));
    const extras = products
      .map((product) => product.category)
      .filter((slug) => slug && !slugs.has(slug));
    return [
      ...categories,
      ...Array.from(new Set(extras)).map((slug) => ({
        slug,
        label: slug,
        label_en: slug,
        label_es: slug,
        position: 999,
        product_type: "hair_care" as const,
      })),
    ];
  }, [categories, products]);

  const openCreate = () => {
    if (isProductFormDirty(form)) {
      setModalOpen(true);
      return;
    }
    const defaultCategory = categories[0];
    setForm({
      ...emptyForm,
      category: defaultCategory?.slug ?? emptyForm.category,
      product_type: defaultCategory?.product_type ?? emptyForm.product_type,
    });
    setSlugTouched(false);
    setModalOpen(true);
  };

  const openEdit = async (product: ProductRow) => {
    let bundleComponents: BundleComponentDraft[] = [];
    if (product.is_bundle) {
      const res = await adminFetch(
        `/api/admin/bundles?productId=${encodeURIComponent(product.id)}`,
      );
      const json = (await res.json()) as {
        components?: Array<{ product: ProductRow; quantity: number }>;
      };
      bundleComponents = (json.components ?? []).map((c) => ({
        productId: c.product.id,
        quantity: c.quantity,
      }));
    }
    setForm({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      compare_at_price:
        product.compare_at_price !== null ? String(product.compare_at_price) : "",
      short_description: product.short_description,
      description: product.description,
      ingredients: product.ingredients,
      usage: product.usage,
      image_url: product.image_url,
      ingredients_image_url: product.ingredients_image_url,
      lifestyle_image_url: product.lifestyle_image_url ?? "",
      category: product.category,
      product_type: product.product_type,
      is_bundle: product.is_bundle,
      is_new: product.is_new,
      is_active: product.is_active !== false,
      stock: product.stock,
      shipping_fee: product.shipping_fee ?? 0,
      qr_url: product.qr_url ?? "",
      universe: product.universe === "child" ? "child" : "adult",
      color_variants: product.color_variants ?? [],
      color_images: product.color_images ?? {},
      color_stock: initialColorStock(
        product.color_variants ?? [],
        product.color_stock ?? {},
        product.stock,
      ),
      bundleComponents,
    });
    setSlugTouched(true);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const discardProductDraft = () => {
    clearAdminDraft(PRODUCT_FORM_DRAFT_KEY);
    setForm(emptyForm);
    setSlugTouched(false);
    setModalOpen(false);
  };

  const setName = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: !prev.id && !slugTouched ? slugify(name) : prev.slug,
    }));
  };

  const uploadImage = async (
    file: File,
    field: "image_url" | "ingredients_image_url" | "lifestyle_image_url",
  ) => {
    setUploading(field);
    const body = new FormData();
    body.append("file", file);
    const response = await adminFetch("/api/admin/upload", {
      method: "POST",
      body,
    });
    const json = (await response.json()) as { url?: string; error?: string };
    setUploading(null);
    if (!response.ok || !json.url) {
      setFeedback({
        tone: "error",
        message: json.error ?? t("admin.uploadError"),
      });
      return;
    }
    setForm((prev) => ({ ...prev, [field]: json.url! }));
  };

  const uploadColorImage = async (file: File, colorKey: ProductColorKey) => {
    setUploading(`color:${colorKey}`);
    const body = new FormData();
    body.append("file", file);
    const response = await adminFetch("/api/admin/upload", {
      method: "POST",
      body,
    });
    const json = (await response.json()) as { url?: string; error?: string };
    setUploading(null);
    if (!response.ok || !json.url) {
      setFeedback({
        tone: "error",
        message: json.error ?? t("admin.uploadError"),
      });
      return;
    }
    setForm((prev) => ({
      ...prev,
      color_images: { ...prev.color_images, [colorKey]: json.url! },
    }));
  };

  const toggleColor = (key: ProductColorKey, enabled: boolean) => {
    setForm((prev) => {
      const color_variants = enabled
        ? PRODUCT_COLOR_KEYS.filter(
            (item) => item === key || prev.color_variants.includes(item),
          )
        : prev.color_variants.filter((item) => item !== key);
      const color_images = { ...prev.color_images };
      const color_stock = { ...prev.color_stock };
      if (enabled) {
        if (color_stock[key] === undefined) {
          const alreadyTracked = prev.color_variants.some(
            (item) => prev.color_stock[item] !== undefined,
          );
          color_stock[key] = alreadyTracked
            ? 0
            : Math.max(0, Math.floor(Number(prev.stock) || 0));
        }
      } else {
        delete color_images[key];
        delete color_stock[key];
      }
      const stock = color_variants.length
        ? sumColorStock(color_variants, color_stock)
        : prev.stock;
      return { ...prev, color_variants, color_images, color_stock, stock };
    });
  };

  const save = () => {
    void run(async () => {
      setFeedback(null);
      const isBundle = form.is_bundle && form.bundleComponents.length > 0;
      const payload = {
        ...(form.id ? { id: form.id } : {}),
        slug: form.slug || slugify(form.name),
        name: form.name,
        price: Number(form.price),
        compare_at_price: form.compare_at_price.trim()
          ? Number(form.compare_at_price)
          : null,
        short_description: form.short_description,
        description: form.description,
        ingredients: form.ingredients,
        usage: form.usage,
        image_url: form.image_url,
        ingredients_image_url: form.ingredients_image_url.trim(),
        lifestyle_image_url: form.lifestyle_image_url || null,
        category: form.category,
        product_type: form.product_type,
        is_bundle: isBundle,
        is_new: form.is_new,
        is_active: form.is_active,
        stock: form.color_variants.length
          ? sumColorStock(form.color_variants, form.color_stock)
          : Number(form.stock),
        shipping_fee: Number(form.shipping_fee) || 0,
        qr_url: form.qr_url.trim(),
        universe: form.universe,
        color_variants: form.color_variants,
        color_images: form.color_images,
        color_stock: form.color_stock,
      };

      const response = await adminFetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await response.json()) as {
        product?: ProductRow;
        error?: string;
      };
      if (!response.ok || !json.product) {
        setFeedback({
          tone: "error",
          message: json.error ?? t("admin.saveError"),
        });
        return;
      }

      if (isBundle) {
        const bundleRes = await adminFetch("/api/admin/bundles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: json.product.id,
            components: form.bundleComponents.filter((c) => c.productId),
          }),
        });
        if (!bundleRes.ok) {
          setFeedback({ tone: "error", message: t("admin.bundleSaveError") });
          return;
        }
      }

      setFeedback({ tone: "success", message: t("admin.saveSuccess") });
      discardProductDraft();
      await load();
      notifyCatalogChanged();
    });
  };

  const remove = async (id: string) => {
    const response = await adminFetch(
      `/api/admin/products?id=${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
    if (!response.ok) {
      setFeedback({ tone: "error", message: t("admin.deleteError") });
      return;
    }
    setFeedback({ tone: "success", message: t("admin.deleteSuccess") });
    if (form.id === id) discardProductDraft();
    await load();
    notifyCatalogChanged();
  };

  const toggleActive = async (product: ProductRow) => {
    const { created_at: _createdAt, ...rest } = product;
    const response = await adminFetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...rest, is_active: !product.is_active }),
    });
    const json = (await response.json()) as { error?: string };
    if (!response.ok) {
      setFeedback({
        tone: "error",
        message: json.error ?? t("admin.saveError"),
      });
      return;
    }
    setFeedback({
      tone: "success",
      message: t("admin.saveSuccess"),
    });
    await load();
    notifyCatalogChanged();
  };

  const createCategory = () => {
    void run(async () => {
      const label = newCategoryLabel.trim();
      if (!label) return;
      setFeedback(null);
      const response = await adminFetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, product_type: newCategoryType }),
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        setFeedback({
          tone: "error",
          message: json.error ?? t("admin.saveError"),
        });
        return;
      }
      setNewCategoryLabel("");
      setNewCategoryType("hair_care");
      setFeedback({ tone: "success", message: t("admin.categoryCreated") });
      await load();
    });
  };

  const removeCategory = async (slug: string) => {
    const response = await adminFetch(
      `/api/admin/categories?slug=${encodeURIComponent(slug)}`,
      { method: "DELETE" },
    );
    const json = (await response.json()) as { error?: string };
    if (!response.ok) {
      setFeedback({
        tone: "error",
        message:
          json.error === "category_in_use"
            ? t("admin.categoryInUse")
            : (json.error ?? t("admin.deleteError")),
      });
      return;
    }
    setFeedback({ tone: "success", message: t("admin.deleteSuccess") });
    await load();
  };

  const counts = {
    all: products.length,
    active: products.filter((product) => product.is_active !== false).length,
    hidden: products.filter((product) => product.is_active === false).length,
    low: products.filter((product) => product.stock <= LOW_STOCK_THRESHOLD).length,
  } satisfies Record<ProductFilter, number>;

  const categoryLabel = (slug: string) =>
    categoryOptions.find((item) => item.slug === slug)?.label ?? slug;

  const update = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const discountPercent =
    form.compare_at_price.trim() && Number(form.compare_at_price) > Number(form.price)
      ? Math.round((1 - Number(form.price) / Number(form.compare_at_price)) * 100)
      : null;

  const productBadges = (product: ProductRow) => (
    <>
      {product.product_type === "accessory" ? (
        <Badge tone="accent">{t("admin.productTypeAccessory")}</Badge>
      ) : null}
      {product.is_bundle ? <Badge tone="primary">{t("admin.bundleBadge")}</Badge> : null}
      {product.is_new ? <Badge tone="primary">{t("admin.fields.is_new")}</Badge> : null}
      {product.universe === "child" ? (
        <Badge tone="muted">{t("admin.universeChild")}</Badge>
      ) : null}
    </>
  );

  const stockPill = (product: ProductRow) => (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${
        product.stock <= 0
          ? "bg-accent text-background"
          : product.stock <= LOW_STOCK_THRESHOLD
            ? "bg-accent/15 text-accent"
            : "bg-primary/10 text-primary"
      }`}
    >
      {product.stock <= 0 ? t("admin.outOfStock") : t("admin.stockLeft", { count: product.stock })}
    </span>
  );

  const swatches = (product: ProductRow) =>
    product.color_variants?.length ? (
      <span className="flex items-center gap-1" aria-label={t("admin.fields.color_variants")}>
        {product.color_variants.map((key) => (
          <span
            key={key}
            title={t(`shop.colors.${key}`)}
            className="size-3.5 rounded-full border border-border"
            style={{ backgroundColor: `var(--color-swatch-${key})` }}
          />
        ))}
      </span>
    ) : null;

  const priceCell = (product: ProductRow) => (
    <span className="whitespace-nowrap tabular-nums">
      <span className="font-medium text-primary">
        {formatPrice(product.price, currency, i18n.language)}
      </span>
      {product.compare_at_price ? (
        <span className="ml-1.5 text-xs text-muted line-through">
          {formatPrice(product.compare_at_price, currency, i18n.language)}
        </span>
      ) : null}
    </span>
  );

  const thumb = (product: ProductRow, size: "sm" | "lg") => (
    <div
      className={`relative shrink-0 overflow-hidden rounded-xl bg-background-alt ${
        size === "lg" ? "size-16" : "size-12"
      } ${product.is_active === false ? "opacity-50 grayscale" : ""}`}
    >
      {product.image_url ? (
        <Image
          src={product.image_url}
          alt=""
          fill
          sizes={size === "lg" ? "64px" : "48px"}
          className="object-cover"
        />
      ) : null}
    </div>
  );

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 pb-24 md:gap-8 md:px-6 md:py-10 md:pb-10">
      <AdminPageHeader
        title={t("admin.productsTitle")}
        subtitle={t("admin.productsSubtitle")}
        actions={
          <Button
            type="button"
            className="hidden w-full sm:inline-flex sm:w-auto"
            onClick={openCreate}
          >
            + {t("admin.createProduct")}
          </Button>
        }
      />

      {feedback ? (
        <AdminFeedback tone={feedback.tone} message={feedback.message} />
      ) : null}

      {draftReady && isProductFormDirty(form) ? (
        <p className="flex flex-wrap items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary">
          <span>{t("admin.productDraftRestored")}</span>
          {!modalOpen ? (
            <Button
              type="button"
              size="md"
              variant="primary-outline"
              onClick={() => setModalOpen(true)}
            >
              {t("admin.resumeProductDraft")}
            </Button>
          ) : null}
          <Button type="button" size="md" variant="ghost" onClick={discardProductDraft}>
            {t("admin.discardProductDraft")}
          </Button>
        </p>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div
            className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-background-alt p-1"
            role="group"
            aria-label={t("admin.productsFilter.label")}
          >
            {PRODUCT_FILTERS.map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={filter === key}
                onClick={() => setFilter(key)}
                className={`flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm transition ${
                  filter === key
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted hover:text-primary"
                }`}
              >
                {t(`admin.productsFilter.${key}`)}
                {loaded ? (
                  <span
                    className={`rounded-full px-1.5 text-xs tabular-nums ${
                      key === "low" && counts.low > 0
                        ? "bg-accent/15 text-accent"
                        : "bg-background-alt text-muted"
                    }`}
                  >
                    {counts[key]}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
          <div className="lg:w-80">
            <AdminSearchField value={query} onChange={setQuery} />
          </div>
        </div>

        {!loaded ? (
          <p className="text-muted">{t("admin.loading")}</p>
        ) : filtered.length === 0 ? (
          <AdminEmptyState
            message={
              products.length === 0 ? t("admin.noProducts") : t("admin.noSearchResults")
            }
          />
        ) : (
          <>
            {/* Mobile : cartes */}
            <ul className="space-y-3 md:hidden">
              {filtered.map((product) => (
                <li
                  key={product.id}
                  className="rounded-2xl border border-border bg-background p-3"
                >
                  <button
                    type="button"
                    className="flex w-full items-start gap-3 text-left"
                    onClick={() => void openEdit(product)}
                  >
                    {thumb(product, "lg")}
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-medium leading-snug text-primary">{product.name}</p>
                      <p className="text-xs text-muted">{categoryLabel(product.category)}</p>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        {priceCell(product)}
                        {stockPill(product)}
                        {swatches(product)}
                      </div>
                      <div className="flex flex-wrap gap-1">{productBadges(product)}</div>
                    </div>
                  </button>
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
                    <Switch
                      checked={product.is_active !== false}
                      label={
                        product.is_active !== false
                          ? t("admin.productsFilter.active")
                          : t("admin.hiddenBadge")
                      }
                      onChange={() => void toggleActive(product)}
                    />
                    <ConfirmDeleteButton
                      label={t("admin.delete")}
                      confirmMessage={t("admin.confirmDeleteProduct", { name: product.name })}
                      onConfirm={() => remove(product.id)}
                    />
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop : tableau */}
            <div className="hidden overflow-x-auto rounded-2xl border border-border bg-background md:block">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t("admin.fields.name")}</th>
                    <th className="px-4 py-3 font-medium">{t("admin.fields.category")}</th>
                    <th className="px-4 py-3 font-medium">{t("admin.fields.price")}</th>
                    <th className="px-4 py-3 font-medium">{t("admin.fields.stock")}</th>
                    <th className="px-4 py-3 font-medium">{t("admin.productsColumns.visible")}</th>
                    <th className="px-4 py-3 font-medium">
                      <span className="sr-only">{t("admin.productsColumns.actions")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((product) => (
                    <tr
                      key={product.id}
                      className="group cursor-pointer transition hover:bg-background-alt/50"
                      onClick={() => void openEdit(product)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {thumb(product, "sm")}
                          <div className="min-w-0 space-y-1">
                            <p className="max-w-xs truncate font-medium text-primary">
                              {product.name}
                            </p>
                            <div className="flex flex-wrap items-center gap-1">
                              {productBadges(product)}
                              {!product.is_new &&
                              !product.is_bundle &&
                              product.product_type !== "accessory" &&
                              product.universe !== "child" ? (
                                <span className="truncate text-xs text-muted">
                                  /{product.slug}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">{categoryLabel(product.category)}</td>
                      <td className="px-4 py-3">{priceCell(product)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {stockPill(product)}
                          {swatches(product)}
                        </div>
                      </td>
                      <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                        <Switch
                          checked={product.is_active !== false}
                          label={
                            product.is_active !== false
                              ? t("admin.hideProduct")
                              : t("admin.showProduct")
                          }
                          hideLabel
                          onChange={() => void toggleActive(product)}
                        />
                      </td>
                      <td
                        className="px-4 py-3 text-right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="md"
                            onClick={() => void openEdit(product)}
                          >
                            {t("admin.edit")}
                          </Button>
                          <ConfirmDeleteButton
                            label={t("admin.delete")}
                            confirmMessage={t("admin.confirmDeleteProduct", {
                              name: product.name,
                            })}
                            onConfirm={() => remove(product.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <details className="rounded-2xl border border-border p-4 open:pb-5 md:p-5">
        <summary className="cursor-pointer list-none font-serif text-xl text-primary marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between gap-3">
            {t("admin.categoriesTitle")}
            <span className="font-sans text-sm font-normal text-muted">{categories.length}</span>
          </span>
          <span className="mt-1 block font-sans text-sm font-normal text-muted">
            {t("admin.categoriesSubtitle")}
          </span>
        </summary>

        <div className="mt-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              className={`${fieldClass} sm:flex-1`}
              value={newCategoryLabel}
              placeholder={t("admin.newCategoryPlaceholder")}
              onChange={(e) => setNewCategoryLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  createCategory();
                }
              }}
            />
            <select
              className={`${fieldClass} sm:w-48`}
              value={newCategoryType}
              onChange={(e) =>
                setNewCategoryType(e.target.value === "accessory" ? "accessory" : "hair_care")
              }
            >
              <option value="hair_care">{t("admin.productTypeHairCare")}</option>
              <option value="accessory">{t("admin.productTypeAccessory")}</option>
            </select>
            <Button
              type="button"
              pending={pending}
              className="min-h-12 w-full sm:w-auto"
              onClick={createCategory}
              disabled={!newCategoryLabel.trim()}
            >
              {t("admin.addCategory")}
            </Button>
          </div>

          {categories.length === 0 ? (
            <p className="text-sm text-muted">{t("admin.noCategories")}</p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {categories.map((category) => (
                <li
                  key={category.slug}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="font-medium text-primary">{category.label}</p>
                      {category.product_type === "accessory" ? (
                        <Badge tone="accent">{t("admin.productTypeAccessory")}</Badge>
                      ) : null}
                      <span className="text-xs text-muted">
                        {t("admin.productsCount", {
                          count: products.filter((p) => p.category === category.slug).length,
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-muted">{category.slug}</p>
                  </div>
                  <ConfirmDeleteButton
                    label={t("admin.delete")}
                    confirmMessage={t("admin.confirmDeleteCategory", { name: category.label })}
                    onConfirm={() => removeCategory(category.slug)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>

      {/* FAB mobile */}
      <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 px-4 pb-2 sm:hidden">
        <Button type="button" className="w-full shadow-lg" onClick={openCreate}>
          + {t("admin.createProduct")}
        </Button>
      </div>

      {modalOpen ? (
        <AdminModal
          size="lg"
          title={form.id ? form.name || t("admin.editProduct") : t("admin.createProduct")}
          onClose={closeModal}
          footer={
            <>
              <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={closeModal}>
                {t("admin.cancel")}
              </Button>
              <Button
                type="button"
                pending={pending}
                className="w-full sm:w-auto"
                onClick={save}
                disabled={!form.name.trim()}
              >
                {pending
                  ? t("admin.saving")
                  : form.id
                    ? t("admin.updateProduct")
                    : t("admin.createProduct")}
              </Button>
            </>
          }
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
            {/* Colonne principale */}
            <div className="min-w-0 space-y-5">
              <FormCard title={t("admin.formEssentials")}>
                <Field label={t("admin.fields.name")}>
                  <input
                    className={fieldClass}
                    value={form.name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="off"
                  />
                </Field>
                <Field label={t("admin.fields.short_description")}>
                  <input
                    className={fieldClass}
                    value={form.short_description}
                    onChange={(e) => update("short_description", e.target.value)}
                  />
                </Field>
                <Field label={t("admin.fields.description")}>
                  <textarea
                    className={fieldClass}
                    rows={4}
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                  />
                </Field>
              </FormCard>

              <FormCard title={t("admin.formImages")} hint={t("admin.formImagesHint")}>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {(
                    [
                      ["image_url", "uploadImage"],
                      ["lifestyle_image_url", "uploadLifestyleImage"],
                      ["ingredients_image_url", "uploadIngredientsImage"],
                    ] as const
                  ).map(([field, labelKey]) => (
                    <ImageTile
                      key={field}
                      label={
                        field === "lifestyle_image_url" && form.product_type === "accessory"
                          ? t("admin.uploadDetailImage")
                          : t(`admin.${labelKey}`)
                      }
                      main={field === "image_url"}
                      url={form[field]}
                      uploading={uploading === field}
                      disabled={Boolean(uploading)}
                      onFile={(file) => void uploadImage(file, field)}
                      onRemove={() => update(field, "")}
                      removeLabel={t("admin.removeImage")}
                      uploadingLabel={t("admin.uploading")}
                    />
                  ))}
                </div>
              </FormCard>

              <FormCard
                title={t("admin.fields.color_variants")}
                hint={t("admin.fields.color_variantsHint")}
              >
                <div className="flex flex-wrap gap-2">
                  {PRODUCT_COLOR_KEYS.map((key) => {
                    const checked = form.color_variants.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        aria-pressed={checked}
                        onClick={() => toggleColor(key, !checked)}
                        className={`flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm transition ${
                          checked
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted hover:border-accent hover:text-primary"
                        }`}
                      >
                        <span
                          className="size-4 rounded-full border border-border"
                          style={{ backgroundColor: `var(--color-swatch-${key})` }}
                        />
                        {t(`shop.colors.${key}`)}
                        {checked ? <span aria-hidden>✓</span> : null}
                      </button>
                    );
                  })}
                </div>
                {form.color_variants.length > 0 ? (
                  <ul className="divide-y divide-border rounded-xl border border-border">
                    {form.color_variants.map((key) => {
                      const colorImage = form.color_images[key] ?? "";
                      const colorName = t(`shop.colors.${key}`);
                      return (
                        <li key={key} className="flex items-center gap-3 p-3">
                          <ImageTile
                            compact
                            label={t("admin.uploadColorImage", { color: colorName })}
                            url={colorImage}
                            uploading={uploading === `color:${key}`}
                            disabled={Boolean(uploading)}
                            onFile={(file) => void uploadColorImage(file, key)}
                            onRemove={() =>
                              setForm((prev) => {
                                const color_images = { ...prev.color_images };
                                delete color_images[key];
                                return { ...prev, color_images };
                              })
                            }
                            removeLabel={t("admin.removeImage")}
                            uploadingLabel={t("admin.uploading")}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-2 text-sm font-medium text-primary">
                              <span
                                className="size-3 rounded-full border border-border"
                                style={{ backgroundColor: `var(--color-swatch-${key})` }}
                              />
                              {colorName}
                            </p>
                            <p className="text-xs text-muted">
                              {colorImage ? t("admin.colorImageSet") : t("admin.colorImageMissing")}
                            </p>
                          </div>
                          <label className="w-24 shrink-0 space-y-1 text-xs">
                            <span className="text-muted">{t("admin.fields.stock")}</span>
                            <input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              aria-label={t("admin.fields.colorStock", { color: colorName })}
                              className={fieldClass}
                              value={String(form.color_stock[key] ?? 0)}
                              onChange={(e) => {
                                const quantity = Math.max(0, Math.floor(Number(e.target.value) || 0));
                                setForm((prev) => {
                                  const color_stock = { ...prev.color_stock, [key]: quantity };
                                  return {
                                    ...prev,
                                    color_stock,
                                    stock: sumColorStock(prev.color_variants, color_stock),
                                  };
                                });
                              }}
                            />
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </FormCard>

              <FormCard title={t("admin.formDetails")}>
                <Field label={t("admin.fields.ingredients")}>
                  <textarea
                    className={fieldClass}
                    rows={3}
                    value={form.ingredients}
                    onChange={(e) => update("ingredients", e.target.value)}
                  />
                </Field>
                <Field label={t("admin.fields.usage")}>
                  <textarea
                    className={fieldClass}
                    rows={3}
                    value={form.usage}
                    onChange={(e) => update("usage", e.target.value)}
                  />
                </Field>
              </FormCard>

              <FormCard
                title={t("admin.fields.is_bundle")}
                action={
                  <Switch
                    checked={form.is_bundle}
                    label={t("admin.fields.is_bundle")}
                    hideLabel
                    onChange={(checked) =>
                      setForm((prev) => ({
                        ...prev,
                        is_bundle: checked,
                        bundleComponents: checked ? prev.bundleComponents : [],
                      }))
                    }
                  />
                }
              >
                {form.is_bundle ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted">{t("admin.bundleComponentsHint")}</p>
                    {form.bundleComponents.map((component, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <select
                          className={`${fieldClass} min-w-0 flex-1`}
                          value={component.productId}
                          onChange={(e) => {
                            const next = [...form.bundleComponents];
                            next[index] = { ...component, productId: e.target.value };
                            update("bundleComponents", next);
                          }}
                        >
                          <option value="">{t("admin.bundleComponentSelect")}</option>
                          {products
                            .filter((p) => !p.is_bundle && p.id !== form.id)
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                        </select>
                        <input
                          type="number"
                          min={1}
                          inputMode="numeric"
                          aria-label={t("admin.bundleQuantity")}
                          className={`${fieldClass} w-20 shrink-0`}
                          value={String(component.quantity)}
                          onChange={(e) => {
                            const next = [...form.bundleComponents];
                            next[index] = {
                              ...component,
                              quantity: Math.max(1, Number(e.target.value) || 1),
                            };
                            update("bundleComponents", next);
                          }}
                        />
                        <button
                          type="button"
                          className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-background-alt hover:text-accent"
                          aria-label={t("admin.removeBundleComponent")}
                          onClick={() =>
                            update(
                              "bundleComponents",
                              form.bundleComponents.filter((_, i) => i !== index),
                            )
                          }
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      size="md"
                      variant="primary-outline"
                      onClick={() =>
                        update("bundleComponents", [
                          ...form.bundleComponents,
                          { productId: "", quantity: 1 },
                        ])
                      }
                    >
                      + {t("admin.addBundleComponent")}
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted">{t("admin.bundleComponentsHint")}</p>
                )}
              </FormCard>
            </div>

            {/* Colonne latérale */}
            <aside className="min-w-0 space-y-5">
              <FormCard title={t("admin.formStatus")}>
                <Switch
                  checked={form.is_active}
                  label={t("admin.fields.is_active")}
                  description={t("admin.fields.is_activeHint")}
                  onChange={(checked) => update("is_active", checked)}
                />
                <Switch
                  checked={form.is_new}
                  label={t("admin.fields.is_new")}
                  onChange={(checked) => update("is_new", checked)}
                />
              </FormCard>

              <FormCard title={t("admin.formPricing")}>
                <Field label={`${t("admin.fields.price")} (€)`}>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    className={fieldClass}
                    value={String(form.price)}
                    onChange={(e) => update("price", Number(e.target.value))}
                  />
                </Field>
                <Field
                  label={`${t("admin.fields.compare_at_price")} (€)`}
                  hint={
                    discountPercent !== null
                      ? t("admin.discountPreview", { percent: discountPercent })
                      : t("admin.compareAtPriceHint")
                  }
                >
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    className={fieldClass}
                    placeholder={t("admin.compareAtPricePlaceholder")}
                    value={form.compare_at_price}
                    onChange={(e) => update("compare_at_price", e.target.value)}
                  />
                </Field>
              </FormCard>

              <FormCard title={t("admin.fields.stock")}>
                <Field
                  label={t("admin.fields.stock")}
                  hint={
                    form.color_variants.length > 0
                      ? t("admin.fields.colorStockTotalHint")
                      : undefined
                  }
                >
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    className={`${fieldClass} ${form.color_variants.length > 0 ? "bg-background-alt" : ""}`}
                    readOnly={form.color_variants.length > 0}
                    value={String(
                      form.color_variants.length
                        ? sumColorStock(form.color_variants, form.color_stock)
                        : form.stock,
                    )}
                    onChange={(e) => update("stock", Number(e.target.value))}
                  />
                </Field>
              </FormCard>

              <FormCard title={t("admin.formOrganization")}>
                <Field label={t("admin.fields.category")}>
                  <select
                    className={fieldClass}
                    value={form.category}
                    onChange={(e) => {
                      const nextCategory = categoryOptions.find(
                        (item) => item.slug === e.target.value,
                      );
                      setForm((prev) => ({
                        ...prev,
                        category: e.target.value,
                        product_type: nextCategory?.product_type ?? prev.product_type,
                      }));
                    }}
                  >
                    {categoryOptions.map((category) => (
                      <option key={category.slug} value={category.slug}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t("admin.fields.universe")}>
                  <div className="grid grid-cols-2 gap-1 rounded-xl bg-background-alt p-1">
                    {(["adult", "child"] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={form.universe === value}
                        onClick={() => update("universe", value)}
                        className={`min-h-10 rounded-lg text-sm transition ${
                          form.universe === value
                            ? "bg-background text-primary shadow-sm"
                            : "text-muted hover:text-primary"
                        }`}
                      >
                        {value === "adult" ? t("admin.universeAdult") : t("admin.universeChild")}
                      </button>
                    ))}
                  </div>
                </Field>
              </FormCard>

              <details className="rounded-2xl border border-border p-4">
                <summary className="cursor-pointer text-sm font-medium text-primary">
                  {t("admin.formAdvanced")}
                </summary>
                <p className="mt-2 text-xs text-muted">{t("admin.formAdvancedHint")}</p>
                <div className="mt-3 space-y-3">
                  <Field label={t("admin.fields.slug")} hint={t("admin.slugHint")}>
                    <input
                      className={fieldClass}
                      value={form.slug}
                      onChange={(e) => {
                        setSlugTouched(true);
                        update("slug", e.target.value);
                      }}
                    />
                  </Field>
                  <Field label={t("admin.fields.shipping_fee")} hint={t("admin.shippingFeeHint")}>
                    <input
                      type="number"
                      inputMode="decimal"
                      className={fieldClass}
                      value={String(form.shipping_fee)}
                      onChange={(e) => update("shipping_fee", Number(e.target.value))}
                    />
                  </Field>
                  <Field label={t("admin.fields.qr_url")} hint={t("admin.qrUrlHint")}>
                    <input
                      className={fieldClass}
                      value={form.qr_url}
                      onChange={(e) => update("qr_url", e.target.value)}
                    />
                  </Field>
                </div>
              </details>
            </aside>
          </div>
        </AdminModal>
      ) : null}
    </main>
  );
}

function Badge({ tone, children }: { tone: "accent" | "primary" | "muted"; children: ReactNode }) {
  const toneClass =
    tone === "accent"
      ? "bg-accent/15 text-accent"
      : tone === "primary"
        ? "bg-primary/10 text-primary"
        : "bg-background-alt text-muted";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide ${toneClass}`}
    >
      {children}
    </span>
  );
}

/** Interrupteur accessible (role=switch) avec libellé optionnellement masqué. */
function Switch({
  checked,
  label,
  description,
  hideLabel = false,
  onChange,
}: {
  checked: boolean;
  label: string;
  description?: string;
  hideLabel?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={hideLabel ? label : undefined}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
          checked ? "bg-primary" : "bg-border"
        }`}
      >
        <span
          className={`inline-block size-5 rounded-full bg-background shadow transition ${
            checked ? "translate-x-5.5" : "translate-x-0.5"
          }`}
        />
      </button>
      {hideLabel ? null : (
        <span className="min-w-0">
          <span className="block text-primary">{label}</span>
          {description ? (
            <span className="mt-0.5 block text-xs text-muted">{description}</span>
          ) : null}
        </span>
      )}
    </label>
  );
}

function FormCard({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-serif text-lg text-primary">{title}</h3>
          {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium text-muted">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

/** Tuile d'image : aperçu + retrait, ou zone d'ajout cliquable. */
function ImageTile({
  label,
  url,
  main = false,
  compact = false,
  uploading,
  disabled,
  onFile,
  onRemove,
  removeLabel,
  uploadingLabel,
}: {
  label: string;
  url: string;
  main?: boolean;
  compact?: boolean;
  uploading: boolean;
  disabled: boolean;
  onFile: (file: File) => void;
  onRemove: () => void;
  removeLabel: string;
  uploadingLabel: string;
}) {
  const box = compact ? "size-14 shrink-0" : "aspect-square w-full";
  return (
    <div className={compact ? "" : "space-y-1.5"}>
      <div className={`relative overflow-hidden rounded-xl ${box}`}>
        {url ? (
          <>
            <Image src={url} alt="" fill sizes="200px" className="object-cover" />
            <button
              type="button"
              onClick={onRemove}
              aria-label={`${removeLabel} — ${label}`}
              className="absolute right-1 top-1 inline-flex size-7 items-center justify-center rounded-full bg-background/90 text-xs text-primary shadow transition hover:text-accent"
            >
              ✕
            </button>
          </>
        ) : (
          <label
            className={`flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-background-alt/50 text-center text-muted transition hover:border-accent hover:text-accent ${
              disabled ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <span className={compact ? "text-lg" : "text-2xl"} aria-hidden>
              {uploading ? "…" : "+"}
            </span>
            {compact ? null : (
              <span className="px-2 text-xs">{uploading ? uploadingLabel : label}</span>
            )}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label={label}
              disabled={disabled}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) onFile(file);
              }}
            />
          </label>
        )}
        {main && url ? (
          <span className="absolute bottom-1 left-1 rounded-full bg-primary px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide text-background">
            ★
          </span>
        ) : null}
      </div>
      {compact ? null : <p className="truncate text-xs text-muted">{label}</p>}
    </div>
  );
}
