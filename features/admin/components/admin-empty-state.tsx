"use client";

import type { ReactNode } from "react";

/** Props de l'état vide admin : message et action optionnelle. */
type AdminEmptyStateProps = {
  message: string;
  action?: ReactNode;
};

/** Message générique affiché quand une liste admin ne contient aucun résultat. */
export function AdminEmptyState({ message, action }: AdminEmptyStateProps) {
  return (
    <div className="rounded-2xl bg-background-alt px-6 py-10 text-center">
      <p className="text-muted">{message}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
