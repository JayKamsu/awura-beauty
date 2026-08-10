"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AdminEmptyState } from "@/features/admin/components/admin-empty-state";
import { AdminFeedback } from "@/features/admin/components/admin-feedback";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { AdminSearchField } from "@/features/admin/components/admin-search-field";
import { ConfirmDeleteButton } from "@/features/admin/components/confirm-delete-button";
import { useAdminFetch } from "@/features/admin/lib/admin-fetch";
import { useActionLock } from "@/lib/hooks/use-action-lock";
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

const fieldClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent";

export function AdminContentPanel() {
  const { t } = useTranslation();
  const adminFetch = useAdminFetch();
  const { locked: pending, run } = useActionLock();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const response = await adminFetch("/api/admin/posts");
    const json = (await response.json()) as { posts?: BlogPost[] };
    setPosts(json.posts ?? []);
    setLoaded(true);
  }, [adminFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter(
      (post) =>
        post.title.toLowerCase().includes(q) ||
        post.slug.toLowerCase().includes(q) ||
        post.kind.toLowerCase().includes(q),
    );
  }, [posts, query]);

  const uploadCover = async (file: File) => {
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
      setFeedback({ tone: "error", message: json.error ?? t("admin.uploadError") });
      return;
    }
    setForm((prev) => ({ ...prev, cover_image_url: json.url! }));
  };

  const save = () => {
    void run(async () => {
      setFeedback(null);
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
        setFeedback({ tone: "error", message: t("admin.saveError") });
        return;
      }

      setFeedback({ tone: "success", message: t("admin.saveSuccess") });
      setForm(emptyForm);
      await load();
    });
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id: string) => {
    const response = await adminFetch(`/api/admin/posts?id=${encodeURIComponent(id)}`, {
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
        title={t("admin.contentTitle")}
        subtitle={t("admin.contentSubtitle")}
      />

      {feedback ? <AdminFeedback tone={feedback.tone} message={feedback.message} /> : null}

      <p className="rounded-2xl bg-background-alt px-4 py-3 text-sm text-muted">
        {t("admin.content.help")}
      </p>

      <section className="grid gap-4 rounded-2xl border border-border p-5 lg:grid-cols-2">
        <h2 className="font-serif text-2xl text-primary lg:col-span-2">
          {form.id ? t("admin.updateContent") : t("admin.createContent")}
        </h2>
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
          <span className="block text-xs text-muted">{t("admin.content.kindHint")}</span>
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
          <span className="text-muted">{t("admin.uploadCover")}</span>
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadCover(file);
            }}
          />
        </label>
        <label className="space-y-1 text-sm lg:col-span-2">
          <span className="text-muted">{t("admin.fields.product_slug")}</span>
          <input
            className={fieldClass}
            value={form.product_slug}
            onChange={(e) => setForm((prev) => ({ ...prev, product_slug: e.target.value }))}
          />
          <span className="block text-xs text-muted">{t("admin.content.productSlugHint")}</span>
        </label>
        <label className="space-y-1 text-sm lg:col-span-2">
          <span className="text-muted">{t("admin.fields.body")}</span>
          <textarea
            className={fieldClass}
            rows={6}
            value={form.body}
            onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
          />
          <span className="block text-xs text-muted">{t("admin.content.bodyHint")}</span>
        </label>
        <div className="flex flex-wrap gap-3 lg:col-span-2">
          <Button type="button" pending={pending} onClick={save}>
            {pending
              ? t("admin.saving")
              : form.id
                ? t("admin.updateContent")
                : t("admin.createContent")}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setForm(emptyForm)}>
            {t("admin.resetForm")}
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-serif text-2xl text-primary">{t("admin.contentList")}</h2>
          <AdminSearchField value={query} onChange={setQuery} />
        </div>

        {!loaded ? (
          <p className="text-muted">{t("admin.loading")}</p>
        ) : filtered.length === 0 ? (
          <AdminEmptyState
            message={
              posts.length === 0 ? t("admin.noContent") : t("admin.noSearchResults")
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-background-alt text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">{t("admin.fields.title")}</th>
                  <th className="px-3 py-2 font-medium">{t("admin.fields.kind")}</th>
                  <th className="px-3 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((post) => {
                  const href =
                    post.kind === "tutorial"
                      ? `/tutoriels/${post.slug}`
                      : `/blog/${post.slug}`;
                  return (
                    <tr
                      key={post.id}
                      className="border-t border-border hover:bg-background-alt/60"
                    >
                      <td className="px-3 py-2">
                        <p className="font-medium text-primary">{post.title}</p>
                        <p className="text-xs text-muted">{post.slug}</p>
                      </td>
                      <td className="px-3 py-2 text-muted">
                        {post.kind === "tutorial"
                          ? t("blog.badgeTutorial")
                          : t("blog.badgeArticle")}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <Link
                            href={href}
                            target="_blank"
                            className="inline-flex min-h-10 items-center px-2 text-sm text-accent hover:text-accent-light"
                          >
                            {t("admin.viewOnSite")}
                          </Link>
                          <Button
                            type="button"
                            variant="ghost"
                            size="md"
                            onClick={() => edit(post)}
                          >
                            {t("admin.edit")}
                          </Button>
                          <ConfirmDeleteButton
                            label={t("admin.delete")}
                            confirmMessage={t("admin.confirmDeleteContent", {
                              title: post.title,
                            })}
                            onConfirm={() => remove(post.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
