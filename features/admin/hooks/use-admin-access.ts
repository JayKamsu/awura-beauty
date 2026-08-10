"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/context/auth-provider";
import { useAdminFetch } from "@/features/admin/lib/admin-fetch";

/** Résultat du contrôle des droits admin : statut et indicateur de chargement. */
type AdminAccess = {
  isAdmin: boolean;
  loading: boolean;
};

/**
 * Droits admin pour l’UI :
 * - `app_metadata.role === "admin"` (JWT) → affichage immédiat
 * - confirmation serveur via `/api/admin/me` (`ADMIN_EMAILS` + rôle)
 */
export function useAdminAccess(): AdminAccess {
  const { user, loading: authLoading } = useAuth();
  const adminFetch = useAdminFetch();
  const roleHint = user?.app_metadata?.role === "admin";
  const [apiAdmin, setApiAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setApiAdmin(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    void adminFetch("/api/admin/me")
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          setApiAdmin(false);
          return;
        }
        const json = (await res.json()) as { ok?: boolean };
        setApiAdmin(Boolean(json.ok));
      })
      .catch(() => {
        if (!cancelled) setApiAdmin(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [adminFetch, authLoading, user]);

  return {
    isAdmin: roleHint || apiAdmin,
    loading: authLoading || loading,
  };
}
