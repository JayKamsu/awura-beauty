"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

type DocumentPreviewModalProps = {
  title: string;
  /** URL PDF/image ou page HTML (reçus). */
  url: string;
  subtitle?: string | null;
  onClose: () => void;
};

export function DocumentPreviewModal({
  title,
  url,
  subtitle,
  onClose,
}: DocumentPreviewModalProps) {
  const { t } = useTranslation();
  const lower = url.toLowerCase();
  const isImage =
    lower.includes(".png") ||
    lower.includes(".jpg") ||
    lower.includes(".jpeg") ||
    lower.includes(".webp");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <p className="font-serif text-lg text-primary">{title}</p>
            {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-primary px-4 py-2 text-sm font-medium uppercase text-primary transition hover:bg-primary/10"
            >
              {t("common.openInNewTab")}
            </a>
            <Button type="button" variant="ghost" size="md" onClick={onClose}>
              {t("common.close")}
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 bg-background-alt p-3">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={title}
              className="mx-auto max-h-[70vh] w-auto max-w-full rounded-xl border border-border bg-background object-contain"
            />
          ) : (
            <iframe
              title={title}
              src={url}
              className="h-[70vh] w-full rounded-xl border border-border bg-background"
            />
          )}
        </div>
      </div>
    </div>
  );
}
