"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/components/providers/preferences-provider";
import { AdminEmptyState } from "@/features/admin/components/admin-empty-state";
import { AdminFeedback } from "@/features/admin/components/admin-feedback";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { AdminSearchField } from "@/features/admin/components/admin-search-field";
import { ConfirmDeleteButton } from "@/features/admin/components/confirm-delete-button";
import { useAdminFetch } from "@/features/admin/lib/admin-fetch";
import { formatPrice } from "@/lib/format/price";
import { useActionLock } from "@/lib/hooks/use-action-lock";
import { PRODUCT_CATEGORIES } from "@/lib/infrastructure/supabase/fallback-products";
import type { ProductRow } from "@/lib/infrastructure/supabase/types";

const emptyForm = {
  id: "",
  slug: "",
  name: "",
  price: 0,
  short_description: "",
  description: "",
  ingredients: "",
  usage: "",
  image_url: "",
  ingredients_image_url: "",
  lifestyle_image_url: "",
  category: "soin",
  is_new: false,
  stock: 10,
  shipping_fee: 0,
};

const fieldClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent";

export function AdminProductsPanel() {
  const { t, i18n } = useTranslation();
  const { currency } = usePreferences();
  const adminFetch = useAdminFetch();
  const { locked: pending, run } = useActionLock();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const response = await adminFetch("/api/admin/products");
    const json = (await response.json()) as { products?: ProductRow[] };
    setProducts(json.products ?? []);
    setLoaded(true);
  }, [adminFetch]);

  useEffect(() => {
    void load();
  }, [load]);

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

  const uploadImage = async (file: File, field: "image_url" | "ingredients_image_url" | "lifestyle_image_url") => {
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
      setFeedback({ tone: "error", message: json.error ?? t("admin.uploadError") });
      return;
    }
    setForm((prev) => ({ ...prev, [field]: json.url! }));
  };

  const save = () => {
    void run(async () => {
    setFeedback(null);
    const payload = {
      ...(form.id ? { id: form.id } : {}),
      slug: form.slug,
      name: form.name,
      price: Number(form.price),
      short_description: form.short_description,
      description: form.description,
      ingredients: form.ingredients,
      usage: form.usage,
      image_url: form.image_url,
      ingredients_image_url: form.ingredients_image_url || form.image_url,
      lifestyle_image_url: form.lifestyle_image_url || null,
      category: form.category,
      is_new: form.is_new,
      stock: Number(form.stock),
      shipping_fee: Number(form.shipping_fee) || 0,
    };

    const response = await adminFetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await response.json()) as { error?: string };
    if (!response.ok) {
      setFeedback({ tone: "error", message: json.error ?? t("admin.saveError") });
      return;
    }
    setFeedback({ tone: "success", message: t("admin.saveSuccess") });
    setForm(emptyForm);
    await load();
    });
  };

  const edit = (product: ProductRow) => {
    setForm({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      short_description: product.short_description,
      description: product.description,
      ingredients: product.ingredients,
      usage: product.usage,
      image_url: product.image_url,
      ingredients_image_url: product.ingredients_image_url,
      lifestyle_image_url: product.lifestyle_image_url ?? "",
      category: product.category,
      is_new: product.is_new,
      stock: product.stock,
      shipping_fee: product.shipping_fee ?? 0,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id: string) => {
    const response = await adminFetch(`/api/admin/products?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setFeedback({ tone: "error", message: t("admin.deleteError") });
      return;
    }
    setFeedback({ tone: "success", message: t("admin.deleteSuccess") });
    if (form.id === id) setForm(emptyForm);
    await load();
  };

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 md:px-6">
      <AdminPageHeader
        title={t("admin.productsTitle")}
        subtitle={t("admin.productsSubtitle")}
      />

      {feedback ? <AdminFeedback tone={feedback.tone} message={feedback.message} /> : null}

      <section className="space-y-4 rounded-2xl border border-border p-5">
        <h2 className="font-serif text-2xl text-primary">
          {form.id ? t("admin.editProduct") : t("admin.createProduct")}
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {(
            [
              ["name", "text"],
              ["slug", "text"],
              ["price", "number"],
              ["shipping_fee", "number"],
              ["stock", "number"],
              ["short_description", "text"],
              ["image_url", "text"],
              ["ingredients_image_url", "text"],
              ["lifestyle_image_url", "text"],
            ] as const
          ).map(([key, type]) => (
            <label key={key} className="space-y-1 text-sm">
              <span className="text-muted">{t(`admin.fields.${key}`)}</span>
              <input
                type={type}
                className={fieldClass}
                value={String(form[key])}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    [key]: type === "number" ? Number(e.target.value) : e.target.value,
                  }))
                }
              />
            </label>
          ))}

          <label className="space-y-1 text-sm lg:col-span-2">
            <span className="text-muted">{t("admin.fields.description")}</span>
            <textarea
              className={fieldClass}
              rows={3}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </label>

          <label className="space-y-1 text-sm lg:col-span-2">
            <span className="text-muted">{t("admin.fields.ingredients")}</span>
            <textarea
              className={fieldClass}
              rows={3}
              value={form.ingredients}
              onChange={(e) => setForm((prev) => ({ ...prev, ingredients: e.target.value }))}
            />
          </label>

          <label className="space-y-1 text-sm lg:col-span-2">
            <span className="text-muted">{t("admin.fields.usage")}</span>
            <textarea
              className={fieldClass}
              rows={3}
              value={form.usage}
              onChange={(e) => setForm((prev) => ({ ...prev, usage: e.target.value }))}
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-muted">{t("admin.fields.category")}</span>
            <select
              className={fieldClass}
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            >
              {PRODUCT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_new}
              onChange={(e) => setForm((prev) => ({ ...prev, is_new: e.target.checked }))}
            />
            <span className="text-muted">{t("admin.fields.is_new")}</span>
          </label>

          {(
            [
              ["image_url", "uploadImage"],
              ["ingredients_image_url", "uploadIngredientsImage"],
              ["lifestyle_image_url", "uploadLifestyleImage"],
            ] as const
          ).map(([field, labelKey]) => (
            <label key={field} className="space-y-1 text-sm">
              <span className="text-muted">{t(`admin.${labelKey}`)}</span>
              <input
                type="file"
                accept="image/*"
                disabled={Boolean(uploading)}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  void uploadImage(file, field);
                }}
              />
              {uploading === field ? (
                <span className="block text-xs text-muted">{t("admin.uploading")}</span>
              ) : null}
            </label>
          ))}

          <div className="flex flex-wrap gap-3 lg:col-span-2">
            <Button type="button" pending={pending} onClick={save}>
              {pending
                ? t("admin.saving")
                : form.id
                  ? t("admin.updateProduct")
                  : t("admin.createProduct")}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setForm(emptyForm)}>
              {t("admin.resetForm")}
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-serif text-2xl text-primary">{t("admin.productsList")}</h2>
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
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-background-alt text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">{t("admin.fields.name")}</th>
                  <th className="px-3 py-2 font-medium">{t("admin.fields.category")}</th>
                  <th className="px-3 py-2 font-medium">{t("admin.fields.stock")}</th>
                  <th className="px-3 py-2 font-medium">{t("admin.fields.price")}</th>
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
                    <td className="px-3 py-2 text-muted">{product.category}</td>
                    <td className="px-3 py-2 text-muted">{product.stock}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-primary">
                      {formatPrice(product.price, currency, i18n.language)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="md"
                          onClick={() => edit(product)}
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
        )}
      </section>
    </main>
  );
}
