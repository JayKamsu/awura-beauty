"use client";

import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

type AdminModalProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

/** Modal admin : plein écran sur mobile, centrée sur desktop. */
export function AdminModal({
  title,
  onClose,
  children,
  footer,
}: AdminModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-stretch justify-center bg-foreground/40 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex h-full w-full max-w-3xl flex-col overflow-hidden bg-background shadow-lg sm:h-auto sm:max-h-[90vh] sm:rounded-2xl sm:border sm:border-border">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-background px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <h2 className="min-w-0 truncate font-serif text-xl text-primary">
            {title}
          </h2>
          <Button
            type="button"
            variant="ghost"
            className="shrink-0"
            onClick={onClose}
          >
            {t("admin.cancel")}
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-6">
          {children}
        </div>
        {footer ? (
          <div className="sticky bottom-0 z-10 flex flex-col-reverse gap-2 border-t border-border bg-background px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:gap-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
