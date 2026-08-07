"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/features/admin/components/confirm-delete-button";
import { useAdminFetch } from "@/features/admin/lib/admin-fetch";
import type { ProductRow } from "@/lib/infrastructure/supabase/types";
import { PRODUCT_CATEGORIES } from "@/lib/infrastructure/supabase/fallback-products";

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
};

export function AdminProductsPanel() {
  const { t } = useTranslation();
  const adminFetch = useAdminFetch();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const response = await adminFetch("/api/admin/products");
    const json = (await response.json()) as { products?: ProductRow[] };
    setProducts(json.products ?? []);
  }, [adminFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  const fieldClass =
    "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent";

  const uploadImage = async (file: File) => {
    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    const response = await adminFetch("/api/admin/upload", {
      method: "POST",
      body,
    });
    const json = (await response.json()) as { url?: string; error?: string };
    setUploading(false);
    if (!response.ok || !json.url) {
      setMessage(json.error ?? t("admin.uploadError"));
      return null;
    }
    return json.url;
  };

  const save = async () => {
    setMessage(null);
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
    };

    const response = await adminFetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(json.error ?? t("admin.saveError"));
      return;
    }
    setMessage(t("admin.saveSuccess"));
    setForm(emptyForm);
    await load();
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
    });
  };

  const remove = async (id: string) => {
    const response = await adminFetch(`/api/admin/products?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setMessage(t("admin.deleteError"));
      return;
    }
    setMessage(t("admin.deleteSuccess"));
    await load();
  };

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 md:px-6">
      <header className="space-y-2">
        <h1 className="font-serif text-4xl text-primary">{t("admin.productsTitle")}</h1>
        <p className="text-muted">{t("admin.productsSubtitle")}</p>
      </header>

      {message ? (
        <p className="rounded-xl bg-background-alt px-4 py-3 text-sm text-primary">{message}</p>
      ) : null}

      <section className="grid gap-4 rounded-2xl border border-border p-5 lg:grid-cols-2">
        {(
          [
            ["name", "text"],
            ["slug", "text"],
            ["price", "number"],
            ["stock", "number"],
            ["short_description", "text"],
            ["image_url", "text"],
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

        <label className="space-y-1 text-sm lg:col-span-2">
          <span className="text-muted">{t("admin.uploadImage")}</span>
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              void uploadImage(file).then((url) => {
                if (url) setForm((prev) => ({ ...prev, image_url: url }));
              });
            }}
          />
        </label>

        <div className="flex flex-wrap gap-3 lg:col-span-2">
          <Button type="button" onClick={() => void save()}>
            {form.id ? t("admin.updateProduct") : t("admin.createProduct")}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setForm(emptyForm)}>
            {t("admin.resetForm")}
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        {products.map((product) => (
          <article
            key={product.id}
            className="flex flex-col gap-4 rounded-2xl border border-border p-4 sm:flex-row sm:items-center"
          >
            <div className="relative size-20 overflow-hidden rounded-xl bg-background-alt">
              {product.image_url ? (
                <Image src={product.image_url} alt={product.name} fill className="object-cover" />
              ) : null}
            </div>
            <div className="flex-1">
              <p className="font-serif text-xl text-primary">{product.name}</p>
              <p className="text-sm text-muted">
                {product.slug} · {t("admin.stockLeft", { count: product.stock })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="primary-outline" onClick={() => edit(product)}>
                {t("admin.edit")}
              </Button>
              <ConfirmDeleteButton
                label={t("admin.delete")}
                confirmMessage={t("admin.confirmDeleteProduct", { name: product.name })}
                onConfirm={() => remove(product.id)}
              />
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
