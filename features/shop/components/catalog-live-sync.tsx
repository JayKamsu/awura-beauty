"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CATALOG_SYNC_CHANNEL } from "@/lib/application/catalog-sync";
import { createSupabaseClient } from "@/lib/infrastructure/supabase/client";

function isCatalogPath(pathname: string) {
  return (
    pathname === "/boutique" ||
    pathname.startsWith("/boutique/") ||
    pathname === "/recherche" ||
    pathname.startsWith("/recherche")
  );
}

/** Rafraîchit les pages boutique ouvertes dès qu’un produit change (admin ou Realtime). */
export function CatalogLiveSync() {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    let debounce: number | undefined;

    const refresh = () => {
      if (!isCatalogPath(pathnameRef.current)) return;
      window.clearTimeout(debounce);
      debounce = window.setTimeout(() => {
        router.refresh();
      }, 120);
    };

    const broadcast =
      typeof BroadcastChannel === "undefined"
        ? null
        : new BroadcastChannel(CATALOG_SYNC_CHANNEL);
    if (broadcast) broadcast.onmessage = refresh;

    const supabase = createSupabaseClient();
    const realtime = supabase
      ?.channel("catalog-products")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        refresh,
      )
      .subscribe();

    return () => {
      window.clearTimeout(debounce);
      broadcast?.close();
      if (supabase && realtime) void supabase.removeChannel(realtime);
    };
  }, [router]);

  return null;
}
