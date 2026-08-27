"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { PRODUCT_COLOR_KEYS, type ProductColorKey } from "@/lib/domain/product-color";
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
  stock: 10,
  shipping_fee: 0,
  qr_url: "",
  universe: "adult" as "adult" | "child",
  color_variants: [] as ProductColorKey[],
  bundleComponents: [] as BundleComponentDraft[],
};

type ProductForm = typeof emptyForm;

type ProductFormDraft = {
  form: ProductForm;
  slugTouched: boolean;
  modalOpen: boolean;
};

const PRODUCT_FORM_DRAFT_KEY = "product-form";

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
    if (!q) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(q) ||
        product.slug.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q),
    );
  }, [products, query]);

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
      stock: product.stock,
      shipping_fee: product.shipping_fee ?? 0,
      qr_url: product.qr_url ?? "",
      universe: product.universe === "child" ? "child" : "adult",
      color_variants: product.color_variants ?? [],
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
        ingredients_image_url: form.ingredients_image_url || form.image_url,
        lifestyle_image_url: form.lifestyle_image_url || null,
        category: form.category,
        product_type: form.product_type,
        is_bundle: isBundle,
        is_new: form.is_new,
        stock: Number(form.stock),
        shipping_fee: Number(form.shipping_fee) || 0,
        qr_url: form.qr_url.trim(),
        universe: form.universe,
        color_variants: form.color_variants,
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

  const productActions = (product: ProductRow) => (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="ghost"
        className="min-h-11 flex-1 sm:flex-none"
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
            {t("admin.createProduct")}
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
          <Button
            type="button"
            size="md"
            variant="ghost"
            onClick={discardProductDraft}
          >
            {t("admin.discardProductDraft")}
          </Button>
        </p>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl text-primary md:text-2xl">
                {t("admin.productsList")}
              </h2>
              {loaded ? (
                <p className="text-sm text-muted">
                  {t("admin.productsCount", { count: filtered.length })}
                </p>
              ) : null}
            </div>
          </div>
          <AdminSearchField value={query} onChange={setQuery} />
        </div>

        {!loaded ? (
          <p className="text-muted">{t("admin.loading")}</p>
        ) : filtered.length === 0 ? (
          <AdminEmptyState
            message={
              products.length === 0
                ? t("admin.noProducts")
                : t("admin.noSearchResults")
            }
          />
        ) : (
          <>
            {/* Mobile : cartes tactiles */}
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
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-background-alt">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt=""
                          fill
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="font-medium text-primary">{product.name}</p>
                        {product.product_type === "accessory" ? (
                          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-accent">
                            {t("admin.productTypeAccessory")}
                          </span>
                        ) : null}
                        {product.is_bundle ? (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-primary">
                            {t("admin.bundleBadge")}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-sm text-muted">
                        {product.category}
                        {" · "}
                        {product.compare_at_price ? (
                          <span className="mr-1 text-xs text-muted line-through">
                            {formatPrice(product.compare_at_price, currency, i18n.language)}
                          </span>
                        ) : null}
                        {formatPrice(product.price, currency, i18n.language)}
                      </p>
                      <p
                        className={`mt-1 text-xs ${
                          product.stock <= 5
                            ? "font-medium text-accent"
                            : "text-muted"
                        }`}
                      >
                        {t("admin.stockLeft", { count: product.stock })}
                      </p>
                    </div>
                  </button>
                  <div className="mt-3 border-t border-border pt-3">
                    {productActions(product)}
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop : tableau */}
            <div className="hidden overflow-x-auto rounded-2xl border border-border md:block">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-background-alt text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">
                      {t("admin.fields.name")}
                    </th>
                    <th className="px-3 py-2 font-medium">
                      {t("admin.fields.category")}
                    </th>
                    <th className="px-3 py-2 font-medium">
                      {t("admin.fields.stock")}
                    </th>
                    <th className="px-3 py-2 font-medium">
                      {t("admin.fields.price")}
                    </th>
                    <th className="px-3 py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((product) => (
                    <tr
                      key={product.id}
                      className="border-t border-border hover:bg-background-alt/60"
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2.5">
                          <div className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-background-alt">
                            {product.image_url ? (
                              <Image
                                src={product.image_url}
                                alt=""
                                fill
                                className="object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-primary">
                              {product.name}
                            </p>
                            <p className="truncate text-xs text-muted">
                              {product.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-muted">
                        <span className="inline-flex items-center gap-1.5">
                          {product.category}
                          {product.product_type === "accessory" ? (
                            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-accent">
                              {t("admin.productTypeAccessory")}
                            </span>
                          ) : null}
                          {product.is_bundle ? (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-primary">
                              {t("admin.bundleBadge")}
                            </span>
                          ) : null}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted">{product.stock}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-primary">
                        {product.compare_at_price ? (
                          <span className="mr-1.5 text-xs text-muted line-through">
                            {formatPrice(product.compare_at_price, currency, i18n.language)}
                          </span>
                        ) : null}
                        {formatPrice(product.price, currency, i18n.language)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {productActions(product)}
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
            <span className="text-sm font-sans font-normal text-muted">
              {categories.length}
            </span>
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
                setNewCategoryType(
                  e.target.value === "accessory" ? "accessory" : "hair_care",
                )
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
                        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-accent">
                          {t("admin.productTypeAccessory")}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted">{category.slug}</p>
                  </div>
                  <ConfirmDeleteButton
                    label={t("admin.delete")}
                    confirmMessage={t("admin.confirmDeleteCategory", {
                      name: category.label,
                    })}
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
        <Button
          type="button"
          className="w-full shadow-lg"
          onClick={openCreate}
        >
          {t("admin.createProduct")}
        </Button>
      </div>

      {modalOpen ? (
        <AdminModal
          title={form.id ? t("admin.editProduct") : t("admin.createProduct")}
          onClose={closeModal}
          footer={
            <>
              <Button
                type="button"
                variant="ghost"
                className="w-full sm:w-auto"
                onClick={closeModal}
              >
                {t("admin.cancel")}
              </Button>
              <Button
                type="button"
                pending={pending}
                className="w-full sm:w-auto"
                onClick={save}
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
          <div className="space-y-6">
            <fieldset className="space-y-3">
              <legend className="font-serif text-lg text-primary">
                {t("admin.formEssentials")}
              </legend>
              <label className="block space-y-1 text-sm">
                <span className="text-muted">{t("admin.fields.name")}</span>
                <input
                  className={fieldClass}
                  value={form.name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="off"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block space-y-1 text-sm">
                  <span className="text-muted">{t("admin.fields.price")}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    className={fieldClass}
                    value={String(form.price)}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        price: Number(e.target.value),
                      }))
                    }
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="text-muted">
                    {t("admin.fields.compare_at_price")}
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    className={fieldClass}
                    placeholder={t("admin.compareAtPricePlaceholder")}
                    value={form.compare_at_price}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        compare_at_price: e.target.value,
                      }))
                    }
                  />
                  <span className="block text-xs text-muted">
                    {t("admin.compareAtPriceHint")}
                  </span>
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="text-muted">{t("admin.fields.stock")}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    className={fieldClass}
                    value={String(form.stock)}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        stock: Number(e.target.value),
                      }))
                    }
                  />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1 text-sm">
                  <span className="text-muted">
                    {t("admin.fields.category")}
                  </span>
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
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="text-muted">
                    {t("admin.fields.universe")}
                  </span>
                  <select
                    className={fieldClass}
                    value={form.universe}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        universe:
                          e.target.value === "child" ? "child" : "adult",
                      }))
                    }
                  >
                    <option value="adult">{t("admin.universeAdult")}</option>
                    <option value="child">{t("admin.universeChild")}</option>
                  </select>
                </label>
              </div>
              <label className="block space-y-1 text-sm">
                <span className="text-muted">
                  {t("admin.fields.short_description")}
                </span>
                <input
                  className={fieldClass}
                  value={form.short_description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      short_description: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="flex min-h-12 items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  className="size-5"
                  checked={form.is_new}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      is_new: e.target.checked,
                    }))
                  }
                />
                <span className="text-muted">{t("admin.fields.is_new")}</span>
              </label>

              <fieldset className="space-y-2">
                <legend className="text-sm text-muted">
                  {t("admin.fields.color_variants")}
                </legend>
                <p className="text-xs text-muted">
                  {t("admin.fields.color_variantsHint")}
                </p>
                <div className="flex flex-wrap gap-3">
                  {PRODUCT_COLOR_KEYS.map((key) => {
                    const checked = form.color_variants.includes(key);
                    return (
                      <label
                        key={key}
                        className="flex min-h-11 items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          className="size-5"
                          checked={checked}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              color_variants: e.target.checked
                                ? PRODUCT_COLOR_KEYS.filter(
                                    (item) =>
                                      item === key ||
                                      prev.color_variants.includes(item),
                                  )
                                : prev.color_variants.filter(
                                    (item) => item !== key,
                                  ),
                            }))
                          }
                        />
                        <span className="text-muted">
                          {t(`shop.colors.${key}`)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <label className="flex min-h-12 items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  className="size-5"
                  checked={form.is_bundle}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      is_bundle: e.target.checked,
                      bundleComponents: e.target.checked ? prev.bundleComponents : [],
                    }))
                  }
                />
                <span className="text-muted">{t("admin.fields.is_bundle")}</span>
              </label>

              {form.is_bundle ? (
                <div className="space-y-2 rounded-xl border border-accent/30 bg-accent/5 p-3">
                  <p className="text-sm font-medium text-primary">
                    {t("admin.bundleComponentsTitle")}
                  </p>
                  <p className="text-xs text-muted">{t("admin.bundleComponentsHint")}</p>
                  {form.bundleComponents.map((component, index) => (
                    <div key={index} className="flex flex-wrap items-center gap-2">
                      <select
                        className={`${fieldClass} sm:max-w-xs`}
                        value={component.productId}
                        onChange={(e) => {
                          const next = [...form.bundleComponents];
                          next[index] = { ...component, productId: e.target.value };
                          setForm((prev) => ({ ...prev, bundleComponents: next }));
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
                        className={`${fieldClass} sm:max-w-24`}
                        value={String(component.quantity)}
                        onChange={(e) => {
                          const next = [...form.bundleComponents];
                          next[index] = {
                            ...component,
                            quantity: Math.max(1, Number(e.target.value) || 1),
                          };
                          setForm((prev) => ({ ...prev, bundleComponents: next }));
                        }}
                      />
                      <Button
                        type="button"
                        size="md"
                        variant="ghost"
                        onClick={() => {
                          const next = form.bundleComponents.filter((_, i) => i !== index);
                          setForm((prev) => ({ ...prev, bundleComponents: next }));
                        }}
                      >
                        {t("admin.removeBundleComponent")}
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    size="md"
                    variant="primary-outline"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        bundleComponents: [
                          ...prev.bundleComponents,
                          { productId: "", quantity: 1 },
                        ],
                      }))
                    }
                  >
                    {t("admin.addBundleComponent")}
                  </Button>
                </div>
              ) : null}
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="font-serif text-lg text-primary">
                {t("admin.formImages")}
              </legend>
              {(
                [
                  ["image_url", "uploadImage"],
                  ["ingredients_image_url", "uploadIngredientsImage"],
                  ["lifestyle_image_url", "uploadLifestyleImage"],
                ] as const
              ).map(([field, labelKey]) => (
                <label key={field} className="block space-y-2 text-sm">
                  <span className="text-muted">
                    {form[field]
                      ? t("admin.replaceImage")
                      : t(`admin.${labelKey}`)}
                  </span>
                  {form[field] ? (
                    <div className="space-y-2">
                      <div className="relative h-28 w-full overflow-hidden rounded-xl bg-background-alt sm:h-24 sm:w-40">
                        <Image
                          src={form[field]}
                          alt=""
                          fill
                          className="object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        className="text-sm text-accent hover:text-accent-light"
                        onClick={() =>
                          setForm((prev) => ({ ...prev, [field]: "" }))
                        }
                      >
                        {t("admin.removeImage")}
                      </button>
                    </div>
                  ) : null}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="block w-full text-sm"
                    disabled={Boolean(uploading)}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      void uploadImage(file, field);
                    }}
                  />
                  {uploading === field ? (
                    <span className="block text-xs text-muted">
                      {t("admin.uploading")}
                    </span>
                  ) : null}
                </label>
              ))}
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="font-serif text-lg text-primary">
                {t("admin.formDetails")}
              </legend>
              <label className="block space-y-1 text-sm">
                <span className="text-muted">
                  {t("admin.fields.description")}
                </span>
                <textarea
                  className={fieldClass}
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="text-muted">
                  {t("admin.fields.ingredients")}
                </span>
                <textarea
                  className={fieldClass}
                  rows={3}
                  value={form.ingredients}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      ingredients: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="text-muted">{t("admin.fields.usage")}</span>
                <textarea
                  className={fieldClass}
                  rows={3}
                  value={form.usage}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, usage: e.target.value }))
                  }
                />
              </label>
            </fieldset>

            <details className="rounded-xl border border-border p-3">
              <summary className="cursor-pointer text-sm font-medium text-primary">
                {t("admin.formAdvanced")}
              </summary>
              <p className="mt-2 text-xs text-muted">
                {t("admin.formAdvancedHint")}
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1 text-sm sm:col-span-2">
                  <span className="text-muted">{t("admin.fields.slug")}</span>
                  <input
                    className={fieldClass}
                    value={form.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setForm((prev) => ({ ...prev, slug: e.target.value }));
                    }}
                  />
                  <span className="block text-xs text-muted">
                    {t("admin.slugHint")}
                  </span>
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="text-muted">
                    {t("admin.fields.shipping_fee")}
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    className={fieldClass}
                    value={String(form.shipping_fee)}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        shipping_fee: Number(e.target.value),
                      }))
                    }
                  />
                  <span className="block text-xs text-muted">
                    {t("admin.shippingFeeHint")}
                  </span>
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="text-muted">{t("admin.fields.qr_url")}</span>
                  <input
                    className={fieldClass}
                    value={form.qr_url}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, qr_url: e.target.value }))
                    }
                  />
                  <span className="block text-xs text-muted">
                    {t("admin.qrUrlHint")}
                  </span>
                </label>
              </div>
            </details>
          </div>
        </AdminModal>
      ) : null}
    </main>
  );
}
