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
import type { ProductCategory } from "@/lib/infrastructure/supabase/product-categories";
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
  qr_url: "",
  universe: "adult" as "adult" | "child",
};

const fieldClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent";

export function AdminProductsPanel() {
  const { t, i18n } = useTranslation();
  const { currency } = usePreferences();
  const adminFetch = useAdminFetch();
  const { locked: pending, run } = useActionLock();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
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
    if (!modalOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

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
      })),
    ];
  }, [categories, products]);

  const openCreate = () => {
    setForm({
      ...emptyForm,
      category: categories[0]?.slug ?? emptyForm.category,
    });
    setModalOpen(true);
  };

  const openEdit = (product: ProductRow) => {
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
      qr_url: product.qr_url ?? "",
      universe: product.universe === "child" ? "child" : "adult",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(emptyForm);
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
        qr_url: form.qr_url.trim(),
        universe: form.universe,
      };

      const response = await adminFetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        setFeedback({
          tone: "error",
          message: json.error ?? t("admin.saveError"),
        });
        return;
      }
      setFeedback({ tone: "success", message: t("admin.saveSuccess") });
      closeModal();
      await load();
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
    if (form.id === id) closeModal();
    await load();
  };

  const createCategory = () => {
    void run(async () => {
      const label = newCategoryLabel.trim();
      if (!label) return;
      setFeedback(null);
      const response = await adminFetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
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

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 md:px-6">
      <AdminPageHeader
        title={t("admin.productsTitle")}
        subtitle={t("admin.productsSubtitle")}
      />

      {feedback ? (
        <AdminFeedback tone={feedback.tone} message={feedback.message} />
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-serif text-2xl text-primary">
            {t("admin.productsList")}
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <AdminSearchField value={query} onChange={setQuery} />
            <Button type="button" onClick={openCreate}>
              {t("admin.createProduct")}
            </Button>
          </div>
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
                          onClick={() => openEdit(product)}
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

      <section className="space-y-4 rounded-2xl border border-border p-5">
        <div>
          <h2 className="font-serif text-2xl text-primary">
            {t("admin.categoriesTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted">{t("admin.categoriesSubtitle")}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className={fieldClass}
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
          <Button
            type="button"
            pending={pending}
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
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-primary">{category.label}</p>
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
      </section>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={
            form.id ? t("admin.editProduct") : t("admin.createProduct")
          }
          onClick={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-lg">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h2 className="font-serif text-xl text-primary">
                {form.id ? t("admin.editProduct") : t("admin.createProduct")}
              </h2>
              <Button type="button" variant="ghost" onClick={closeModal}>
                {t("admin.cancel")}
              </Button>
            </div>

            <div className="overflow-y-auto p-4">
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
                    ["qr_url", "text"],
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
                          [key]:
                            type === "number"
                              ? Number(e.target.value)
                              : e.target.value,
                        }))
                      }
                    />
                  </label>
                ))}

                <label className="space-y-1 text-sm lg:col-span-2">
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

                <label className="space-y-1 text-sm lg:col-span-2">
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

                <label className="space-y-1 text-sm lg:col-span-2">
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

                <label className="space-y-1 text-sm">
                  <span className="text-muted">
                    {t("admin.fields.category")}
                  </span>
                  <select
                    className={fieldClass}
                    value={form.category}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                  >
                    {categoryOptions.map((category) => (
                      <option key={category.slug} value={category.slug}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm">
                  <span className="text-muted">
                    {t("admin.fields.universe")}
                  </span>
                  <select
                    className={fieldClass}
                    value={form.universe}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        universe: e.target.value === "child" ? "child" : "adult",
                      }))
                    }
                  >
                    <option value="adult">{t("admin.universeAdult")}</option>
                    <option value="child">{t("admin.universeChild")}</option>
                  </select>
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
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
                      <span className="block text-xs text-muted">
                        {t("admin.uploading")}
                      </span>
                    ) : null}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t border-border px-4 py-3">
              <Button type="button" variant="ghost" onClick={closeModal}>
                {t("admin.cancel")}
              </Button>
              <Button type="button" pending={pending} onClick={save}>
                {pending
                  ? t("admin.saving")
                  : form.id
                    ? t("admin.updateProduct")
                    : t("admin.createProduct")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
