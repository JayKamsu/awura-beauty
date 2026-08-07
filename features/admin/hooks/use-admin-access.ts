"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/context/auth-provider";
import { useAdminFetch } from "@/features/admin/lib/admin-fetch";

type AdminAccess = {
  isAdmin: boolean;
  loading: boolean;
};

/**
 * Vérifie les droits admin via l’API serveur (`ADMIN_EMAILS` + `app_metadata.role`).
 * Ne jamais se fier uniquement au client pour l’allowlist e-mail.
 */
export function useAdminAccess(): AdminAccess {
  const { user, loading: authLoading } = useAuth();
  const adminFetch = useAdminFetch();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    void adminFetch("/api/admin/me")
      .then((res) => {
        if (!cancelled) setIsAdmin(res.ok);
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [adminFetch, authLoading, user]);

  return { isAdmin, loading };
}
