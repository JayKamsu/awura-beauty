"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useActionLock } from "@/lib/hooks/use-action-lock";

/** Props du bouton de suppression avec confirmation inline. */
type ConfirmDeleteButtonProps = {
  label: string;
  confirmMessage: string;
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
};

/** Bouton de suppression exigeant une confirmation explicite avant d'exécuter l'action irréversible. */
export function ConfirmDeleteButton({
  label,
  confirmMessage,
  onConfirm,
  disabled,
}: ConfirmDeleteButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { locked: pending, run } = useActionLock();

  if (!open) {
    return (
      <Button
        type="button"
        variant="accent-outline"
        className="min-h-11 flex-1 sm:flex-none"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        {label || t("admin.delete")}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-background-alt p-3 sm:flex-row sm:items-center">
      <p className="text-sm text-muted">{confirmMessage}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="accent-outline"
          pending={pending}
          disabled={disabled}
          onClick={() => {
            void run(async () => {
              await onConfirm();
              setOpen(false);
            });
          }}
        >
          {pending ? t("admin.deleting") : t("admin.confirmDeleteAction")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={() => setOpen(false)}
        >
          {t("admin.cancel")}
        </Button>
      </div>
    </div>
  );
}
