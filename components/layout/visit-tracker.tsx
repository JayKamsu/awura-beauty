"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const VISITOR_KEY = "awura_aid";
const SESSION_KEY = "awura_sid";
const SENT_KEY = "awura_visit_sent";

function readOrCreateId(storage: Storage, key: string): string {
  const existing = storage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  storage.setItem(key, id);
  return id;
}

/**
 * Envoie une visite de session (identifiant local anonyme, page d’arrivée,
 * référent / UTM) pour le tableau de bord admin. Une fois par onglet.
 */
export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname.startsWith("/admin") || pathname.startsWith("/auth")) return;
    try {
      if (sessionStorage.getItem(SENT_KEY)) return;
      sessionStorage.setItem(SENT_KEY, "1");
      const params = new URLSearchParams(window.location.search);
      void fetch("/api/analytics/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorId: readOrCreateId(localStorage, VISITOR_KEY),
          sessionId: readOrCreateId(sessionStorage, SESSION_KEY),
          path: pathname || "/",
          referrer: document.referrer,
          utmSource: params.get("utm_source") ?? "",
        }),
        keepalive: true,
        credentials: "omit",
      });
    } catch {
      /* stockage indisponible */
    }
  }, [pathname]);

  return null;
}
