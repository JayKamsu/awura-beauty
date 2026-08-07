"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/features/admin/components/confirm-delete-button";
import { useAdminFetch } from "@/features/admin/lib/admin-fetch";
import type { BlogPost, BlogPostKind } from "@/lib/infrastructure/supabase/blog-types";

const emptyForm = {
  id: "",
  slug: "",
  kind: "article" as BlogPostKind,
  title: "",
  excerpt: "",
  cover_image_url: "",
  published_at: new Date().toISOString().slice(0, 10),
  product_slug: "",
  body: "",
};

export function AdminContentPanel() {
  const { t } = useTranslation();
  const adminFetch = useAdminFetch();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await adminFetch("/api/admin/posts");
    const json = (await response.json()) as { posts?: BlogPost[] };
    setPosts(json.posts ?? []);
  }, [adminFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  const fieldClass =
    "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent";

  const save = async () => {
    const paragraphs = form.body
      .split(/\n+/)
      .map((text) => text.trim())
      .filter(Boolean)
      .map((text) => ({ type: "paragraph" as const, text }));

    const payload = {
      ...(form.id ? { id: form.id } : {}),
      slug: form.slug,
      kind: form.kind,
      title: form.title,
      excerpt: form.excerpt,
      cover_image_url: form.cover_image_url,
      published_at: form.published_at,
      product_slug: form.product_slug || null,
      content: paragraphs,
    };

    const response = await adminFetch("/api/admin/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setMessage(t("admin.saveError"));
      return;
    }

    setMessage(t("admin.saveSuccess"));
    setForm(emptyForm);
    await load();
  };

  const edit = (post: BlogPost) => {
    setForm({
      id: post.id,
      slug: post.slug,
      kind: post.kind,
      title: post.title,
      excerpt: post.excerpt,
      cover_image_url: post.cover_image_url,
      published_at: post.published_at.slice(0, 10),
      product_slug: post.product_slug ?? "",
      body: post.content
        .filter((block) => block.type === "paragraph")
        .map((block) => (block.type === "paragraph" ? block.text : ""))
        .join("\n\n"),
    });
  };

  const remove = async (id: string) => {
    const response = await adminFetch(`/api/admin/posts?id=${encodeURIComponent(id)}`, {
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
        <h1 className="font-serif text-4xl text-primary">{t("admin.contentTitle")}</h1>
        <p className="text-muted">{t("admin.contentSubtitle")}</p>
      </header>

      {message ? (
        <p className="rounded-xl bg-background-alt px-4 py-3 text-sm text-primary">{message}</p>
      ) : null}

      <section className="grid gap-4 rounded-2xl border border-border p-5 lg:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="text-muted">{t("admin.fields.title")}</span>
          <input
            className={fieldClass}
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted">{t("admin.fields.slug")}</span>
          <input
            className={fieldClass}
            value={form.slug}
            onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted">{t("admin.fields.kind")}</span>
          <select
            className={fieldClass}
            value={form.kind}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, kind: e.target.value as BlogPostKind }))
            }
          >
            <option value="article">{t("blog.badgeArticle")}</option>
            <option value="tutorial">{t("blog.badgeTutorial")}</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted">{t("admin.fields.published_at")}</span>
          <input
            type="date"
            className={fieldClass}
            value={form.published_at}
            onChange={(e) => setForm((prev) => ({ ...prev, published_at: e.target.value }))}
          />
        </label>
        <label className="space-y-1 text-sm lg:col-span-2">
          <span className="text-muted">{t("admin.fields.excerpt")}</span>
          <input
            className={fieldClass}
            value={form.excerpt}
            onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted">{t("admin.fields.cover_image_url")}</span>
          <input
            className={fieldClass}
            value={form.cover_image_url}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, cover_image_url: e.target.value }))
            }
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted">{t("admin.fields.product_slug")}</span>
          <input
            className={fieldClass}
            value={form.product_slug}
            onChange={(e) => setForm((prev) => ({ ...prev, product_slug: e.target.value }))}
          />
        </label>
        <label className="space-y-1 text-sm lg:col-span-2">
          <span className="text-muted">{t("admin.fields.body")}</span>
          <textarea
            className={fieldClass}
            rows={6}
            value={form.body}
            onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
          />
        </label>
        <div className="flex flex-wrap gap-3 lg:col-span-2">
          <Button type="button" onClick={() => void save()}>
            {form.id ? t("admin.updateContent") : t("admin.createContent")}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setForm(emptyForm)}>
            {t("admin.resetForm")}
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        {posts.map((post) => (
          <article
            key={post.id}
            className="flex flex-col gap-3 rounded-2xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">
                {post.kind === "tutorial" ? t("blog.badgeTutorial") : t("blog.badgeArticle")}
              </p>
              <p className="font-serif text-xl text-primary">{post.title}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="primary-outline" onClick={() => edit(post)}>
                {t("admin.edit")}
              </Button>
              <ConfirmDeleteButton
                label={t("admin.delete")}
                confirmMessage={t("admin.confirmDeleteContent", { title: post.title })}
                onConfirm={() => remove(post.id)}
              />
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
