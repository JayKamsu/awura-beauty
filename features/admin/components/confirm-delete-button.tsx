"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

type ConfirmDeleteButtonProps = {
  label: string;
  confirmMessage: string;
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
};

export function ConfirmDeleteButton({
  label,
  confirmMessage,
  onConfirm,
  disabled,
}: ConfirmDeleteButtonProps) {
  const { t } = useTranslation();

  return (
    <Button
      type="button"
      variant="accent-outline"
      disabled={disabled}
      onClick={() => {
        const ok = window.confirm(confirmMessage);
        if (ok) void onConfirm();
      }}
    >
      {label || t("admin.delete")}
    </Button>
  );
}
